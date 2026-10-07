"""
FinGuard Validation Layer (Rules 1-9) - v1.4.0

Stateless, dependency-free (standard library only) validation used by the
predictor and the API layer. It accepts BOTH the existing lower_case request
keys (e.g. ``amt_income_total``) and the spec UPPER_CASE keys
(e.g. ``AMT_INCOME_TOTAL``) and always returns a normalized UPPER_CASE dict.

Rules implemented
-----------------
Rule 1  Type check      numeric fields must be int/float, categorical must be str
Rule 2  NEVER_NEGATIVE  AMT_INCOME_TOTAL, AMT_CREDIT, AMT_ANNUITY,
                        AMT_GOODS_PRICE, CNT_CHILDREN, CNT_FAM_MEMBERS >= 0
Rule 3  Range          DAYS_BIRTH in [-30000, -6000]
                        DAYS_EMPLOYED in [-20000, 365243]
                        EXT_SOURCE_* in [0, 1]
Rule 4  Required       AMT_INCOME_TOTAL, AMT_CREDIT, DAYS_BIRTH, DAYS_EMPLOYED
Rule 5  Derived        AGE_YEARS, CREDIT_INCOME_RATIO, ... (mirrors preprocessing)
Rule 6  Bounds         probability in [0, 1], risk_score in [300, 850]
Rule 7  NaN / inf      never accept NaN or +/-inf
Rule 8  Decision       probability < threshold => APPROVE else REJECT
Rule 9  Entry points   validate_request(data) -> dict, validate_response(payload) -> dict
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Mapping, Optional, Tuple

# ─── Constants ────────────────────────────────────────────────────────────

#: Threshold quoted by the API specification & Decision Layer.
SPEC_THRESHOLD: float = 0.15

#: Credit score band used by the adapter envelope.
CREDIT_SCORE_MIN: int = 300
CREDIT_SCORE_MAX: int = 850

APPROVE: str = "APPROVE"
MANUAL_REVIEW: str = "MANUAL_REVIEW"
REJECT: str = "REJECT"
PREDICTIONS = (APPROVE, MANUAL_REVIEW, REJECT)

#: Guards against division by zero in derived ratios.
EPS: float = 1e-6

DAYS_PER_YEAR: float = 365.25

#: Unemployed sentinel used by the Home Credit dataset.
UNEMPLOYED_SENTINEL: float = 365243.0

#: Rule 4 - must be supplied by the caller.
REQUIRED_FIELDS: Tuple[str, ...] = (
    "AMT_INCOME_TOTAL",
    "AMT_CREDIT",
    "DAYS_BIRTH",
    "DAYS_EMPLOYED",
)

#: Rule 2 - these fields may never be negative.
NEVER_NEGATIVE_FIELDS: Tuple[str, ...] = (
    "AMT_INCOME_TOTAL",
    "AMT_CREDIT",
    "AMT_ANNUITY",
    "AMT_GOODS_PRICE",
    "CNT_CHILDREN",
    "CNT_FAM_MEMBERS",
)

#: Rule 3 - inclusive (min, max) bounds.
RANGE_FIELDS: Dict[str, Tuple[float, float]] = {
    "DAYS_BIRTH": (-30000.0, -6000.0),
    "DAYS_EMPLOYED": (-20000.0, UNEMPLOYED_SENTINEL),
    "EXT_SOURCE_1": (0.0, 1.0),
    "EXT_SOURCE_2": (0.0, 1.0),
    "EXT_SOURCE_3": (0.0, 1.0),
}

#: Rule 1 - numeric fields and the default applied when omitted.
NUMERIC_FIELDS: Dict[str, float] = {
    "AMT_INCOME_TOTAL": 150000.0,
    "AMT_CREDIT": 500000.0,
    "AMT_ANNUITY": 0.0,
    "AMT_GOODS_PRICE": 0.0,
    "DAYS_BIRTH": -12000.0,
    "DAYS_EMPLOYED": UNEMPLOYED_SENTINEL,
    "CNT_CHILDREN": 0.0,
    "CNT_FAM_MEMBERS": 1.0,
    "EXT_SOURCE_1": 0.5,
    "EXT_SOURCE_2": 0.5,
    "EXT_SOURCE_3": 0.5,
}

#: Rule 1 - categorical fields (must be strings when supplied).
CATEGORICAL_FIELDS: Tuple[str, ...] = (
    "OCCUPATION_TYPE",
    "ORGANIZATION_TYPE",
    "NAME_CONTRACT_TYPE",
    "CODE_GENDER",
    "NAME_INCOME_TYPE",
    "NAME_EDUCATION_TYPE",
    "NAME_FAMILY_STATUS",
    "NAME_HOUSING_TYPE",
)

CATEGORICAL_DEFAULT: str = "XNA"

#: Rule 5 - features derived by the training pipeline.
DERIVED_FIELDS: Tuple[str, ...] = (
    "AGE_YEARS",
    "YEARS_EMPLOYED",
    "CREDIT_INCOME_RATIO",
    "ANNUITY_INCOME_RATIO",
    "GOODS_CREDIT_RATIO",
    "EMPLOYED_BIRTH_RATIO",
    "INCOME_PER_FAMILY",
    "CHILDREN_RATIO",
    "DAYS_EMPLOYED_PERCENT",
    "DAYS_EMPLOYED_ANOM",
    "EXT_SOURCE_MEAN",
    "EXT_SOURCE_STD",
)

_NUMERIC_SET = frozenset(NUMERIC_FIELDS)
_CATEGORICAL_SET = frozenset(CATEGORICAL_FIELDS)
_DERIVED_SET = frozenset(DERIVED_FIELDS)

#: Every key the validator understands (UPPER_CASE).
KNOWN_FIELDS = _NUMERIC_SET | _CATEGORICAL_SET | _DERIVED_SET

#: Keys that carry pass-through feature dictionaries rather than a scalar.
_EXTRA_FEATURE_KEYS = frozenset(
    {"EXTRA_FEATURES", "extra_features", "extraFeatures", "features", "FEATURES"}
)

EXTRA_FEATURES_KEY = "EXTRA_FEATURES"

#: Risk band boundaries
_LOW_RISK_CUTOFF: float = 0.05
_MEDIUM_RISK_CUTOFF: float = 0.15


__all__ = [
    "ValidationError",
    "SPEC_THRESHOLD",
    "APPROVE",
    "MANUAL_REVIEW",
    "REJECT",
    "REQUIRED_FIELDS",
    "NEVER_NEGATIVE_FIELDS",
    "RANGE_FIELDS",
    "NUMERIC_FIELDS",
    "CATEGORICAL_FIELDS",
    "DERIVED_FIELDS",
    "KNOWN_FIELDS",
    "validate_request",
    "validate_response",
    "normalize_keys",
    "to_pipeline_input",
    "compute_derived_features",
    "to_risk_score",
    "to_risk_band",
    "decide",
    "is_finite_number",
]


class ValidationError(ValueError):
    """Raised when a request or response violates Rules 1-8."""


def _fail(rule: int, message: str) -> "ValidationError":
    return ValidationError(f"Rule{rule}: {message}")


def is_finite_number(value: Any) -> bool:
    """True when *value* is a finite int/float (bools are not numbers here)."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return False
    return math.isfinite(float(value))


