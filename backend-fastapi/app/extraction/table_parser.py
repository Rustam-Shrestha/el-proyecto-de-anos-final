import logging
import re
from typing import Optional

from .normalizer import parse_date, parse_amount, check_balance_chain

logger = logging.getLogger(__name__)

COLUMN_SYNONYMS = {
    "date": ["date", "transaction date", "txn date", "value date", "posting date", "transaction"],
    "description": ["description", "particulars", "narration", "details", "remarks", "transaction details", "transaction description"],
    "debit": ["withdraw", "withdrawal", "debit", "dr", "dr.", "paid", "paid out", "payment", "expense"],
    "credit": ["deposit", "credit", "cr", "cr.", "received", "deposits", "paid in"],
    "balance": ["balance", "closing balance", "running balance", "available balance", "current balance", "new balance"],
    "serial": ["s.n", "sn", "s.no", "sl no", "sr no", "#", "no", "number"],
}

BANK_META_SYNONYMS = {
    "bank_name": ["bank", "bank name"],
    "account_holder": ["account holder", "account name", "name of account", "customer name", "account holder name"],
    "account_number": ["account number", "a/c no", "account no", "acc no"],
    "opening_balance": ["opening balance", "open bal", "open balance", "b/f"],
    "closing_balance": ["closing balance", "close bal", "closing bal", "c/f"],
    "from_date": ["from date", "from", "period from", "statement from"],
    "to_date": ["to date", "to", "period to", "statement to", "upto"],
}


