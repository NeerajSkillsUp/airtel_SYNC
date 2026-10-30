"""Pydantic schemas used by the Smart KYC API."""

from typing import Literal

from pydantic import BaseModel, Field


DocumentType = Literal["gst", "udyam", "id", "utility_bill"]


class DPDPConsentRequest(BaseModel):
    lead_id: str = Field(min_length=1)
    consent_given: bool
    purpose: str = Field(min_length=1)
    timestamp: str = Field(min_length=1)
    data_minimization_ack: bool


class DPDPConsentResponse(BaseModel):
    consent_id: str
    lead_id: str
    consent_given: bool
    purpose: str
    timestamp: str
    data_minimization_ack: bool


class KYCDocumentVerificationResponse(BaseModel):
    document_type: DocumentType
    filename: str
    extracted_fields: dict[str, str | None]
    verification_status: Literal["PASS", "FLAGGED"]
    flag_reasons: list[str]
    drop_reasons: list[str]
    ocr_engine: str


class KYCApplicantVerificationResponse(BaseModel):
    applicant_id: str
    verification_status: Literal["PASS", "FLAGGED"]
    documents: list[KYCDocumentVerificationResponse]
    missing_documents: list[DocumentType]
    flag_reasons: list[str]
    drop_reasons: list[str]
