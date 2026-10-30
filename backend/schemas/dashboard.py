"""Response models for the sales and partner dashboard."""

from pydantic import BaseModel, Field


class LeadRecoveryItem(BaseModel):
    lead_id: str
    business_name: str
    contact_name: str
    segment: str
    city: str
    drop_reason: str
    stage_reached: str
    propensity_score: float = Field(ge=0, le=100)
    gstin: str


class DashboardAnalytics(BaseModel):
    total_leads: int = Field(ge=0)
    activated_count: int = Field(ge=0)
    activation_rate_percent: float = Field(ge=0, le=100)
    average_days_to_activate: float = Field(ge=0)
    blended_acquisition_cost_inr: int = Field(ge=0)
    funnel_stage_breakdown: dict[str, int]
