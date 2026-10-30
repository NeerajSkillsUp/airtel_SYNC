"""CSV-backed data access for the SMB advisor API."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd


class DataLoadError(RuntimeError):
    """Raised when a source CSV is missing or does not match its expected schema."""


class RecordNotFoundError(LookupError):
    """Raised when a requested identifier is not present in the loaded data."""


class DataService:
    """Loads source datasets once and exposes indexed lookups."""

    _REQUIRED_COLUMNS = {
        "products": {
            "product_id",
            "category",
            "product_name",
            "description",
            "unit",
            "price_min_inr_per_month",
            "price_max_inr_per_month",
            "one_time_setup_inr",
            "min_contract_months",
            "available_city_tiers",
            "min_employees",
            "min_sites",
            "requires_gstin",
            "requires_one_of",
            "typical_install_days",
            "target_segments",
        },
        "gstin": {
            "gstin",
            "legal_name",
            "trade_name",
            "principal_place_of_business",
            "state",
            "registration_date",
            "status",
        },
        "udyam": {
            "udyam_number",
            "enterprise_name",
            "major_activity",
            "state",
            "city",
            "date_of_registration",
        },
        "leads": {"lead_id"},
    }

    def __init__(self, data_directory: Path | None = None) -> None:
        self.data_directory = data_directory or Path(__file__).resolve().parents[2]
        self.products: pd.DataFrame
        self.gstin_registry: pd.DataFrame
        self.udyam_registry: pd.DataFrame
        self.leads: pd.DataFrame
        self._product_by_id: dict[str, dict[str, Any]]
        self._gstin_by_number: dict[str, dict[str, Any]]
        self._udyam_by_number: dict[str, dict[str, Any]]
        self._lead_by_id: dict[str, dict[str, Any]]
        self.load()

    def load(self) -> None:
        """Read and validate the four source datasets and build lookup indexes."""
        self.products = self._read_csv("product_catalogue.csv", "products")
        self.gstin_registry = self._read_csv("mock_gstin_registry.csv", "gstin")
        self.udyam_registry = self._read_csv("mock_udyam_registry.csv", "udyam")
        self.leads = self._read_csv("smb_leads.csv", "leads")

        self._product_by_id = self._build_index(self.products, "product_id")
        self._gstin_by_number = self._build_index(self.gstin_registry, "gstin")
        self._udyam_by_number = self._build_index(self.udyam_registry, "udyam_number")
        self._lead_by_id = self._build_index(self.leads, "lead_id")

    def _read_csv(self, filename: str, dataset: str) -> pd.DataFrame:
        path = self.data_directory / filename
        try:
            frame = pd.read_csv(path, dtype=str, keep_default_na=False)
        except (OSError, pd.errors.ParserError, UnicodeDecodeError) as error:
            raise DataLoadError(f"Unable to load {path}: {error}") from error

        missing_columns = self._REQUIRED_COLUMNS[dataset].difference(frame.columns)
        if missing_columns:
            missing = ", ".join(sorted(missing_columns))
            raise DataLoadError(f"{path} is missing required columns: {missing}")
        return frame

    @staticmethod
    def _build_index(frame: pd.DataFrame, column: str) -> dict[str, dict[str, Any]]:
        if frame[column].duplicated().any():
            raise DataLoadError(f"Duplicate values found in identifier column {column!r}")
        return {
            str(row[column]): row
            for row in frame.to_dict(orient="records")
        }

    @staticmethod
    def _lookup(
        index: dict[str, dict[str, Any]], identifier: str, kind: str
    ) -> dict[str, Any]:
        record = index.get(identifier.strip())
        if record is None:
            raise RecordNotFoundError(f"{kind} record {identifier!r} was not found")
        return record

    def get_product(self, product_id: str) -> dict[str, Any]:
        return self._lookup(self._product_by_id, product_id, "Product")

    def get_gstin(self, gstin: str) -> dict[str, Any]:
        return self._lookup(self._gstin_by_number, gstin, "GSTIN")

    def get_udyam(self, udyam_number: str) -> dict[str, Any]:
        return self._lookup(self._udyam_by_number, udyam_number, "Udyam")

    def get_lead(self, lead_id: str) -> dict[str, Any]:
        return self._lookup(self._lead_by_id, lead_id, "Lead")
