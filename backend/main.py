"""FastAPI application for product discovery and SMB bundle recommendations."""

from __future__ import annotations

import json
import os
import sqlite3
from contextlib import asynccontextmanager
from typing import Annotated, Any, Literal

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

if __package__:
    from .services.data_service import DataService, RecordNotFoundError
    from .services.kyc_service import (
        MAX_IMAGE_BYTES,
        ApplicantNotFoundError,
        KYCService,
    )
    from .services.lead_scoring import LeadScoringService
    from .services.chat_service import ChatService
    from .schemas.kyc import (
        DPDPConsentRequest,
        DPDPConsentResponse,
        KYCApplicantVerificationResponse,
        KYCDocumentVerificationResponse,
    )
    from .schemas.dashboard import DashboardAnalytics, LeadRecoveryItem
else:
    from services.data_service import DataService, RecordNotFoundError
    from services.kyc_service import MAX_IMAGE_BYTES, ApplicantNotFoundError, KYCService
    from services.lead_scoring import LeadScoringService
    from services.chat_service import ChatService
    from schemas.kyc import (
        DPDPConsentRequest,
        DPDPConsentResponse,
        KYCApplicantVerificationResponse,
        KYCDocumentVerificationResponse,
    )
    from schemas.dashboard import DashboardAnalytics, LeadRecoveryItem

load_dotenv()

APP_NAME = "Project Udyam Digital"
APP_VERSION = "1.0.0"
DEFAULT_CORS_ORIGINS = (
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173"
)


class ProductResponse(BaseModel):
    product_id: str
    category: str
    product_name: str
    description: str
    unit: str
    price_min_inr_per_month: int
    price_max_inr_per_month: int
    one_time_setup_inr: int
    min_contract_months: int
    available_city_tiers: list[int]
    min_employees: int
    min_sites: int
    requires_gstin: bool
    requires_one_of: list[str]
    typical_install_days: int
    target_segments: list[str]


class GSTINLookupResponse(BaseModel):
    gstin: str
    status: Literal["Active", "Cancelled", "Suspended"]
    legal_name: str
    trade_name: str
    address: str


class UdyamLookupResponse(BaseModel):
    udyam_number: str
    enterprise_name: str
    major_activity: str
    city: str
    state: str
    registration_date: str


class BusinessProfile(BaseModel):
    business_type: str = Field(min_length=1)
    employee_count: int = Field(ge=1)
    num_sites: int = Field(ge=1)
    city_tier: int = Field(ge=1, le=2)
    state: str = Field(min_length=1)
    has_gstin: bool
    monthly_budget: float = Field(ge=0)
    key_needs: list[str] = Field(default_factory=list)


class RecommendedProduct(BaseModel):
    product: ProductResponse
    quantity: int
    monthly_cost_inr: int
    setup_fee_inr: int
    monthly_savings_inr: int


