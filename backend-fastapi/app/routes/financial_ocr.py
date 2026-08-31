"""
Financial Document OCR Endpoint

This legacy document-text path is intentionally disabled in the active product flow.
The app uses manual financial-entry data and face verification only.
"""

import logging
import os
from pathlib import Path

from fastapi import APIRouter, Body, HTTPException

_financial_extraction_service = None


def get_extraction_service():
    global _financial_extraction_service
    if _financial_extraction_service is None:
        from app.services.financial_extraction_service import FinancialExtractionService
        _financial_extraction_service = FinancialExtractionService()
    return _financial_extraction_service


_financial_ocr_service = None


def get_ocr_service():
    global _financial_ocr_service
    if _financial_ocr_service is None:
        from app.services.financial_ocr_service import financial_ocr_service
        _financial_ocr_service = financial_ocr_service
    return _financial_ocr_service


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/financial", tags=["financial-ocr"])
_FINANCIAL_OCR_ENABLED = os.getenv("FINANCIAL_OCR_ENABLED", "").lower() == "true"


def _resolve_path(image_path: str) -> Path:
    resolved = Path(image_path)
    if resolved.exists():
        return resolved
    alt = Path("backend-node") / image_path
    if alt.exists():
        return alt
    alt2 = Path("..") / "backend-node" / image_path
    if alt2.exists():
        return alt2
    raise HTTPException(status_code=400, detail=f"File not found: {image_path}")


@router.post("/ocr")
async def ocr_financial_document(
    image_path: str = Body(..., description="Absolute path to the image file on disk"),
    document_type: str = Body(..., description="SALARY_SLIP | BANK_STATEMENT | INCOME_CERT | BUSINESS_REG | etc."),
):
    """Extract raw text from a financial document image using EasyOCR.

    Legacy endpoint — returns raw text only.
    For structured extraction, use /ocr/extract-document.

    Args:
        image_path: Absolute path to the document image on disk.
        document_type: Type of financial document.

    Returns:
        dict: { "full_text": str, "confidence": float, "text_lines": list[str] }

    Raises:
        400: File not found.
        500: OCR engine error.
    """
    if not _FINANCIAL_OCR_ENABLED:
        return {
            "full_text": "",
            "confidence": 0.0,
            "text_lines": [],
            "status": "disabled",
            "message": "Financial text extraction is disabled; manual review only.",
        }

    try:
        resolved = _resolve_path(image_path)
        result = await get_ocr_service().extract_text(str(resolved.resolve()))
        if result.get("error") and result["error"] != "file_not_found":
            raise HTTPException(status_code=500, detail=result["error"])
        return {
            "full_text": result.get("full_text", ""),
            "confidence": result.get("confidence", 0.0),
            "text_lines": result.get("text_lines", []),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Financial OCR failed: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")


@router.post("/ocr/extract-document")
async def extract_document(
    file_path: str = Body(..., description="Absolute path to document on disk"),
    document_type: str = Body(..., description="BANK_STATEMENT | SALARY_SLIP | INCOME_CERT | BUSINESS_REG | etc."),
):
    """Full document extraction with table parsing.

    Decision tree:
    1. Check MIME type / extension
    2. TEXT-EXTRACTABLE (.pdf, .docx, .xlsx, .txt) -> native extraction (NO OCR)
    3. IMAGE-BASED (.jpg, .png, scanned PDF) -> OCR (PaddleOCR -> EasyOCR)

    Returns unified schema with parsed transactions, bank metadata,
    raw text, and confidence scores.

    Args:
        file_path: Absolute path to the document file on disk.
        document_type: Type of financial document.

    Returns:
        dict: Unified schema (see strategy doc Part 2).
    """
    if not _FINANCIAL_OCR_ENABLED:
        return {
            "sourceType": "manual",
            "extractionMethod": "disabled",
            "bankMeta": {},
            "transactions": [],
            "parsingConfidence": 0,
            "needsManualMapping": True,
            "rawExtractedText": "",
            "rawTableData": [],
            "status": "disabled",
            "message": "Financial document extraction is disabled; manual review only.",
        }

    try:
        resolved = _resolve_path(file_path)
        service = get_extraction_service()
        result = await service.extract(str(resolved.resolve()), document_type)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Document extraction failed: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")
