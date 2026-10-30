"""Historical lead conversion scoring and dashboard analytics."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

if __package__ and "." in __package__:
    from ..schemas.dashboard import DashboardAnalytics, LeadRecoveryItem
    from .data_service import DataLoadError
else:
    from schemas.dashboard import DashboardAnalytics, LeadRecoveryItem
    from services.data_service import DataLoadError


class LeadScoringService:
    """Scores unclosed leads using transparent rules derived from the lead CSV."""

    _REQUIRED_COLUMNS = {
        "lead_id",
        "business_name",
        "contact_name",
        "segment",
        "city",
        "drop_reason",
        "stage_reached",
        "has_gstin",
        "gstin",
        "city_tier",
        "employee_count",
        "outcome",
        "days_lead_to_activation",
        "acquisition_cost_inr",
    }
    _FUNNEL_STAGES = (
        "Lead",
        "Contacted",
        "Needs assessed",
        "Quote accepted",
        "KYC complete",
        "Activated",
    )
    _STAGE_PRIORITY = {stage: index for index, stage in enumerate(_FUNNEL_STAGES)}
    _SEGMENT_BONUSES = {
        "Professional offices": 20.0,
        "Small multi-site businesses": 25.0,
        "Micro retail & services": 15.0,
    }

    def __init__(self, data_directory: Path | None = None) -> None:
        self.data_directory = data_directory or Path(__file__).resolve().parents[2]
        self.leads = self._load_leads(self.data_directory / "smb_leads.csv")
        self._scored_leads = self._score_leads(self.leads)

    @classmethod
    def _load_leads(cls, csv_path: Path) -> pd.DataFrame:
        try:
            leads = pd.read_csv(csv_path, dtype=str, keep_default_na=False)
        except (OSError, pd.errors.ParserError, UnicodeDecodeError) as error:
            raise DataLoadError(f"Unable to load lead data from {csv_path}: {error}") from error
        missing_columns = cls._REQUIRED_COLUMNS.difference(leads.columns)
        if missing_columns:
            columns = ", ".join(sorted(missing_columns))
            raise DataLoadError(f"{csv_path} is missing required columns: {columns}")
        return leads

    @classmethod
    def _score_leads(cls, leads: pd.DataFrame) -> pd.DataFrame:
        scored = leads.copy()
        has_gstin = scored["has_gstin"].str.strip().str.upper().eq("Y")
        employees = pd.to_numeric(scored["employee_count"], errors="coerce").fillna(0)
        city_tiers = pd.to_numeric(scored["city_tier"], errors="coerce")

        # Use the observed 9.6% / 2.0% conversion rates as the starting propensity.
        score = has_gstin.map({True: 9.6, False: 2.0}).astype(float)
        score += has_gstin.map({True: 35.0, False: 0.0})
        score += scored["segment"].map(cls._SEGMENT_BONUSES).fillna(0.0)
        score += city_tiers.map({1: 15.0, 2: 10.0}).fillna(0.0)
        score += employees.gt(5).map({True: 15.0, False: 0.0})
        scored["propensity_score"] = score.clip(lower=0, upper=100).round(1)
        return scored

    def get_recovery_leads(
        self, drop_reason: str | None = None
    ) -> list[LeadRecoveryItem]:
        """Return every non-activated lead ordered by propensity, highest first."""
        leads = self._scored_leads[
            self._scored_leads["outcome"].str.strip().str.casefold()
            != "activated"
        ]
        if drop_reason:
            leads = leads[
                leads["drop_reason"].str.strip().str.casefold()
                == drop_reason.strip().casefold()
            ]
        leads = leads.sort_values(
            by=["propensity_score", "lead_id"],
            ascending=[False, True],
            kind="stable",
        )
        return [
            LeadRecoveryItem(
                lead_id=str(row["lead_id"]),
                business_name=str(row["business_name"]),
                contact_name=str(row["contact_name"]),
                segment=str(row["segment"]),
                city=str(row["city"]),
                drop_reason=str(row["drop_reason"]),
                stage_reached=str(row["stage_reached"]),
                propensity_score=float(row["propensity_score"]),
                gstin=str(row["gstin"]),
            )
            for row in leads.to_dict(orient="records")
        ]

    def get_analytics(self) -> DashboardAnalytics:
        """Calculate funnel and acquisition metrics from the loaded lead data."""
        outcomes = self.leads["outcome"].str.strip().str.casefold()
        activated = self.leads.loc[outcomes == "activated"]
        activated_count = len(activated)
        total_leads = len(self.leads)

        activation_days = pd.to_numeric(
            activated["days_lead_to_activation"], errors="coerce"
        ).dropna()
        acquisition_costs = pd.to_numeric(
            self.leads["acquisition_cost_inr"], errors="coerce"
        ).fillna(0)
        blended_cac = (
            round(float(acquisition_costs.sum()) / activated_count, -3)
            if activated_count
            else 0
        )

        reached_counts = {
            stage: int(
                self.leads["stage_reached"].map(
                    lambda reached_stage: self._STAGE_PRIORITY.get(
                        reached_stage, -1
                    )
                    >= stage_index
                ).sum()
            )
            for stage_index, stage in enumerate(self._FUNNEL_STAGES)
        }
        return DashboardAnalytics(
            total_leads=total_leads,
            activated_count=activated_count,
            activation_rate_percent=round(
                activated_count / total_leads * 100, 2
            )
            if total_leads
            else 0.0,
            average_days_to_activate=round(float(activation_days.mean()), 1)
            if not activation_days.empty
            else 0.0,
            blended_acquisition_cost_inr=int(blended_cac),
            funnel_stage_breakdown=reached_counts,
        )
