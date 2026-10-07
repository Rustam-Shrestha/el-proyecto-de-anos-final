"""Pydantic schemas for the FinGuard credit scoring + NLU adapter (v1.4.0).

The request models accept BOTH the historical lower_case keys and the
spec UPPER_CASE keys; unknown keys are allowed and passed through so the
preprocessing pipeline can still consume extra training columns.

The response model conforms to the v1.4.0 Output Contract:
    { applicant_id, model_probability, decision_tier, recommendation,
      hard_rule_triggered, reason_codes, model_version, pipeline_version,
      status, prediction, probability, risk_score, credit_score, risk_band,
      decision, threshold, spec_threshold, shap_summary, features_used, timestamp }
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from .validators import (
    KNOWN_FIELDS,
    SPEC_THRESHOLD,
    normalize_keys as _normalize_validator_keys,
)

#: UPPER_CASE key -> lower_case model field name, used by the pydantic "before" validator.
LOWER_BY_UPPER: Dict[str, str] = {name: name.lower() for name in KNOWN_FIELDS}

#: passthrough containers that must not be treated as scalar features.
_EXTRA_FEATURE_KEYS = ("extra_features", "extraFeatures", "features")


def normalize_keys(data: Dict[str, Any]) -> Dict[str, Any]:
    """Map UPPER_CASE spec keys onto the lower_case model field names.

    Keys that already match a model field are left untouched, unknown keys are
    preserved verbatim (``extra="allow"``).
    """
    if not isinstance(data, dict):
        return data

    known, extras = _normalize_validator_keys(data)

    normalized: Dict[str, Any] = {}
    for upper, value in known.items():
        normalized[LOWER_BY_UPPER.get(upper, upper.lower())] = value

    # Keep the original pass-through features in their dedicated field.
    merged_extras: Dict[str, Any] = {}
    for key, value in data.items():
        if key in _EXTRA_FEATURE_KEYS and isinstance(value, dict):
            merged_extras.update(value)
    for key, value in extras.items():
        merged_extras.setdefault(key, value)
    if merged_extras:
        normalized["extra_features"] = merged_extras

    return normalized


class FinguardPredictRequest(BaseModel):
    """Prediction request - accepts lower_case and UPPER_CASE keys."""

    model_config = ConfigDict(populate_by_name=True, extra="allow", protected_namespaces=())

    applicant_id: Optional[str] = None
    amt_income_total: Optional[float] = Field(None, description="Total income (Rule 2)")
    amt_credit: Optional[float] = Field(None, description="Credit amount (Rule 2)")
    amt_annuity: Optional[float] = 0.0
    amt_goods_price: Optional[float] = 0.0
    days_birth: Optional[int] = Field(None, description="Negative days since birth, e.g. -12000")
    days_employed: Optional[int] = Field(None, description="Negative days employed, 365243 for unemployed")
    cnt_children: Optional[int] = 0
    cnt_fam_members: Optional[int] = 1

    # Extended business profile inputs
    status: Optional[str] = None
    employer: Optional[str] = None
    employer_name: Optional[str] = None
    monthly_income: Optional[float] = None
    annual_income: Optional[float] = None
    dependents: Optional[int] = None
    existing_monthly_debt: Optional[float] = 0.0
    income_stability: Optional[float] = None

    # Optional categorical overrides
    occupation_type: Optional[str] = None
    organization_type: Optional[str] = None
    name_contract_type: Optional[str] = None
    code_gender: Optional[str] = None
    name_income_type: Optional[str] = None
    name_education_type: Optional[str] = None
    name_family_status: Optional[str] = None
    name_housing_type: Optional[str] = None

    # Optional external bureau scores (0..1)
    ext_source_1: Optional[float] = None
    ext_source_2: Optional[float] = None
    ext_source_3: Optional[float] = None

    # Allow any additional raw fields to pass through
    extra_features: Optional[Dict[str, Any]] = None

    @model_validator(mode="before")
    @classmethod
    def _coerce_case(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Resolve income and credit aliases if standard keys missing
            credit = data.get("amt_credit") or data.get("AMT_CREDIT") or data.get("loan_amount") or data.get("requested_amount") or data.get("requestedAmount") or data.get("amount")
            income = data.get("amt_income_total") or data.get("AMT_INCOME_TOTAL") or data.get("annual_income") or data.get("annualIncome") or data.get("total_income")
            if income is None:
                m_inc = data.get("monthly_income") or data.get("monthlyIncome") or data.get("monthly_gross_income") or data.get("monthlyGrossIncome")
                if m_inc is not None:
                    try:
                        income = float(m_inc) * 12.0
                    except Exception:
                        pass

            normalized = normalize_keys(data)
            if credit is not None and "amt_credit" not in normalized:
                normalized["amt_credit"] = credit
            if income is not None and "amt_income_total" not in normalized:
                normalized["amt_income_total"] = income
            if "days_birth" not in normalized:
                age = data.get("age") or data.get("age_years") or data.get("ageyears")
                if age is not None:
                    try:
                        normalized["days_birth"] = -int(float(age) * 365.25)
                    except Exception:
                        normalized["days_birth"] = -12000
                else:
                    normalized["days_birth"] = -12000
            if "days_employed" not in normalized:
                status_raw = str(data.get("status") or data.get("employment_status") or "").upper()
                if "STUDENT" in status_raw or "UNEMPLOYED" in status_raw:
                    normalized["days_employed"] = 365243
                else:
                    emp_years = data.get("employment_years") or data.get("experience_years")
                    if emp_years is not None:
                        try:
                            normalized["days_employed"] = -int(float(emp_years) * 365.25)
                        except Exception:
                            normalized["days_employed"] = -1648
                    else:
                        normalized["days_employed"] = -1648
            return normalized
        return data

    @classmethod
    def normalize_keys(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """Public helper mirroring :func:`normalize_keys`."""
        return normalize_keys(data)

    def to_validator_dict(self) -> Dict[str, Any]:
        """Payload for :func:`app.services.finguard.validators.validate_request`."""
        return self.model_dump(exclude_none=True)


class FinguardBatchRequest(BaseModel):
    """Batch prediction request."""

    model_config = ConfigDict(populate_by_name=True, extra="allow", protected_namespaces=())

    items: List[Dict[str, Any]] = Field(
        ..., min_length=1, description="List of prediction request objects"
    )
    stop_on_error: bool = False


class FinguardExplainRequest(FinguardPredictRequest):
    """Explain request - identical payload to /predict, returns SHAP detail."""


class FinguardPredictResponse(BaseModel):
    """v1.4.0 Output Contract with full backward compatibility."""

    model_config = ConfigDict(populate_by_name=True, extra="allow", protected_namespaces=())

    # --- v1.4.0 Required Output Contract ---
    applicant_id: Optional[str] = None
    model_probability: Optional[float] = None
    decision_tier: Optional[str] = None  # "LOW", "MEDIUM", "HIGH"
    recommendation: Optional[str] = None  # "APPROVE", "MANUAL_REVIEW", "REJECT"
    hard_rule_triggered: bool = False
    reason_codes: List[str] = Field(default_factory=list)
    model_version: Optional[str] = "1.3.0"
    pipeline_version: str = "1.4.0"
    out_of_distribution: bool = False

    # --- Spec / Legacy adapter fields ---
    status: Optional[str] = "success"
    prediction: Optional[str] = None
    probability: Optional[float] = None
    risk_score: Optional[int] = None
    credit_score: Optional[int] = None
    risk_band: Optional[str] = None
    decision: Optional[str] = None
    threshold: Optional[float] = None
    spec_threshold: Optional[float] = SPEC_THRESHOLD
    shap_summary: Optional[Dict[str, float]] = None
    features_used: Optional[List[str]] = None
    derived_features: Optional[Dict[str, Any]] = None
    timestamp: Optional[str] = None


class FinguardBatchResponse(BaseModel):
    """Batch envelope."""

    model_config = ConfigDict(populate_by_name=True, extra="allow", protected_namespaces=())

    status: str = "success"
    count: int = 0
    results: List[FinguardPredictResponse] = Field(default_factory=list)
    errors: List[Dict[str, Any]] = Field(default_factory=list)
    pipeline_version: str = "1.4.0"
    timestamp: Optional[str] = None


class FinguardExplainResponse(BaseModel):
    """SHAP explanation envelope."""

    model_config = ConfigDict(populate_by_name=True, extra="allow", protected_namespaces=())

    # v1.4.0 Contract fields
    applicant_id: Optional[str] = None
    model_probability: Optional[float] = None
    decision_tier: Optional[str] = None
    recommendation: Optional[str] = None
    hard_rule_triggered: bool = False
    reason_codes: List[str] = Field(default_factory=list)
    model_version: Optional[str] = "1.3.0"
    pipeline_version: str = "1.4.0"
    out_of_distribution: bool = False

    status: str = "success"
    prediction: Optional[str] = None
    probability: Optional[float] = None
    risk_score: Optional[int] = None
    credit_score: Optional[int] = None
    risk_band: Optional[str] = None
    decision: Optional[str] = None
    threshold: Optional[float] = None
    spec_threshold: Optional[float] = SPEC_THRESHOLD
    base_value: Optional[float] = None
    shap_values: List[Dict[str, Any]] = Field(default_factory=list)
    shap_summary: Dict[str, float] = Field(default_factory=dict)
    features_used: Optional[List[str]] = None
    timestamp: Optional[str] = None


class ChatRequest(BaseModel):
    """NLU chat request (message is the only required field)."""

    model_config = ConfigDict(populate_by_name=True, extra="allow", protected_namespaces=())

    message: str = Field(..., min_length=1, max_length=4000)
    user_id: Optional[str] = None
    session_id: str = "default"


class DocumentAnalyzeRequest(BaseModel):
    """Document analysis request - raw extracted text of a financial document."""

    model_config = ConfigDict(populate_by_name=True, extra="allow", protected_namespaces=())

    text: str = Field(..., min_length=1, max_length=200000)
    document_type: Optional[str] = None


class DocumentAnalyzeResponse(BaseModel):
    """Document analysis envelope: entities, intent, summary + chart hints."""

    model_config = ConfigDict(populate_by_name=True, extra="allow", protected_namespaces=())

    status: str = "success"
    intent: str
    confidence: float = 0.85
    extracted_entities: Dict[str, Any] = Field(default_factory=dict)
    summary: str = ""
    answer: str = ""
    chart_type: Optional[str] = None
    data_keys: List[str] = Field(default_factory=list)
    visualization: Dict[str, Any] = Field(default_factory=dict)
    char_count: int = 0
    timestamp: Optional[str] = None