class RecommendationResponse(BaseModel):
    bundle_type: Literal["Micro", "Professional", "Multi-site", "Manufacturer"]
    bundle_description: str
    products: list[RecommendedProduct]
    total_monthly_cost_inr: int
    setup_fee_inr: int
    bundle_savings_inr: int
    monthly_budget_inr: float
    within_monthly_budget: bool
    unmet_needs: list[str]
    savings_basis: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    language: Literal["en", "hi", "te", "ta"] = "en"
    context: dict[str, Any] = Field(default_factory=dict)

    @field_validator("message")
    @classmethod
    def message_must_not_be_blank(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Message cannot be blank.")
        return normalized

    @field_validator("context")
    @classmethod
    def context_must_be_bounded(cls, value: dict[str, Any]) -> dict[str, Any]:
        if len(json.dumps(value, ensure_ascii=False)) > 12_000:
            raise ValueError("Chat context must be 12 KB or smaller.")
        return value


class ChatResponse(BaseModel):
    answer: str
    source_products: list[str]
    mode: Literal["local_genai", "catalogue_fallback"]


def _integer(row: dict[str, Any], column: str) -> int:
    try:
        return int(row[column])
    except (KeyError, TypeError, ValueError) as error:
        raise ValueError(f"Invalid integer value in product field {column!r}") from error


def _product_response(row: dict[str, Any]) -> ProductResponse:
    try:
        return ProductResponse(
            product_id=str(row["product_id"]),
            category=str(row["category"]),
            product_name=str(row["product_name"]),
            description=str(row["description"]),
            unit=str(row["unit"]),
            price_min_inr_per_month=_integer(row, "price_min_inr_per_month"),
            price_max_inr_per_month=_integer(row, "price_max_inr_per_month"),
            one_time_setup_inr=_integer(row, "one_time_setup_inr"),
            min_contract_months=_integer(row, "min_contract_months"),
            available_city_tiers=[
                int(tier) for tier in str(row["available_city_tiers"]).split(";") if tier
            ],
            min_employees=_integer(row, "min_employees"),
            min_sites=_integer(row, "min_sites"),
            requires_gstin=str(row["requires_gstin"]).strip().upper() == "Y",
            requires_one_of=[
                item for item in str(row["requires_one_of"]).split("|") if item
            ],
            typical_install_days=_integer(row, "typical_install_days"),
            target_segments=[
                segment for segment in str(row["target_segments"]).split(";") if segment
            ],
        )
    except (KeyError, TypeError, ValueError) as error:
        raise HTTPException(
            status_code=500, detail=f"Invalid product catalogue record: {error}"
        ) from error


def get_data_service(request: Request) -> DataService:
    return request.app.state.data_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    data_service = DataService()
    app.state.data_service = data_service
    app.state.kyc_service = KYCService(data_service)
    app.state.lead_scoring_service = LeadScoringService(data_service.data_directory)
    app.state.chat_service = ChatService(data_service.products)
    yield


app = FastAPI(
    title="SMB Product Advisor API",
    description="Product catalogue, registry lookups, and tailored SMB bundles.",
    version=APP_VERSION,
    lifespan=lifespan,
)

configured_origins = os.getenv("CORS_ORIGINS", "").strip()
if configured_origins:
    allowed_origins = [
        origin.strip() for origin in configured_origins.split(",") if origin.strip()
    ]
else:
    frontend_origin = os.getenv("FRONTEND_ORIGIN", "").strip()
    allowed_origins = (
        [frontend_origin]
        if frontend_origin
        else DEFAULT_CORS_ORIGINS.split(",")
    )
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check() -> dict[str, str]:
    """Report API health for deployment platforms and uptime checks."""
    return {
        "status": "online",
        "app": APP_NAME,
        "version": APP_VERSION,
    }


DataServiceDependency = Annotated[DataService, Depends(get_data_service)]


def get_kyc_service(request: Request) -> KYCService:
    return request.app.state.kyc_service


KYCServiceDependency = Annotated[KYCService, Depends(get_kyc_service)]


def get_lead_scoring_service(request: Request) -> LeadScoringService:
    return request.app.state.lead_scoring_service


LeadScoringServiceDependency = Annotated[
    LeadScoringService, Depends(get_lead_scoring_service)
]


def get_chat_service(request: Request) -> ChatService:
    return request.app.state.chat_service


ChatServiceDependency = Annotated[ChatService, Depends(get_chat_service)]


def _is_eligible(
    product: ProductResponse,
    city_tier: int,
    employee_count: int,
    num_sites: int,
    has_gstin: bool,
) -> bool:
    return (
        city_tier in product.available_city_tiers
        and employee_count >= product.min_employees
        and num_sites >= product.min_sites
        and (has_gstin or not product.requires_gstin)
    )


@app.get("/api/products", response_model=list[ProductResponse])
def list_products(
    data: DataServiceDependency,
    city_tier: Annotated[int | None, Query(ge=1, le=2)] = None,
    min_employees: Annotated[int | None, Query(ge=1)] = None,
    min_sites: Annotated[int | None, Query(ge=1)] = None,
    has_gstin: bool | None = None,
) -> list[ProductResponse]:
    products = [_product_response(row) for row in data.products.to_dict(orient="records")]
    eligible = [
        product
        for product in products
        if (city_tier is None or city_tier in product.available_city_tiers)
        and (min_employees is None or min_employees >= product.min_employees)
        and (min_sites is None or min_sites >= product.min_sites)
        and (has_gstin is not False or not product.requires_gstin)
    ]

    # A dependent product is exposed only when at least one eligible prerequisite is also listed.
    eligible_ids = {product.product_id for product in eligible}
    return [
        product
        for product in eligible
        if not product.requires_one_of
        or any(required_id in eligible_ids for required_id in product.requires_one_of)
    ]


@app.get("/api/lookup/gstin/{gstin}", response_model=GSTINLookupResponse)
def lookup_gstin(gstin: str, data: DataServiceDependency) -> GSTINLookupResponse:
    try:
        record = data.get_gstin(gstin)
    except RecordNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return GSTINLookupResponse(
        gstin=str(record["gstin"]),
        status=record["status"],
        legal_name=record["legal_name"],
        trade_name=record["trade_name"],
        address=record["principal_place_of_business"],
    )


@app.get("/api/lookup/udyam/{udyam_no}", response_model=UdyamLookupResponse)
def lookup_udyam(udyam_no: str, data: DataServiceDependency) -> UdyamLookupResponse:
    try:
        record = data.get_udyam(udyam_no)
    except RecordNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return UdyamLookupResponse(
        udyam_number=str(record["udyam_number"]),
        enterprise_name=record["enterprise_name"],
        major_activity=record["major_activity"],
        city=record["city"],
        state=record["state"],
        registration_date=record["date_of_registration"],
    )


def _bundle_type(profile: BusinessProfile) -> Literal[
    "Micro", "Professional", "Multi-site", "Manufacturer"
]:
    business_type = profile.business_type.lower()
    manufacturing_terms = (
        "manufactur",
        "factory",
        "moulding",
        "packaging unit",
        "textile unit",
        "printing press",
        "workshop",
        "food processing",
        "auto-parts",
    )
    professional_terms = (
        "law",
        "clinic",
        "lab",
        "studio",
        "firm",
        "agency",
        "hotel",
        "office",
        "coaching",
        "physiotherapy",
        "real estate",
    )
    if any(term in business_type for term in manufacturing_terms):
        return "Manufacturer"
    if profile.num_sites > 1:
        return "Multi-site"
    if any(term in business_type for term in professional_terms):
        return "Professional"
    return "Micro"


def _quantity(product: ProductResponse, profile: BusinessProfile) -> int:
    if product.unit == "per site":
        return profile.num_sites
    if product.product_id in {"P16", "P20"}:
        return profile.employee_count
    return 1


NEED_PRODUCTS: tuple[tuple[tuple[str, ...], str], ...] = (
    (("backup", "failover", "redundancy"), "P09"),
    (("sd-wan", "sdwan"), "P10"),
    (("static ip",), "P11"),
    (("telephony", "sip", "phone system"), "P12"),
    (("toll-free", "toll free"), "P13"),
    (("sms", "text message"), "P14"),
    (("whatsapp",), "P15"),
    (("email", "office suite", "productivity"), "P16"),
    (("cloud backup", "data backup"), "P17"),
    (("website", "domain"), "P18"),
    (("pos", "billing", "inventory"), "P19"),
    (("security", "antivirus", "endpoint"), "P20"),
    (("firewall",), "P21"),
    (("wi-fi", "wifi", "guest network"), "P22"),
    (("cctv", "camera", "surveillance"), "P23"),
    (("machine monitoring", "iot", "sensor"), "P24"),
    (("fleet", "gps tracker"), "P25"),
)


def _products_for_need(need: str) -> list[str]:
    normalized = need.strip().lower()
    if normalized in {f"p{number:02}" for number in range(1, 26)}:
        return [normalized.upper()]
    for phrases, product_id in NEED_PRODUCTS:
        if any(phrase in normalized for phrase in phrases):
            return [product_id]
    if any(term in normalized for term in ("internet", "fibre", "broadband", "connectivity")):
        return ["P01", "P02", "P03", "P04", "P05", "P06"]
    if "mobile" in normalized:
        return ["P07", "P08"]
    return []


def _bundle_seeds(bundle_type: str, business_type: str) -> tuple[list[str], list[list[str]]]:
    if bundle_type == "Micro":
        core = [["P01", "P04"], ["P07"]]
        if any(term in business_type.lower() for term in ("shop", "retail", "bakery", "salon")):
            core.append(["P19"])
    elif bundle_type == "Professional":
        core = [["P02", "P01", "P04"], ["P07", "P08"], ["P16"], ["P20"]]
    elif bundle_type == "Multi-site":
        core = [["P02", "P03", "P01"], ["P08", "P07"], ["P09"]]
        core.append(["P10"])
    else:
        core = [["P03", "P05", "P02", "P01"], ["P16"], ["P20"], ["P24"]]
    return [options[0] for options in core], core


def _add_with_prerequisites(
    product_id: str,
    candidates: dict[str, ProductResponse],
    selected_ids: set[str],
) -> bool:
    product = candidates.get(product_id)
    if product is None:
        return False
    if product.requires_one_of and not selected_ids.intersection(product.requires_one_of):
        eligible_prerequisites = [
            candidates[required_id]
            for required_id in product.requires_one_of
            if required_id in candidates
        ]
        if not eligible_prerequisites:
            return False
        prerequisite_product = min(
            eligible_prerequisites,
            key=lambda item: (item.price_min_inr_per_month, item.product_id),
        )
        selected_ids.add(prerequisite_product.product_id)
        # Dependencies may themselves have prerequisites, so resolve them recursively.
        if not _add_with_prerequisites(
            prerequisite_product.product_id, candidates, selected_ids
        ):
            return False
    selected_ids.add(product_id)
    return True


def _monthly_total(
    selected_ids: set[str],
    candidates: dict[str, ProductResponse],
    profile: BusinessProfile,
) -> int:
    return sum(
        candidates[product_id].price_min_inr_per_month
        * _quantity(candidates[product_id], profile)
        for product_id in selected_ids
    )


@app.post("/api/recommend", response_model=RecommendationResponse)
def recommend(
    profile: BusinessProfile, data: DataServiceDependency
) -> RecommendationResponse:
    all_products = [
        _product_response(row) for row in data.products.to_dict(orient="records")
    ]
    candidates = {
        product.product_id: product
        for product in all_products
        if _is_eligible(
            product,
            profile.city_tier,
            profile.employee_count,
            profile.num_sites,
            profile.has_gstin,
        )
    }
    bundle_type = _bundle_type(profile)
    preferred_order, seed_groups = _bundle_seeds(bundle_type, profile.business_type)
    selected_ids: set[str] = set()

    for options in seed_groups:
        selected = next((product_id for product_id in options if product_id in candidates), None)
        if selected is not None:
            _add_with_prerequisites(selected, candidates, selected_ids)

    unmet_needs: list[str] = []
    for need in profile.key_needs:
        options = _products_for_need(need)
        if not options:
            unmet_needs.append(need)
            continue
        if selected_ids.intersection(options):
            continue

        next_selected = selected_ids.copy()
        chosen = next((product_id for product_id in options if product_id in candidates), None)
        if chosen is None or not _add_with_prerequisites(chosen, candidates, next_selected):
            unmet_needs.append(need)
            continue
        if _monthly_total(next_selected, candidates, profile) > profile.monthly_budget:
            unmet_needs.append(need)
            continue
        selected_ids = next_selected

    recommendations: list[RecommendedProduct] = []
    total_monthly_cost = 0
    total_setup_fee = 0
    total_savings = 0
    for product_id in preferred_order + sorted(selected_ids):
        if product_id not in selected_ids or any(
            item.product.product_id == product_id for item in recommendations
        ):
            continue
        product = candidates[product_id]
        quantity = _quantity(product, profile)
        monthly_cost = product.price_min_inr_per_month * quantity
        setup_fee = product.one_time_setup_inr * quantity
        monthly_savings = (
            product.price_max_inr_per_month - product.price_min_inr_per_month
        ) * quantity
        recommendations.append(
            RecommendedProduct(
                product=product,
                quantity=quantity,
                monthly_cost_inr=monthly_cost,
                setup_fee_inr=setup_fee,
                monthly_savings_inr=monthly_savings,
            )
        )
        total_monthly_cost += monthly_cost
        total_setup_fee += setup_fee
        total_savings += monthly_savings

    descriptions = {
        "Micro": "Core connectivity and essential services for a small business.",
        "Professional": "Connectivity, productivity, and endpoint protection for a professional team.",
        "Multi-site": "Multi-location connectivity with failover and centralized management where eligible.",
        "Manufacturer": "Business connectivity, productivity, security, and manufacturing IoT where eligible.",
    }
    return RecommendationResponse(
        bundle_type=bundle_type,
        bundle_description=descriptions[bundle_type],
        products=recommendations,
        total_monthly_cost_inr=total_monthly_cost,
        setup_fee_inr=total_setup_fee,
        bundle_savings_inr=total_savings,
        monthly_budget_inr=profile.monthly_budget,
        within_monthly_budget=total_monthly_cost <= profile.monthly_budget,
        unmet_needs=unmet_needs,
        savings_basis=(
            "Savings are the difference between catalogue maximum and minimum monthly "
            "prices; no additional bundle discount is assumed."
        ),
    )


@app.post("/api/chat", response_model=ChatResponse)
def chat_with_advisor(
    payload: ChatRequest, chat_service: ChatServiceDependency
) -> ChatResponse:
    result = chat_service.answer(
        payload.message, payload.language, payload.context
    )
    return ChatResponse.model_validate(result)


@app.post(
    "/api/kyc/verify-document",
    response_model=KYCDocumentVerificationResponse,
)
async def verify_kyc_document(
    kyc_service: KYCServiceDependency,
    file: Annotated[UploadFile, File()],
    doc_type: Annotated[
        Literal["gst", "udyam", "id", "utility_bill"], Form()
    ],
    applicant_id: Annotated[str | None, Form()] = None,
    gstin: Annotated[str | None, Form()] = None,
    udyam_no: Annotated[str | None, Form()] = None,
    applicant_name: Annotated[str | None, Form()] = None,
) -> KYCDocumentVerificationResponse:
    image_bytes = await file.read(MAX_IMAGE_BYTES + 1)
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="The image exceeds the 10 MB limit.")
    result = kyc_service.verify_document(
        image_bytes,
        doc_type,
        file.filename or "uploaded-document",
        applicant_id=applicant_id,
        gstin=gstin,
        udyam_number=udyam_no,
        expected_name=applicant_name,
    )
    return KYCDocumentVerificationResponse.model_validate(
        {
            "document_type": result.document_type,
            "filename": result.filename,
            "extracted_fields": result.extracted_fields,
            "verification_status": result.verification_status,
            "flag_reasons": result.flag_reasons,
            "drop_reasons": result.drop_reasons,
            "ocr_engine": result.ocr_engine,
        }
    )


