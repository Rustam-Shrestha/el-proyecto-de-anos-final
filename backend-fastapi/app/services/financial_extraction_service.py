"""
Financial Document Extraction Service

Orchestrates the full extraction pipeline:
1. Route file to native text extractor or OCR based on MIME type
2. Parse tables from extraction result
3. Return unified schema

Stateless — no DB writes, no application logic.
"""

import logging
from pathlib import Path

from app.extraction.text_extractor import TextExtractor
from app.extraction.ocr_extractor import OcrExtractor
from app.extraction.table_parser import TableParser

logger = logging.getLogger(__name__)

TEXT_EXTRACTABLE_EXTS = {".pdf", ".docx", ".xlsx", ".txt"}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp", ".webp"}


class FinancialExtractionService:
    """Orchestrates document extraction: route -> extract -> parse -> normalize."""

    def __init__(self):
        self.text_extractor = TextExtractor()
        self.ocr_extractor = OcrExtractor()
        self.table_parser = TableParser()

    async def extract(self, file_path: str, document_type: str) -> dict:
        ext = Path(file_path).suffix.lower()

        if ext in TEXT_EXTRACTABLE_EXTS:
            extract_result = self.text_extractor.extract(file_path)
            if not extract_result.get("error") and extract_result.get("full_text", "").strip():
                return self._handle_text_result(extract_result, document_type)

        if ext in IMAGE_EXTS or ext == ".pdf":
            ocr_result = await self.ocr_extractor.extract(file_path)
            if not ocr_result.get("error"):
                ocr_result["source_type"] = ocr_result.get("source_type", "OCR_IMAGE")
                return self._handle_text_result(ocr_result, document_type)

        return self._empty_result(ext, file_path)

    def _handle_text_result(self, extract_result: dict, document_type: str) -> dict:
        source_type = extract_result.get("source_type", "UNKNOWN")
        tables = extract_result.get("tables", [])
        text_lines = extract_result.get("text_lines", [])
        full_text = extract_result.get("full_text", "")

        if document_type == "BANK_STATEMENT":
            parsed = self.table_parser.parse({
                "tables": tables,
                "text_lines": text_lines,
                "full_text": full_text,
                "source_type": source_type,
                "extractionMethod": self._get_method(source_type),
            })
            parsed["bankMeta"]["currency"] = "NPR"
            parsed["extractionMethod"] = self._get_method(source_type)
            parsed["documentType"] = document_type
            return parsed

        return {
            "documentId": None,
            "documentType": document_type,
            "sourceType": source_type,
            "extractionMethod": self._get_method(source_type),
            "bankMeta": {},
            "transactions": [],
            "parsingConfidence": 1.0,
            "needsManualMapping": False,
            "rawExtractedText": full_text,
            "rawTableData": tables[0] if tables else [],
        }

    def _get_method(self, source_type: str) -> str:
        mapping = {
            "TEXT_PDF": "pdfplumber",
            "NATIVE_DOCX": "python-docx",
            "NATIVE_XLSX": "openpyxl",
            "NATIVE_TXT": "native",
            "OCR_PADDLE": "paddleocr",
            "OCR_EASYOCR": "easyocr",
            "OCR_SCANNED_PDF": "paddleocr",
        }
        return mapping.get(source_type, "unknown")

    def _empty_result(self, ext: str, file_path: str) -> dict:
        return {
            "sourceType": "UNSUPPORTED",
            "extractionMethod": "none",
            "bankMeta": {},
            "transactions": [],
            "parsingConfidence": 0.0,
            "needsManualMapping": True,
            "rawExtractedText": "",
            "rawTableData": [],
            "error": f"Unsupported file format: {ext}",
        }
