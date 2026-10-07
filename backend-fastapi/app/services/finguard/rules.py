"""
FinGuard Pre-Model Hard Business Rules Engine (v1.4.0)

Hard gates that run BEFORE scoring.
If any rule fires, the application is rejected immediately with structured reason codes,
overriding any model outputs.

Rules:
1. REJECT if loan_amount > 5 * annual_income
2. REJECT if loan_amount > 10 * monthly_income
3. REJECT if (loan_amount / 12 + existing_monthly_debt) / monthly_income > 0.50
4. REJECT if status == STUDENT AND employer is null AND loan_amount > 25000
5. REJECT if monthly_income / (dependents + 1) < 5000
"""

from typing import Any, Dict, List, Tuple

# Standard reason codes
REASON_LOAN_EXCEEDS_5X_ANNUAL = "LOAN_EXCEEDS_5X_ANNUAL_INCOME"
REASON_LOAN_EXCEEDS_INCOME_MULTIPLE = "LOAN_EXCEEDS_INCOME_MULTIPLE"
REASON_DTI_EXCEEDS_50_PERCENT = "DTI_EXCEEDS_50_PERCENT"
REASON_STUDENT_NO_INCOME = "STUDENT_NO_INCOME"
REASON_SUBSISTENCE_INCOME_INSUFFICIENT = "SUBSISTENCE_INCOME_INSUFFICIENT"


def _safe_float(val: Any, default: float = 0.0) -> float:
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def _is_empty_or_null(val: Any) -> bool:
    if val is None:
        return True
    s = str(val).strip().upper()
    return s in ("", "NONE", "NULL", "N/A", "NA", "UNDEFINED", "XNA")


def evaluate_business_rules(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Evaluates pre-model hard business rules for a loan application.

    Returns:
        Tuple[bool, List[str]]: (hard_rule_triggered, reason_codes)
    """
    reason_codes: List[str] = []

    # 1. Extract Loan Amount
    loan_amount = _safe_float(
        data.get("amt_credit")
        or data.get("AMT_CREDIT")
        or data.get("loan_amount")
        or data.get("requested_amount")
        or data.get("requestedAmount")
    )

    # 2. Extract Income Details
    annual_income = _safe_float(
        data.get("amt_income_total")
        or data.get("AMT_INCOME_TOTAL")
        or data.get("annual_income")
        or data.get("annualIncome")
    )
    monthly_income = _safe_float(
        data.get("monthly_income")
        or data.get("monthlyIncome")
        or data.get("monthly_gross_income")
        or data.get("monthlyGrossIncome")
    )

    # Reconcile annual vs monthly income
    if annual_income > 0 and monthly_income <= 0:
        monthly_income = annual_income / 12.0
    elif monthly_income > 0 and annual_income <= 0:
        annual_income = monthly_income * 12.0

    # 3. Extract Existing Monthly Debt
    existing_monthly_debt = _safe_float(
        data.get("existing_monthly_debt")
        or data.get("existing_debt")
        or data.get("existingDebt")
        or data.get("current_debt_emi")
        or 0.0
    )

    # 4. Extract Status / Occupation
    status_raw = str(
        data.get("status")
        or data.get("employment_status")
        or data.get("employmentStatus")
        or data.get("name_income_type")
        or data.get("NAME_INCOME_TYPE")
        or data.get("occupation_type")
        or data.get("OCCUPATION_TYPE")
        or ""
    ).strip().upper()

    is_student = "STUDENT" in status_raw

    # 5. Extract Employer
    employer = (
        data.get("employer")
        or data.get("employer_name")
        or data.get("employerName")
        or data.get("organization_type")
        or data.get("ORGANIZATION_TYPE")
        or data.get("business_name")
        or data.get("businessName")
    )
    has_no_employer = _is_empty_or_null(employer)

    # 6. Extract Dependents
    dependents = _safe_float(
        data.get("dependents")
        or data.get("dependents_count")
        or data.get("dependentsCount")
        or data.get("cnt_children")
        or data.get("CNT_CHILDREN")
        or 0.0
    )
    fam_members = _safe_float(
        data.get("cnt_fam_members")
        or data.get("CNT_FAM_MEMBERS")
        or (dependents + 1.0)
    )
    effective_dependents = max(dependents, fam_members - 1.0, 0.0)

    # --- RULE 1: loan_amount > 5 * annual_income ---
    if annual_income > 0 and loan_amount > 5.0 * annual_income:
        if REASON_LOAN_EXCEEDS_INCOME_MULTIPLE not in reason_codes:
            reason_codes.append(REASON_LOAN_EXCEEDS_INCOME_MULTIPLE)

    # --- RULE 2: loan_amount > 10 * monthly_income ---
    if monthly_income > 0 and loan_amount > 10.0 * monthly_income:
        if REASON_LOAN_EXCEEDS_INCOME_MULTIPLE not in reason_codes:
            reason_codes.append(REASON_LOAN_EXCEEDS_INCOME_MULTIPLE)

    # --- RULE 3: (loan_amount / 12 + existing_monthly_debt) / monthly_income > 0.50 ---
    if monthly_income > 0:
        dti = ((loan_amount / 12.0) + existing_monthly_debt) / monthly_income
        if dti > 0.50:
            reason_codes.append(REASON_DTI_EXCEEDS_50_PERCENT)
    elif loan_amount > 0:
        # Zero monthly income with positive loan request is an automatic DTI breach
        reason_codes.append(REASON_DTI_EXCEEDS_50_PERCENT)

    # --- RULE 4: status == STUDENT AND employer is null AND loan_amount > 25000 ---
    if is_student and has_no_employer and loan_amount > 25000.0:
        reason_codes.append(REASON_STUDENT_NO_INCOME)

    # --- RULE 5: monthly_income / (dependents + 1) < 5000 ---
    income_per_capita = monthly_income / (effective_dependents + 1.0)
    if income_per_capita < 5000.0:
        reason_codes.append(REASON_SUBSISTENCE_INCOME_INSUFFICIENT)

    hard_rule_triggered = len(reason_codes) > 0
    return hard_rule_triggered, reason_codes