class TableParser:
    """Rule-based bank statement table parser.

    Strategy:
    1. Try pdfplumber table extraction first (gives rows/cols).
    2. Fallback to splitting raw lines on 2+ spaces or tab gaps.
    3. Match headers against COLUMN_SYNONYMS.
    4. Parse each row using mapped columns.
    5. Extract header metadata from top block.
    """

    def parse(self, extract_result: dict) -> dict:
        source_type = extract_result.get("source_type", "UNKNOWN")
        tables = extract_result.get("tables", [])
        text_lines = extract_result.get("text_lines", [])
        full_text = extract_result.get("full_text", "")

        raw_table = None
        if tables:
            raw_table = tables[0]

        if raw_table:
            return self._parse_table(raw_table, source_type, full_text)

        return self._parse_from_lines(text_lines, source_type, full_text)

    def _parse_table(self, table: list, source_type: str, full_text: str) -> dict:
        if not table:
            return self._empty_result()

        header_row, header_idx = self._find_header(table)
        if not header_row:
            header_row = table[0]
            header_idx = 0

        col_map = self._map_columns(header_row)

        raw_table_data = table
        needs_manual = any(can not in col_map for can in ("date", "debit", "credit"))

        transactions = []
        for row in table[header_idx + 1:]:
            txn = self._parse_row(row, col_map)
            if txn:
                transactions.append(txn)

        transactions = check_balance_chain(transactions)
        bank_meta = self._extract_bank_meta(full_text)

        if transactions and bank_meta.get("opening_balance") is not None:
            bank_meta["openingBalance"] = bank_meta.pop("opening_balance")
        if transactions and bank_meta.get("closing_balance") is not None:
            bank_meta["closingBalance"] = bank_meta.pop("closing_balance")

        confidence = self._calculate_confidence(transactions, needs_manual)

        return {
            "sourceType": source_type,
            "extractionMethod": "pdfplumber" if source_type == "TEXT_PDF" else source_type.lower(),
            "bankMeta": bank_meta,
            "transactions": transactions,
            "parsingConfidence": confidence,
            "needsManualMapping": needs_manual,
            "rawExtractedText": full_text,
            "rawTableData": raw_table_data,
        }

    def _parse_from_lines(self, text_lines: list, source_type: str, full_text: str) -> dict:
        return {
            "sourceType": source_type,
            "extractionMethod": source_type.lower(),
            "bankMeta": self._extract_bank_meta(full_text),
            "transactions": [],
            "parsingConfidence": 0.5,
            "needsManualMapping": True,
            "rawExtractedText": full_text,
            "rawTableData": [text_lines],
        }

    def _find_header(self, table: list) -> tuple:
        for idx, row in enumerate(table[:5]):
            cells = [str(c).strip().lower() for c in row if c]
            if self._is_header_row(cells):
                return row, idx
        return None, 0

    def _is_header_row(self, cells: list) -> bool:
        all_known = sum(1 for c in cells if self._match_synonym(c))
        return all_known >= 2

    def _match_synonym(self, cell: str) -> Optional[str]:
        cell_lower = cell.strip().lower()
        for canonical, syns in COLUMN_SYNONYMS.items():
            for s in syns:
                if self._fuzzy_match(cell_lower, s):
                    return canonical
        return None

    def _fuzzy_match(self, a: str, b: str) -> bool:
        if a == b:
            return True
        if b in a or a in b:
            return True
        a_clean = re.sub(r'[^a-z0-9]', '', a)
        b_clean = re.sub(r'[^a-z0-9]', '', b)
        if a_clean == b_clean:
            return True
        if len(a_clean) > 2 and len(b_clean) > 2:
            if b_clean in a_clean or a_clean in b_clean:
                return True
        return False

    def _map_columns(self, header_row: list) -> dict:
        mapping = {}
        for idx, cell in enumerate(header_row):
            matched = self._match_synonym(str(cell))
            if matched:
                mapping[matched] = idx
        return mapping

    def _parse_row(self, row: list, col_map: dict) -> Optional[dict]:
        cells = [str(c).strip() if c else "" for c in row]
        if not any(c for c in cells):
            return None

        date_raw = cells[col_map["date"]] if "date" in col_map and col_map["date"] < len(cells) else ""
        desc_raw = cells[col_map["description"]] if "description" in col_map and col_map["description"] < len(cells) else ""
        debit_raw = cells[col_map["debit"]] if "debit" in col_map and col_map["debit"] < len(cells) else ""
        credit_raw = cells[col_map["credit"]] if "credit" in col_map and col_map["credit"] < len(cells) else ""
        bal_raw = cells[col_map["balance"]] if "balance" in col_map and col_map["balance"] < len(cells) else ""

        date_iso = parse_date(date_raw)
        debit_val = parse_amount(debit_raw)
        credit_val = parse_amount(credit_raw)
        bal_val = parse_amount(bal_raw)

        if not date_iso and not debit_val and not credit_val:
            return None

        txn_type = "debit" if debit_val else "credit"
        amount = debit_val or credit_val

        return {
            "date": date_iso,
            "description": desc_raw,
            "type": txn_type,
            "amount": amount,
            "balance": bal_val,
            "balanceMismatch": False,
        }

    def _extract_bank_meta(self, text: str) -> dict:
        meta = {}
        lines = text.split("\n")
        for line in lines[:40]:
            line_lower = line.strip().lower()
            for field, syns in BANK_META_SYNONYMS.items():
                for syn in syns:
                    pattern = re.compile(re.escape(syn) + r'\s*[:.]?\s*(.+)', re.IGNORECASE)
                    m = pattern.search(line_lower)
                    if m:
                        val = m.group(1).strip()
                        if field in ("opening_balance", "closing_balance"):
                            parsed = parse_amount(val)
                            if parsed is not None:
                                meta[field] = parsed
                        elif field in ("from_date", "to_date"):
                            parsed = parse_date(val)
                            if parsed:
                                meta[field] = parsed
                        elif field == "account_number":
                            num = re.sub(r'[^\w]', '', val)
                            meta[field] = num
                        else:
                            meta[field] = val.title()
                        break
        return meta

    def _calculate_confidence(self, transactions: list, needs_manual: bool) -> float:
        if needs_manual or not transactions:
            return 0.3
        parsed_count = sum(1 for t in transactions if t.get("date") and t.get("amount"))
        ratio = parsed_count / len(transactions) if transactions else 0
        mismatch_count = sum(1 for t in transactions if t.get("balanceMismatch"))
        mismatch_penalty = 1.0 - (mismatch_count / len(transactions)) if transactions else 1.0
        return round(min(ratio * mismatch_penalty, 1.0), 2)

    def _empty_result(self) -> dict:
        return {
            "sourceType": "UNKNOWN",
            "extractionMethod": "none",
            "bankMeta": {},
            "transactions": [],
            "parsingConfidence": 0.0,
            "needsManualMapping": True,
            "rawExtractedText": "",
            "rawTableData": [],
        }
