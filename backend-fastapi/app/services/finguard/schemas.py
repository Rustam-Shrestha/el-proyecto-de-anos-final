from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class FinguardPredictRequest(BaseModel):
    amt_income_total: float = Field(..., gt=0)
    amt_credit: float = Field(..., gt=0)
    amt_annuity: Optional[float] = 0
    amt_goods_price: Optional[float] = 0
    days_birth: int = Field(..., description="Negative days since birth, e.g. -12000")
    days_employed: int = Field(..., description="Negative days employed, 365243 for unemployed")
    cnt_children: int = 0
    cnt_fam_members: int = 1
    # Optional categorical overrides
    occupation_type: Optional[str] = None
    organization_type: Optional[str] = None
    name_contract_type: Optional[str] = None
    code_gender: Optional[str] = None
    name_income_type: Optional[str] = None
    name_education_type: Optional[str] = None
    name_family_status: Optional[str] = None
    name_housing_type: Optional[str] = None
    # Allow any additional raw fields to pass through
    extra_features: Optional[Dict[str, float]] = None


class FinguardPredictResponse(BaseModel):
    model_version: str
    default_probability: float
    credit_score: int
    risk_band: str
    decision: str
    threshold: float
    shap_summary: Dict[str, float]
    features_used: List[str]
    timestamp: str