@app.post("/api/kyc/consent", response_model=DPDPConsentResponse)
def record_kyc_consent(
    consent: DPDPConsentRequest,
    kyc_service: KYCServiceDependency,
) -> DPDPConsentResponse:
    try:
        receipt = kyc_service.record_consent(consent)
    except (OSError, sqlite3.Error) as error:
        raise HTTPException(
            status_code=500, detail=f"Unable to record consent: {error}"
        ) from error
    return DPDPConsentResponse.model_validate(receipt)


@app.get(
    "/api/kyc/test-applicant/{applicant_id}",
    response_model=KYCApplicantVerificationResponse,
)
def verify_test_applicant(
    applicant_id: str, kyc_service: KYCServiceDependency
) -> KYCApplicantVerificationResponse:
    try:
        result = kyc_service.verify_test_applicant(applicant_id)
    except ApplicantNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return KYCApplicantVerificationResponse.model_validate(result)


@app.get(
    "/api/dashboard/leads",
    response_model=list[LeadRecoveryItem],
)
def get_dashboard_leads(
    scoring_service: LeadScoringServiceDependency,
    drop_reason: Annotated[str | None, Query(min_length=1)] = None,
) -> list[LeadRecoveryItem]:
    return scoring_service.get_recovery_leads(drop_reason=drop_reason)


@app.get(
    "/api/dashboard/analytics",
    response_model=DashboardAnalytics,
)
def get_dashboard_analytics(
    scoring_service: LeadScoringServiceDependency,
) -> DashboardAnalytics:
    return scoring_service.get_analytics()
