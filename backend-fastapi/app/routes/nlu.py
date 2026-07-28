"""
NLU Chatbot Route - Natural Language Query Processing for Financial Analysis.

This module provides an intelligent query endpoint that:
1. Classifies user intent (loan eligibility, income analysis, spending, etc.)
2. Extracts financial entities (amounts, tenures, dates)
3. Queries the PostgreSQL database for relevant financial data
4. Returns formatted responses with optional chart data

Boundary: Query processing only. No database writes. No business decisions.
"""

import re
import logging
from datetime import date
from enum import Enum
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/nlu", tags=["nlu"])


# ─── Pydantic Schemas ───────────────────────────────────────────────

class AskRequest(BaseModel):
    user_id: str
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: str = "default"


class AskResponse(BaseModel):
    intent: str
    extracted_entities: dict
    answer: str
    confidence: float = 0.85


class HealthResponse(BaseModel):
    status: str
    service: str


# ─── Intent Classification ──────────────────────────────────────────

class Intent(str, Enum):
    LOAN_ELIGIBILITY = "LOAN_ELIGIBILITY"
    INCOME_ANALYSIS = "INCOME_ANALYSIS"
    SPENDING_PATTERN = "SPENDING_PATTERN"
    SAVINGS_ANALYSIS = "SAVINGS_ANALYSIS"
    TRANSACTION_LIST = "TRANSACTION_LIST"
    FINANCIAL_HEALTH = "FINANCIAL_HEALTH"
    DEBT_ANALYSIS = "DEBT_ANALYSIS"
    COMPARISON = "COMPARISON"
    TREND_ANALYSIS = "TREND_ANALYSIS"
    UNRECOGNIZED = "UNRECOGNIZED"


def classify_intent(question: str) -> Intent:
    q = question.lower().strip()

    if re.search(r"(loan|eligible|borrow|lend|credit|approval|qualify)", q):
        if re.search(r"(how much|how many|amount|rs\.?|rupees)", q):
            return Intent.LOAN_ELIGIBILITY

    if re.search(r"(income|salary|earning|revenue)", q):
        if re.search(r"(average|monthly|total|how much)", q):
            return Intent.INCOME_ANALYSIS

    if re.search(r"(spend|expense|cost|bill|payment|purchase|where|pattern)", q):
        return Intent.SPENDING_PATTERN

    if re.search(r"(saving|saved|save|leftover|surplus)", q):
        return Intent.SAVINGS_ANALYSIS

    if re.search(r"(list|show|all|display|transactions|history)", q):
        return Intent.TRANSACTION_LIST

    if re.search(r"(credit|score|health|stability|rating)", q):
        return Intent.FINANCIAL_HEALTH

    if re.search(r"(debt|debt.?to.?income|dti|ratio|leverage)", q):
        return Intent.DEBT_ANALYSIS

    if re.search(r"(compare|comparison|vs|versus|difference|against)", q):
        return Intent.COMPARISON

    if re.search(r"(trend|growth|decline|change|over time|month|weekly)", q):
        return Intent.TREND_ANALYSIS

    return Intent.UNRECOGNIZED


# ─── Entity Extraction ──────────────────────────────────────────────

def extract_amount(text: str) -> Optional[float]:
    patterns = [
        (r"rs\.?\s*([\d,]+)", 1),
        (r"rupees?\s*([\d,]+)", 1),
        (r"₹\s*([\d,]+)", 1),
        (r"(\d+)\s*(?:lakh|lac)", 100000),
        (r"(\d+)\s*(?:crore)", 10000000),
    ]
    for pattern, multiplier in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            val = float(match.group(1).replace(",", ""))
            return val * multiplier
    return None


def extract_tenure(text: str) -> Optional[int]:
    patterns = [
        (r"(\d+)\s*months?", 1),
        (r"(\d+)\s*years?", 12),
    ]
    for pattern, multiplier in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return int(match.group(1)) * multiplier
    return None


def extract_entities(question: str) -> dict:
    return {
        "amount": extract_amount(question),
        "tenure_months": extract_tenure(question),
    }


# ─── SQL Templates ──────────────────────────────────────────────────

