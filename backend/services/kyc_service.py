"""OCR-backed KYC document extraction and verification."""

from __future__ import annotations

import logging
import os
import re
import sqlite3
import threading
import uuid
from dataclasses import asdict, dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Literal

from PIL import Image, UnidentifiedImageError

DocumentType = Literal["gst", "udyam", "id", "utility_bill"]

logger = logging.getLogger(__name__)

try:
    import pytesseract
    from pytesseract import TesseractNotFoundError
except ImportError:  # Tesseract integration is optional at runtime.
    pytesseract = None

    class TesseractNotFoundError(RuntimeError):
        """Fallback exception when pytesseract is not installed."""


_EASYOCR_READER: Any | None = None
_EASYOCR_LOCK = threading.Lock()

VerificationStatus = Literal["PASS", "FLAGGED"]
REFERENCE_DATE = date(2026, 7, 15)
ADDRESS_PROOF_MAX_AGE = timedelta(days=90)
MAX_IMAGE_BYTES = 10 * 1024 * 1024


class ApplicantNotFoundError(LookupError):
    """Raised when an applicant has no matching local test documents."""


@dataclass
class DocumentVerification:
    """Verification outcome for one document."""

    document_type: DocumentType
    filename: str
    extracted_fields: dict[str, str | None]
    verification_status: VerificationStatus
    flag_reasons: list[str]
    drop_reasons: list[str]
    ocr_engine: str