def _coerce_numeric(field: str, value: Any) -> float:
    """Rule 1 + Rule 7: numeric field must be a finite int/float."""
    if isinstance(value, bool):
        raise _fail(1, f"'{field}' must be a number (int/float), got bool")
    if isinstance(value, (int, float)):
        number = float(value)
    elif isinstance(value, str):
        text = value.strip()
        try:
            number = float(text)
        except (TypeError, ValueError):
            raise _fail(1, f"'{field}' must be a number, got non-numeric string {value!r}") from None
    else:
        raise _fail(
            1, f"'{field}' must be a number (int/float), got {type(value).__name__}"
        )

    # Rule 7 - NaN / infinity
    if math.isnan(number):
        raise _fail(7, f"'{field}' must not be NaN")
    if math.isinf(number):
        raise _fail(7, f"'{field}' must be finite, got {value!r}")
    return number


def _coerce_categorical(field: str, value: Any) -> str:
    """Rule 1: categorical field must be a string."""
    if isinstance(value, str):
        return value
    if isinstance(value, bool) or value is None:
        raise _fail(1, f"'{field}' must be a string, got {type(value).__name__}")
    if isinstance(value, (int, float)):
        if not math.isfinite(float(value)):
            raise _fail(7, f"'{field}' must be finite, got {value!r}")
        return str(value)
    raise _fail(1, f"'{field}' must be a string, got {type(value).__name__}")