def financial_profile_sql(user_id: str) -> tuple:
    sql = """
    SELECT
        fp.avg_monthly_income, fp.avg_monthly_expense, fp.savings_rate,
        fp.debt_to_income_ratio, fp.income_stability_score,
        fp.credit_score_estimate, fp.total_statements,
        fp.total_income, fp.total_expense, fp.total_savings
    FROM auth.financial_profiles fp
    WHERE fp.user_id = %s
    """
    return (sql, (user_id,))


def monthly_trends_sql(user_id: str) -> tuple:
    sql = """
    SELECT
        DATE_TRUNC('month', t.transaction_date)::DATE AS month,
        COALESCE(SUM(CASE WHEN t.credit IS NOT NULL THEN t.credit ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN t.debit IS NOT NULL THEN t.debit ELSE 0 END), 0) AS expense
    FROM auth.transactions t
    WHERE t.user_id = %s
    GROUP BY DATE_TRUNC('month', t.transaction_date)
    ORDER BY month
    """
    return (sql, (user_id,))


def spending_by_category_sql(user_id: str) -> tuple:
    sql = """
    SELECT
        t.transaction_type AS category,
        COALESCE(SUM(t.debit), 0) AS total_spent,
        COUNT(*) AS transaction_count
    FROM auth.transactions t
    WHERE t.user_id = %s AND t.category = 'EXPENSE'
    GROUP BY t.transaction_type
    ORDER BY total_spent DESC
    """
    return (sql, (user_id,))


# ─── Endpoints ──────────────────────────────────────────────────────

@router.post("/ask", response_model=AskResponse)
async def ask_question(request: AskRequest):
    """Process a natural language financial query."""
    try:
        intent = classify_intent(request.message)
        entities = extract_entities(request.message)

        answer = generate_fallback_response(intent)

        return AskResponse(
            intent=str(intent),
            extracted_entities=entities,
            answer=answer,
        )
    except Exception as e:
        logger.error("NLU query failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok", service="finguard-nlu")


# ─── Response Generation ────────────────────────────────────────────

INTENT_HELP = {
    Intent.LOAN_ELIGIBILITY: (
        "To check loan eligibility, please use the loan assessment endpoint "
        "or ask in the chat interface. For example: 'How much loan can I get for ₹5,00,000?'"
    ),
    Intent.INCOME_ANALYSIS: (
        "Your income analysis is available in the financial dashboard. "
        "Key metrics include average monthly income, total income, and income stability."
    ),
    Intent.SPENDING_PATTERN: (
        "Your spending patterns are tracked in the financial dashboard. "
        "Categories include rent, utilities, food, travel, shopping, and more."
    ),
    Intent.SAVINGS_ANALYSIS: (
        "Your savings analysis shows how much you save each month. "
        "A savings rate above 20% is considered healthy."
    ),
    Intent.TRANSACTION_LIST: (
        "Your transactions are listed in the transactions dashboard. "
        "You can filter by date range, category, and transaction type."
    ),
    Intent.FINANCIAL_HEALTH: (
        "Your financial health summary includes credit score estimate, "
        "income stability score, and debt-to-income ratio."
    ),
    Intent.DEBT_ANALYSIS: (
        "Your debt-to-income (DTI) ratio is a key metric for loan eligibility. "
        "A DTI below 40% is preferred."
    ),
    Intent.COMPARISON: (
        "Income vs expense comparison shows your net savings each month. "
        "Positive cash flow indicates good financial health."
    ),
    Intent.TREND_ANALYSIS: (
        "Monthly trends show your income and expense patterns over time. "
        "Consistent income is a positive indicator for loan eligibility."
    ),
    Intent.UNRECOGNIZED: (
        "I can help you with questions about:\n"
        "• Loan eligibility\n• Income analysis\n• Spending patterns\n"
        "• Savings analysis\n• Financial health\n• Debt analysis\n"
        "• Transactions list\n• Trends\n• Income vs expenses"
    ),
}


def generate_fallback_response(intent: Intent) -> str:
    return INTENT_HELP.get(intent, "How can I help you with your finances?")