class KYCService:
    """Extracts fields from KYC images and validates them against mock registries."""

    _GSTIN_PATTERN = re.compile(
        r"\b\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]\b", re.IGNORECASE
    )
    _GSTIN_CANDIDATE_PATTERN = re.compile(r"\b[A-Z0-9]{15}\b", re.IGNORECASE)
    _UDYAM_PATTERN = re.compile(
        r"\bUDYAM\s*-\s*[A-Z]{2}\s*-\s*\d{2}\s*-\s*\d{7}\b",
        re.IGNORECASE,
    )
    _DATE_PATTERN = re.compile(
        r"\b(?:\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4})\b"
    )
    _ID_PATTERN = re.compile(
        r"\b(?:[A-Z]{5}\d{4}[A-Z]|(?:\d{4}[\s-]?){2}\d{4}|"
        r"[A-Z0-9][A-Z0-9/-]{5,19})\b",
        re.IGNORECASE,
    )
    _IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp"}
    _DOCUMENT_NAME_MARKERS: dict[DocumentType, tuple[str, ...]] = {
        "gst": ("gst",),
        "udyam": ("udyam",),
        "id": ("signatory_id", "signatory-id", "signatory id", "identity"),
        "utility_bill": (
            "utility_bill",
            "utility-bill",
            "address_proof",
            "address-proof",
            "electricity_bill",
            "electricity-bill",
        ),
    }

    def __init__(
        self,
        data_service: Any,
        documents_directory: Path | None = None,
        consent_database: Path | None = None,
        reference_date: date = REFERENCE_DATE,
    ) -> None:
        self.data_service = data_service
        self.documents_directory = documents_directory or (
            data_service.data_directory / "kyc_documents"
        )
        self.consent_database = consent_database or (
            Path(
                os.getenv(
                    "KYC_CONSENT_DB",
                    str(Path(__file__).resolve().parents[1] / "data" / "kyc_consents.sqlite3"),
                )
            )
        )
        self.reference_date = reference_date

    @classmethod
    def extract_fields_from_text(cls, text: str) -> dict[str, str | None]:
        """Extract common KYC fields from OCR text using label-aware patterns."""
        lines = cls._clean_ocr_lines(text.splitlines())
        joined_text = "\n".join(lines)
        upper_text = joined_text.upper()
        gstin = cls._extract_gstin(upper_text)
        udyam_number = cls._extract_udyam(upper_text)
        bill_date = cls._labeled_value(
            lines,
            (
                r"bill\s*date",
                r"date\s*of\s*bill",
                r"invoice\s*date",
                r"date\s*of\s*issue",
            ),
        )
        if not bill_date:
            bill_date = cls._date_near_label(lines, ("electricity bill", "bill"))

        legal_name = cls._labeled_value(
            lines,
            (r"legal\s*name", r"registered\s*name", r"enterprise\s*name"),
        )
        trade_name = cls._labeled_value(lines, (r"trade\s*name",))
        signatory_name = cls._labeled_value(
            lines,
            (
                r"name\s*of\s*(?:the\s*)?(?:signatory|applicant|holder)",
                r"name\s*of\s*authorized\s*signatory",
                r"signatory\s*name",
                r"applicant\s*name",
                r"holder\s*name",
            ),
        )
        signatory_id = cls._extract_id_number(lines)
        if not signatory_name and signatory_id:
            signatory_name = cls._labeled_value(
                lines, (r"name\b",)
            )

        return {
            "gstin": gstin,
            "udyam_number": udyam_number,
            "legal_name": legal_name,
            "trade_name": trade_name,
            "bill_date": bill_date,
            "signatory_id_no": signatory_id,
            "signatory_name": signatory_name,
        }

    @staticmethod
    def _clean_ocr_lines(raw_lines: list[str]) -> list[str]:
        noise = {
            "CIMEN",
            "DOCUMENT",
            "FICTHETIC",
            "NOT",
            "SPECIMEN",
            "SYNTHETIC",
            "VALID",
        }
        lines = [
            line.strip()
            for line in raw_lines
            if line.strip()
            and re.sub(r"[^A-Z]", "", line.upper()) not in noise
        ]
        split_label_pairs = {
            ("legal", "name"),
            ("trade", "name"),
            ("enterprise", "name"),
            ("bill", "date"),
            ("invoice", "date"),
            ("major", "activity"),
            ("id", "no"),
        }
        merged: list[str] = []
        index = 0
        while index < len(lines):
            if index + 1 < len(lines):
                pair = (
                    re.sub(r"[^a-z]", "", lines[index].casefold()),
                    re.sub(r"[^a-z]", "", lines[index + 1].casefold()),
                )
                if pair in split_label_pairs:
                    merged.append(f"{lines[index]} {lines[index + 1]}")
                    index += 2
                    continue
            merged.append(lines[index])
            index += 1
        return merged

    @classmethod
    def _extract_gstin(cls, text: str) -> str | None:
        confusion_map = str.maketrans(
            {"O": "0", "Q": "0", "I": "1", "L": "1", "S": "5", "B": "8", "Z": "2"}
        )
        numeric_positions = (0, 1, 7, 8, 9, 10)

        def normalize(candidate: str) -> str | None:
            if len(candidate) != 15:
                return None
            normalized = list(candidate)
            for position in numeric_positions:
                normalized[position] = normalized[position].translate(confusion_map)
            if normalized[13] == "2":
                normalized[13] = "Z"
            value = "".join(normalized)
            if cls._GSTIN_PATTERN.fullmatch(value):
                return value

        direct_match = cls._GSTIN_PATTERN.search(text)
        if direct_match:
            return direct_match.group(0).upper()

        candidates = [
            match.group(0).upper()
            for match in cls._GSTIN_CANDIDATE_PATTERN.finditer(text.upper())
        ]
        lines = text.splitlines()
        for index, line in enumerate(lines):
            label_match = re.search(r"\bGSTIN\b", line, re.IGNORECASE)
            if not label_match:
                continue
            fragments = [line[label_match.end() :], *lines[index + 1 : index + 10]]
            fragments = [
                fragment
                for fragment in fragments
                if re.sub(r"[^A-Z]", "", fragment.upper())
                not in {"LEGAL", "NAME", "TRADE", "CIMEN", "SPECIMEN", "NO"}
            ]
            compact = "".join(
                "".join(re.findall(r"[A-Z0-9]+", fragment.upper()))
                for fragment in fragments
            )
            compact = re.sub(r"^NO", "", compact)
            candidates.extend(
                compact[start : start + 15]
                for start in range(max(0, len(compact) - 14))
            )

        for candidate in candidates:
            value = normalize(candidate)
            if value:
                return value
        return None

    @classmethod
    def _extract_udyam(cls, text: str) -> str | None:
        match = cls._UDYAM_PATTERN.search(text)
        return re.sub(r"\s+", "", match.group(0)).upper() if match else None

    @staticmethod
    def _gstin_registry_candidates(gstin: str) -> list[str]:
        confusions = {
            "O": "0",
            "Q": "0",
            "I": "1",
            "L": "1",
            "S": "5",
            "B": "8",
            "0": "O",
            "1": "I",
            "5": "S",
            "8": "B",
        }
        candidates = [gstin]
        for position in (12, 14):
            current = gstin[position]
            replacement = confusions.get(current)
            if replacement:
                candidate = f"{gstin[:position]}{replacement}{gstin[position + 1:]}"
                candidates.append(candidate)
        if len(candidates) == 3:
            first, second = candidates[1:]
            candidates.append(
                f"{first[:14]}{second[14]}"
            )
        return list(dict.fromkeys(candidates))

    @staticmethod
    def _labeled_value(lines: list[str], labels: tuple[str, ...]) -> str | None:
        following_labels = (
            r"gstin",
            r"udyam(?:\s+registration(?:\s+(?:no|number))?|\s+reg\.?\s+(?:no|number))?",
            r"legal\s+name",
            r"registered\s+name",
            r"enterprise\s+name",
            r"trade\s+name",
            r"bill\s+date",
            r"date\s+of\s+bill",
            r"invoice\s+date",
            r"date\s+of\s+issue",
            r"name\s+of\s+(?:the\s+)?(?:signatory|applicant|holder)",
            r"name\s+of\s+authorized\s+signatory",
            r"name\b",
            r"signatory\s+name",
            r"applicant\s+name",
            r"holder\s+name",
            r"(?:aadhaar|aadhar|pan|id\s*(?:no|number))",
            r"major\s+activity",
            r"constitution",
            r"address",
            r"city",
            r"state",
            r"date\s+of\s+registration",
            r"type\s+of\s+registration",
            r"designation",
            r"valid\s+till",
            r"consumer\s+(?:no|number)",
            r"billed\s+to",
            r"supply\s+address",
            r"units\s+consumed",
            r"amount\s+due",
        )
        next_field_pattern = re.compile(
            rf"^\s*[^A-Za-z0-9]*?(?:{'|'.join(following_labels)})\b",
            re.IGNORECASE,
        )
        for line_index, line in enumerate(lines):
            for label in labels:
                match = re.match(
                    rf"^\s*(?:{label})\s*[:#\-]?\s*(.*?)\s*$",
                    line,
                    re.IGNORECASE,
                )
                if match:
                    value = match.group(1).strip(" :-#")
                    if value:
                        return value
                    continuation: list[str] = []
                    for following in lines[line_index + 1 : line_index + 4]:
                        if next_field_pattern.match(following):
                            break
                        continuation.append(following)
                    if continuation:
                        return " ".join(continuation).strip(" :-#")
        return None

    @classmethod
    def _date_near_label(
        cls, lines: list[str], labels: tuple[str, ...]
    ) -> str | None:
        for index, line in enumerate(lines):
            if any(label in line.lower() for label in labels):
                for candidate in (line, *lines[index + 1 : index + 3]):
                    match = cls._DATE_PATTERN.search(candidate)
                    if match:
                        return match.group(0)
        return None

    @classmethod
    def _extract_id_number(cls, lines: list[str]) -> str | None:
        labels = (
            "aadhaar",
            "aadhar",
            "pan",
            "id no",
            "id number",
        )
        for index, line in enumerate(lines):
            matched_label = next(
                (label for label in labels if label in line.lower()), None
            )
            if matched_label:
                value_after_label = re.sub(
                    r".*?(?:aadhaar|aadhar|pan|id\s*no|id\s*number)"
                    r"\s*(?:no\.?|number)?\s*[:#\-]?\s*",
                    "",
                    line,
                    flags=re.IGNORECASE,
                )
                for candidate in (line, *lines[index + 1 : index + 2]):
                    text_to_search = (
                        value_after_label if candidate == line else candidate
                    )
                    match = cls._ID_PATTERN.search(text_to_search.upper())
                    if match:
                        value = match.group(0).strip()
                        if value.lower() not in {"aadhaar", "aadhar", "number"}:
                            return value
        return None

    @staticmethod
    def _metadata_text(image: Image.Image) -> str:
        metadata_values = (
            image.info.get("ocr_text"),
            image.info.get("Description"),
            image.info.get("description"),
            image.info.get("Comment"),
            image.info.get("comment"),
        )
        return "\n".join(str(value) for value in metadata_values if value)

    def _read_image_text(self, image_bytes: bytes) -> tuple[str, str]:
        if not image_bytes:
            raise ValueError("The uploaded file is empty.")
        if len(image_bytes) > MAX_IMAGE_BYTES:
            raise ValueError("The image exceeds the 10 MB upload limit.")
        try:
            from io import BytesIO
            from PIL import ImageOps

            with Image.open(BytesIO(image_bytes)) as image:
                image.load()
                metadata_text = self._metadata_text(image)
                ocr_errors: list[str] = []
                try:
                    import easyocr
                    import numpy as np

                    global _EASYOCR_READER
                    with _EASYOCR_LOCK:
                        if _EASYOCR_READER is None:
                            model_directory = os.getenv("EASYOCR_MODEL_DIR")
                            _EASYOCR_READER = easyocr.Reader(
                                ["en"],
                                gpu=False,
                                model_storage_directory=model_directory or None,
                                verbose=False,
                            )
                        reader = _EASYOCR_READER
                    prepared = ImageOps.autocontrast(image.convert("RGB"))
                    longest_side = max(prepared.size)
                    if longest_side > 2400:
                        scale = 2400 / longest_side
                        prepared = prepared.resize(
                            (
                                max(1, round(prepared.width * scale)),
                                max(1, round(prepared.height * scale)),
                            )
                        )
                    with _EASYOCR_LOCK:
                        recognized = reader.readtext(
                            np.asarray(prepared), detail=0, paragraph=False
                        )
                    easyocr_text = "\n".join(
                        value.strip() for value in recognized if value.strip()
                    )
                    if easyocr_text:
                        return easyocr_text, "easyocr"
                except Exception as error:
                    logger.warning("EasyOCR could not read the image: %s", error)
                    ocr_errors.append(f"EasyOCR: {error}")
                if pytesseract is not None:
                    try:
                        tesseract_text = pytesseract.image_to_string(image)
                        if tesseract_text.strip():
                            return tesseract_text, "tesseract"
                    except (TesseractNotFoundError, OSError, RuntimeError) as error:
                        logger.warning("Tesseract could not read the image: %s", error)
                        ocr_errors.append(f"Tesseract: {error}")
                if metadata_text:
                    return metadata_text, "image_metadata_regex_fallback"
                if ocr_errors:
                    logger.info("All installed OCR engines failed: %s", "; ".join(ocr_errors))
                return "", "ocr_unavailable"
        except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as error:
            raise ValueError(f"Unable to read image: {error}") from error

    @staticmethod
    def _normalize_name(value: str | None) -> str:
        if not value:
            return ""
        normalized = re.sub(
            r"\b(?:prop|proprietor|mr|mrs|ms|miss|dr)\b",
            " ",
            value,
            flags=re.I,
        )
        return re.sub(r"[^a-z0-9]+", " ", normalized.lower()).strip()

    @classmethod
    def _names_match(cls, left: str | None, right: str | None) -> bool:
        normalized_left = cls._normalize_name(left)
        normalized_right = cls._normalize_name(right)
        if not normalized_left or not normalized_right:
            return False
        if normalized_left == normalized_right:
            return True
        left_tokens = set(normalized_left.split())
        right_tokens = set(normalized_right.split())
        smaller, larger = sorted(
            (left_tokens, right_tokens), key=len
        )
        return len(smaller) >= 2 and smaller.issubset(larger)

    @staticmethod
    def _parse_date(value: str | None) -> date | None:
        if not value:
            return None
        for date_format in ("%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%d/%m/%Y"):
            try:
                return datetime.strptime(value.strip(), date_format).date()
            except ValueError:
                continue
        return None

    def verify_document(
        self,
        image_bytes: bytes,
        document_type: DocumentType,
        filename: str,
        *,
        applicant_id: str | None = None,
        gstin: str | None = None,
        udyam_number: str | None = None,
        expected_name: str | None = None,
    ) -> DocumentVerification:
        """Extract and validate one uploaded image without persisting its contents."""
        flag_reasons: list[str] = []
        drop_reasons: list[str] = []
        try:
            text, ocr_engine = self._read_image_text(image_bytes)
            fields = self.extract_fields_from_text(text)
            if not text.strip():
                flag_reasons.append(
                    "OCR is unavailable and the image contains no embedded text; fields could not be extracted."
                )
        except ValueError as error:
            fields = self.extract_fields_from_text("")
            ocr_engine = "unavailable"
            flag_reasons.append(str(error))

        if document_type == "gst":
            self._verify_gst(fields, flag_reasons, drop_reasons)
        elif document_type == "udyam":
            self._verify_udyam(fields, flag_reasons, drop_reasons)
        elif document_type == "utility_bill":
            self._verify_utility_bill(fields, flag_reasons)
        elif document_type == "id":
            if not fields["signatory_name"]:
                flag_reasons.append("Signatory name could not be extracted from the ID.")
            if not fields["signatory_id_no"]:
                flag_reasons.append("Signatory ID number could not be extracted.")

        if document_type == "id":
            reference_names = self._registry_names(gstin, udyam_number)
            if expected_name:
                reference_names.append(expected_name)
            if reference_names and fields["signatory_name"] and not any(
                self._names_match(fields["signatory_name"], name)
                for name in reference_names
            ):
                flag_reasons.append(
                    "Signatory name does not match the supplied GST/Udyam or applicant name."
                )

        return DocumentVerification(
            document_type=document_type,
            filename=filename,
            extracted_fields=self._public_fields(fields),
            verification_status="FLAGGED" if flag_reasons else "PASS",
            flag_reasons=self._unique(flag_reasons),
            drop_reasons=self._unique(drop_reasons),
            ocr_engine=ocr_engine,
        )

    def _verify_gst(
        self,
        fields: dict[str, str | None],
        flag_reasons: list[str],
        drop_reasons: list[str],
    ) -> None:
        gstin = fields["gstin"]
        if not gstin:
            flag_reasons.append("GSTIN could not be extracted from the certificate.")
            return
        if len(gstin) != 15 or gstin[5] != "X":
            flag_reasons.append(
                "GSTIN format is invalid for this dataset; its 4th embedded-PAN character must be X."
            )
            return
        record = None
        for candidate in self._gstin_registry_candidates(gstin):
            try:
                record = self.data_service.get_gstin(candidate)
                break
            except LookupError:
                continue
        if record is None:
            flag_reasons.append("Extracted GSTIN was not found in the mock GST registry.")
            return
        fields["gstin"] = str(record["gstin"])
        status = str(record["status"])
        if status in {"Cancelled", "Suspended"}:
            reason = f"GST registration status is {status}."
            flag_reasons.append(reason)
            drop_reasons.append(reason)
        if fields["legal_name"] and not any(
            self._names_match(fields["legal_name"], record[name])
            for name in ("legal_name", "trade_name")
        ):
            flag_reasons.append("GST certificate legal name does not match the registry.")
        if fields["trade_name"] and not self._names_match(
            fields["trade_name"], record["trade_name"]
        ):
            flag_reasons.append("GST certificate trade name does not match the registry.")

    def _verify_udyam(
        self,
        fields: dict[str, str | None],
        flag_reasons: list[str],
        drop_reasons: list[str],
    ) -> None:
        udyam_number = fields["udyam_number"]
        if not udyam_number:
            flag_reasons.append("Udyam registration number could not be extracted.")
            return
        try:
            record = self.data_service.get_udyam(udyam_number)
        except LookupError:
            flag_reasons.append("Extracted Udyam number was not found in the mock registry.")
            return
        if fields["legal_name"] and not self._names_match(
            fields["legal_name"], record["enterprise_name"]
        ):
            flag_reasons.append("Udyam enterprise name does not match the registry.")
        if fields["trade_name"] and not self._names_match(
            fields["trade_name"], record["enterprise_name"]
        ):
            flag_reasons.append("Udyam trade name does not match the registry.")

    def _verify_utility_bill(
        self, fields: dict[str, str | None], flag_reasons: list[str]
    ) -> None:
        bill_date = self._parse_date(fields["bill_date"])
        if bill_date is None:
            flag_reasons.append("Utility bill date could not be extracted or parsed.")
            return
        oldest_accepted_date = self.reference_date - ADDRESS_PROOF_MAX_AGE
        if bill_date < oldest_accepted_date or bill_date > self.reference_date:
            flag_reasons.append(
                "Utility bill date must be within 90 days before 2026-07-15."
            )

    def _registry_names(self, gstin: str | None, udyam_number: str | None) -> list[str]:
        names: list[str] = []
        if gstin:
            try:
                record = self.data_service.get_gstin(gstin)
                names.extend([record["legal_name"], record["trade_name"]])
            except LookupError:
                pass
        if udyam_number:
            try:
                names.append(self.data_service.get_udyam(udyam_number)["enterprise_name"])
            except LookupError:
                pass
        return names

    @staticmethod
    def _public_fields(
        fields: dict[str, str | None],
    ) -> dict[str, str | None]:
        public_fields = fields.copy()
        identifier = public_fields["signatory_id_no"]
        if identifier:
            visible_characters = 4
            public_fields["signatory_id_no"] = (
                "*" * max(0, len(identifier) - visible_characters)
                + identifier[-visible_characters:]
            )
        return public_fields

    @staticmethod
    def _unique(reasons: list[str]) -> list[str]:
        return list(dict.fromkeys(reasons))

    @staticmethod
    def _document_type_for(filename: str) -> DocumentType | None:
        normalized = filename.lower()
        for document_type, markers in KYCService._DOCUMENT_NAME_MARKERS.items():
            if any(marker in normalized for marker in markers):
                return document_type
        return None

    def _applicant_documents(self, applicant_id: str) -> list[Path]:
        if not re.fullmatch(r"K\d{2}", applicant_id, re.IGNORECASE):
            raise ApplicantNotFoundError(f"Unknown test applicant {applicant_id!r}.")
        applicant_id = applicant_id.upper()
        applicant_directory = self.documents_directory / applicant_id
        if applicant_directory.is_dir():
            files = [
                path for path in applicant_directory.iterdir()
                if path.is_file() and path.suffix.lower() in self._IMAGE_SUFFIXES
            ]
        elif self.documents_directory.is_dir():
            files = [
                path
                for path in self.documents_directory.iterdir()
                if path.is_file()
                and path.suffix.lower() in self._IMAGE_SUFFIXES
                and path.name.upper().startswith(f"{applicant_id}_")
            ]
        else:
            files = []
        if not files:
            raise ApplicantNotFoundError(
                f"No test documents were found for applicant {applicant_id}."
            )
        return sorted(files, key=lambda path: path.name.lower())

    def verify_test_applicant(self, applicant_id: str) -> dict[str, Any]:
        """Verify all recognized local test images belonging to one applicant."""
        documents = self._applicant_documents(applicant_id)
        results: list[DocumentVerification] = []
        found_document_types: set[DocumentType] = set()
        for path in documents:
            document_type = self._document_type_for(path.name)
            if document_type is None:
                continue
            found_document_types.add(document_type)
            try:
                if path.stat().st_size > MAX_IMAGE_BYTES:
                    raise ValueError("The image exceeds the 10 MB limit.")
                image_bytes = path.read_bytes()
                result = self.verify_document(
                    image_bytes,
                    document_type,
                    path.name,
                    applicant_id=applicant_id.upper(),
                )
            except (OSError, ValueError) as error:
                result = DocumentVerification(
                    document_type=document_type,
                    filename=path.name,
                    extracted_fields=self._public_fields(
                        self.extract_fields_from_text("")
                    ),
                    verification_status="FLAGGED",
                    flag_reasons=[f"Unable to read document: {error}"],
                    drop_reasons=[],
                    ocr_engine="unavailable",
                )
            results.append(result)

        if not results:
            raise ApplicantNotFoundError(
                f"No recognized KYC document images were found for {applicant_id}."
            )

        expected_document_types: tuple[DocumentType, ...] = (
            "gst",
            "udyam",
            "id",
            "utility_bill",
        )
        missing_documents = [
            document_type
            for document_type in expected_document_types
            if document_type not in found_document_types
        ]
        registry_names: list[str] = []
        extracted_gstin: str | None = None
        extracted_udyam: str | None = None
        for result in results:
            extracted_gstin = extracted_gstin or result.extracted_fields.get("gstin")
            extracted_udyam = extracted_udyam or result.extracted_fields.get("udyam_number")
        registry_names.extend(self._registry_names(extracted_gstin, extracted_udyam))

        for result in results:
            if result.document_type != "id":
                continue
            signatory_name = result.extracted_fields.get("signatory_name")
            if not signatory_name:
                continue
            if registry_names and not any(
                self._names_match(signatory_name, name) for name in registry_names
            ):
                result.flag_reasons.append(
                    "Signatory name does not match the legal/trade name on the GST/Udyam registry."
                )
                result.flag_reasons = self._unique(result.flag_reasons)
                result.verification_status = "FLAGGED"

        flags = self._unique(
            [reason for result in results for reason in result.flag_reasons]
            + [
                f"Missing required {document_type} document."
                for document_type in missing_documents
            ]
        )
        drops = self._unique(
            [reason for result in results for reason in result.drop_reasons]
        )
        return {
            "applicant_id": applicant_id.upper(),
            "verification_status": "FLAGGED" if flags else "PASS",
            "documents": [asdict(result) for result in results],
            "missing_documents": missing_documents,
            "flag_reasons": flags,
            "drop_reasons": drops,
        }

    def record_consent(self, request: Any) -> dict[str, Any]:
        """Persist a minimal DPDP consent receipt without retaining document content."""
        self.consent_database.parent.mkdir(parents=True, exist_ok=True)
        consent_id = str(uuid.uuid4())
        with sqlite3.connect(self.consent_database) as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS kyc_consents (
                    consent_id TEXT PRIMARY KEY,
                    lead_id TEXT NOT NULL,
                    consent_given INTEGER NOT NULL,
                    purpose TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    data_minimization_ack INTEGER NOT NULL
                )
                """
            )
            connection.execute(
                """
                INSERT INTO kyc_consents
                (consent_id, lead_id, consent_given, purpose, timestamp, data_minimization_ack)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    consent_id,
                    request.lead_id,
                    int(request.consent_given),
                    request.purpose,
                    request.timestamp,
                    int(request.data_minimization_ack),
                ),
            )
        return {"consent_id": consent_id, **request.model_dump()}
