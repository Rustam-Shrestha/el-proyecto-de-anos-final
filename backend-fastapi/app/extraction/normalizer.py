import logging
import re
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

MONTH_NAMES = {
    "january": 1, "february": 2, "march": 3, "april": 4,
    "may": 5, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12,
    "jan": 1, "feb": 2, "mar": 3, "apr": 4,
    "jun": 6, "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}


def parse_date(date_str: str) -> Optional[str]:
    """Parse various date formats to YYYY-MM-DD ISO format."""
    if not date_str:
        return None
    cleaned = re.sub(r'[^\d/\-\.\sA-Za-z]', ' ', date_str).strip()

    iso = re.match(r'(\d{4})[-/](\d{1,2})[-/](\d{1,2})', cleaned)
    if iso:
        y, m, d = iso.groups()
        return f"{y}-{m.zfill(2)}-{d.zfill(2)}"

    dd_mm = re.match(r'(\d{1,2})[-/](\d{1,2})[-/](\d{4})', cleaned)
    if dd_mm:
        d, m, y = dd_mm.groups()
        return f"{y}-{m.zfill(2)}-{d.zfill(2)}"

    dd_mm_short = re.match(r'(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})', cleaned)
    if dd_mm_short:
        d, m, y = dd_mm_short.groups()
        full_y = f"20{y}" if len(y) == 2 else y
        return f"{full_y}-{m.zfill(2)}-{d.zfill(2)}"

    month_pat = r'(' + '|'.join(MONTH_NAMES.keys()) + r')\s*(\d{1,2})[,\s]+(\d{4})'
    month_m = re.search(month_pat, date_str.lower())
    if month_m:
        m_name, d, y = month_m.groups()
        return f"{y}-{MONTH_NAMES[m_name]:02d}-{d.zfill(2)}"

    return None


def parse_amount(amount_str: str) -> Optional[float]:
    """Strip currency symbols and parse to float."""
    if not amount_str:
        return None
    cleaned = amount_str.replace(",", "").replace(" ", "")
    cleaned = re.sub(r'^[Rsr\.\s]+', '', cleaned)
    cleaned = re.sub(r'[()]', '', cleaned)
    try:
        val = float(cleaned)
        return val if val > 0 else None
    except (ValueError, TypeError):
        return None


def check_balance_chain(transactions: list) -> list:
    """Verify running balance chain. Flags mismatches without discarding rows."""
    prev_balance = None
    for txn in transactions:
        bal = txn.get("balance")
        if bal is not None and prev_balance is not None:
            expected = prev_balance
            amt = txn.get("amount")
            if txn.get("type") == "debit":
                expected = prev_balance - amt
            elif txn.get("type") == "credit":
                expected = prev_balance + amt
            diff = abs(bal - expected) if expected else 0
            txn["balanceMismatch"] = diff > 1.0
        else:
            txn["balanceMismatch"] = False
        if bal is not None:
            prev_balance = bal
    return transactions