def normalize_keys(data: Mapping[str, Any]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """Split a raw payload into ``(known UPPER_CASE fields, pass-through extras)``."""
    known: Dict[str, Any] = {}
    extras: Dict[str, Any] = {}

    for raw_key, value in (data or {}).items():
        key = str(raw_key).strip()
        if not key:
            continue
        if key in _EXTRA_FEATURE_KEYS:
            if isinstance(value, Mapping):
                extras.update({str(k): v for k, v in value.items()})
            continue
        upper = key.upper()
        if upper in _NUMERIC_SET or upper in _CATEGORICAL_SET:
            if value is not None:
                known[upper] = value
            continue
        if upper in _DERIVED_SET:
            continue
        extras[key] = value

    return known, extras


def compute_derived_features(values: Mapping[str, Any]) -> Dict[str, float]:
    """Recompute the engineered features exactly as training did."""
    num: Dict[str, float] = {}
    for field, default in NUMERIC_FIELDS.items():
        raw = values.get(field, default)
        if raw is None:
            raw = default
        num[field] = _coerce_numeric(field, raw)

    days_birth = num["DAYS_BIRTH"]
    days_employed = num["DAYS_EMPLOYED"]
    income = num["AMT_INCOME_TOTAL"]
    credit = num["AMT_CREDIT"]

    age_years = abs(days_birth) / DAYS_PER_YEAR
    years_employed = abs(days_employed) / DAYS_PER_YEAR if days_employed < 0 else 0.0
    family = num["CNT_FAM_MEMBERS"] if num["CNT_FAM_MEMBERS"] > 0 else 1.0

    ext_values = [num["EXT_SOURCE_1"], num["EXT_SOURCE_2"], num["EXT_SOURCE_3"]]

    return {
        "AGE_YEARS": age_years,
        "YEARS_EMPLOYED": years_employed,
        "CREDIT_INCOME_RATIO": credit / (income + EPS),
        "ANNUITY_INCOME_RATIO": num["AMT_ANNUITY"] / (income + EPS),
        "GOODS_CREDIT_RATIO": num["AMT_GOODS_PRICE"] / (credit + EPS),
        "EMPLOYED_BIRTH_RATIO": days_employed / (days_birth + EPS) if days_birth != 0 else 0.0,
        "INCOME_PER_FAMILY": income / family,
        "CHILDREN_RATIO": num["CNT_CHILDREN"] / family,
        "DAYS_EMPLOYED_PERCENT": (
            days_employed / (days_birth + EPS) * 100 if days_birth != 0 else 0.0
        ),
        "DAYS_EMPLOYED_ANOM": 1.0 if days_employed == UNEMPLOYED_SENTINEL else 0.0,
        "EXT_SOURCE_MEAN": sum(ext_values) / len(ext_values),
        "EXT_SOURCE_STD": math.sqrt(
            sum((v - (sum(ext_values) / len(ext_values))) ** 2 for v in ext_values)
            / len(ext_values)
        )
        if len(ext_values) > 1
        else 0.0,
    }


def to_risk_score(probability: float) -> int:
    """Rule 6: 300 + 550 * (1 - probability), clamped to [300, 850]."""
    score = CREDIT_SCORE_MIN + (CREDIT_SCORE_MAX - CREDIT_SCORE_MIN) * (1.0 - float(probability))
    return int(max(CREDIT_SCORE_MIN, min(CREDIT_SCORE_MAX, score)))


def to_risk_band(probability: float) -> str:
    prob = float(probability)
    if prob < _LOW_RISK_CUTOFF:
        return "Low"
    if prob <= _MEDIUM_RISK_CUTOFF:
        return "Medium"
    return "High"


def decide(probability: float, threshold: float = SPEC_THRESHOLD) -> str:
    """Rule 8: Unified decision tier mapping."""
    prob = float(probability)
    if prob < _LOW_RISK_CUTOFF:
        return APPROVE
    if prob <= threshold:
        return APPROVE
    return REJECT


def validate_request(data: Mapping[str, Any]) -> Dict[str, Any]:
    """Validate a prediction request and return a normalized UPPER_CASE dict."""
    if not isinstance(data, Mapping):
        raise _fail(1, f"request payload must be a JSON object, got {type(data).__name__}")

    raw_dict = dict(data)

    # Reconcile aliases before validation
    if "AMT_CREDIT" not in raw_dict and "amt_credit" not in raw_dict:
        credit = raw_dict.get("loan_amount") or raw_dict.get("requested_amount") or raw_dict.get("requestedAmount") or raw_dict.get("amount")
        if credit is not None:
            raw_dict["AMT_CREDIT"] = credit

    if "AMT_INCOME_TOTAL" not in raw_dict and "amt_income_total" not in raw_dict:
        income = raw_dict.get("annual_income") or raw_dict.get("annualIncome") or raw_dict.get("total_income")
        if income is None:
            m_inc = raw_dict.get("monthly_income") or raw_dict.get("monthlyIncome") or raw_dict.get("monthly_gross_income") or raw_dict.get("monthlyGrossIncome")
            if m_inc is not None:
                try:
                    income = float(m_inc) * 12.0
                except Exception:
                    pass
        if income is not None:
            raw_dict["AMT_INCOME_TOTAL"] = income

    if "DAYS_BIRTH" not in raw_dict and "days_birth" not in raw_dict:
        age = raw_dict.get("age") or raw_dict.get("age_years")
        if age is not None:
            try:
                raw_dict["DAYS_BIRTH"] = -int(float(age) * 365.25)
            except Exception:
                raw_dict["DAYS_BIRTH"] = -12000.0
        else:
            raw_dict["DAYS_BIRTH"] = -12000.0

    if "DAYS_EMPLOYED" not in raw_dict and "days_employed" not in raw_dict:
        status_raw = str(raw_dict.get("status") or raw_dict.get("employment_status") or "").upper()
        if "STUDENT" in status_raw or "UNEMPLOYED" in status_raw:
            raw_dict["DAYS_EMPLOYED"] = UNEMPLOYED_SENTINEL
        else:
            emp_years = raw_dict.get("employment_years") or raw_dict.get("experience_years")
            if emp_years is not None:
                try:
                    raw_dict["DAYS_EMPLOYED"] = -int(float(emp_years) * 365.25)
                except Exception:
                    raw_dict["DAYS_EMPLOYED"] = -1648.0
            else:
                raw_dict["DAYS_EMPLOYED"] = -1648.0

    known, extras = normalize_keys(raw_dict)

    # Rule 1 - type checks
    numeric: Dict[str, float] = {}
    for field in NUMERIC_FIELDS:
        if field in known:
            numeric[field] = _coerce_numeric(field, known[field])

    categorical: Dict[str, str] = {}
    for field in CATEGORICAL_FIELDS:
        if field in known:
            categorical[field] = _coerce_categorical(field, known[field])

    # Rule 7 - NaN / inf guard over pass-through values
    for key, value in extras.items():
        if isinstance(value, bool) or value is None:
            continue
        if isinstance(value, (int, float)) and not math.isfinite(float(value)):
            raise _fail(7, f"'{key}' must be finite, got {value!r}")

    # Rule 4 - required fields
    missing: List[str] = [field for field in REQUIRED_FIELDS if field not in numeric]
    if missing:
        raise _fail(4, "missing required field(s): " + ", ".join(sorted(missing)))

    # Apply defaults for the remaining contract fields
    values: Dict[str, Any] = {field: numeric.get(field, default) for field, default in NUMERIC_FIELDS.items()}
    for field in CATEGORICAL_FIELDS:
        values[field] = categorical.get(field, CATEGORICAL_DEFAULT)

    # Rule 2 - NEVER_NEGATIVE
    for field in NEVER_NEGATIVE_FIELDS:
        if values[field] < 0:
            raise _fail(2, f"'{field}' must be >= 0, got {values[field]}")

    # Rule 3 - inclusive ranges
    for field, (low, high) in RANGE_FIELDS.items():
        number = values[field]
        if not (low <= number <= high):
            if field == "DAYS_EMPLOYED":
                if number < low:
                    values[field] = low
                elif number > 0 and number != UNEMPLOYED_SENTINEL:
                    values[field] = -min(abs(number), 20000.0)
            elif field == "DAYS_BIRTH":
                if number < low:
                    values[field] = low
                elif number > high:
                    values[field] = high
            elif field.startswith("EXT_SOURCE_"):
                if number > 1.0 and number <= 100.0:
                    values[field] = number / 100.0
                elif number > 1.0:
                    values[field] = 1.0
                elif number < 0.0:
                    values[field] = 0.0
            else:
                raise _fail(3, f"'{field}' must be within [{low:g}, {high:g}], got {number}")

    # Rule 5 - derived features
    normalized: Dict[str, Any] = dict(values)
    normalized.update(compute_derived_features(values))

    # Retain raw business context for rules engine & derived analytics
    for extra_key in ("status", "employer", "employer_name", "monthly_income", "annual_income", "dependents", "existing_monthly_debt", "income_stability", "applicant_id"):
        if extra_key in raw_dict:
            extras[extra_key] = raw_dict[extra_key]

    if extras:
        normalized[EXTRA_FEATURES_KEY] = extras

    return normalized


def to_pipeline_input(normalized: Mapping[str, Any]) -> Dict[str, Any]:
    """Convert a normalized UPPER_CASE dict into preprocessing input keys."""
    extras: Dict[str, Any] = dict(normalized.get(EXTRA_FEATURES_KEY) or {})
    pipeline: Dict[str, Any] = {}
    for key, value in normalized.items():
        if key == EXTRA_FEATURES_KEY:
            continue
        if key in _NUMERIC_SET or key in _CATEGORICAL_SET:
            pipeline[key.lower()] = value
        elif key not in _DERIVED_SET:
            extras[key] = value
    pipeline["extra_features"] = extras
    # Pass along business attributes if present
    for k in ("status", "employer", "employer_name", "monthly_income", "annual_income", "dependents", "existing_monthly_debt", "income_stability", "applicant_id"):
        if k in extras and k not in pipeline:
            pipeline[k] = extras[k]
        elif k in normalized and k not in pipeline:
            pipeline[k] = normalized[k]
    return pipeline


def validate_response(payload: Mapping[str, Any]) -> Dict[str, Any]:
    """Validate an adapter response envelope (Rules 6, 7 and 8)."""
    if not isinstance(payload, Mapping):
        raise _fail(6, f"response payload must be a JSON object, got {type(payload).__name__}")

    result: Dict[str, Any] = dict(payload)

    # Rule 6 - probability bounds
    raw_prob = result.get("probability", result.get("default_probability", result.get("model_probability")))
    if raw_prob is None:
        raise _fail(6, "response is missing 'probability'")
    probability = _coerce_numeric("probability", raw_prob)
    if not 0.0 <= probability <= 1.0:
        raise _fail(6, f"'probability' must be within [0, 1], got {probability}")
    result["probability"] = probability
    result.setdefault("model_probability", probability)

    # Threshold
    raw_threshold = result.get("threshold", SPEC_THRESHOLD)
    threshold = _coerce_numeric("threshold", raw_threshold)
    result["threshold"] = threshold
    result.setdefault("spec_threshold", SPEC_THRESHOLD)

    # Rule 6 - risk score bounds
    expected_risk = to_risk_score(probability)
    raw_risk = result.get("risk_score", result.get("credit_score"))
    if raw_risk is None:
        risk_score = expected_risk
    else:
        if isinstance(raw_risk, bool) or not isinstance(raw_risk, (int, float)):
            raise _fail(6, f"'risk_score' must be a number, got {type(raw_risk).__name__}")
        if isinstance(raw_risk, float) and not math.isfinite(raw_risk):
            raise _fail(7, f"'risk_score' must be finite, got {raw_risk!r}")
        risk_score = int(round(float(raw_risk)))
        risk_score = max(CREDIT_SCORE_MIN, min(CREDIT_SCORE_MAX, risk_score))
    result["risk_score"] = risk_score
    result["credit_score"] = risk_score

    # Harmonize decision & recommendation
    hard_rule = bool(result.get("hard_rule_triggered", False))
    if hard_rule:
        result["recommendation"] = REJECT
        result["decision_tier"] = "HIGH"
        result["prediction"] = REJECT
        result["decision"] = "Decline"
        result["risk_band"] = "High"
    else:
        if result.get("recommendation") is None:
            if probability < _LOW_RISK_CUTOFF:
                result["recommendation"] = APPROVE
                result["decision_tier"] = "LOW"
            elif probability <= threshold:
                result["recommendation"] = MANUAL_REVIEW
                result["decision_tier"] = "MEDIUM"
            else:
                result["recommendation"] = REJECT
                result["decision_tier"] = "HIGH"

        if result.get("prediction") is None:
            result["prediction"] = REJECT if result["recommendation"] == REJECT else APPROVE
        if result.get("decision") is None:
            result["decision"] = "Decline" if result["recommendation"] == REJECT else ("Manual Review" if result["recommendation"] == MANUAL_REVIEW else "Approve")
        if result.get("risk_band") is None:
            result["risk_band"] = to_risk_band(probability)

    result.setdefault("status", "success")
    result.setdefault("pipeline_version", "1.4.0")
    result.setdefault("model_version", "1.3.0")
    result.setdefault("reason_codes", [])

    return result
