"""
Financial Document OCR Endpoint

Stateless endpoint: receives image path + document type, runs OCR,
returns raw text + confidence. The caller (Express backend) handles
all structured extraction, comparison, and storage.

This is a completely separate module from KYC OCR — no KYC models,
no database, no application logic. Pure OCR extraction.
"""

import logging
from pathlib import Path

from fastapi import APIRouter, Body, HTTPException

# Lazy import to avoid circular dependencies on startup
_financial_ocr_service = None


def get_service():
    global _financial_ocr_service
    if _financial_ocr_service is None:
        from app.services.financial_ocr_service import financial_ocr_service
        _financial_ocr_service = financial_ocr_service
    return _financial_ocr_service


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/financial", tags=["financial-ocr"])


@router.post("/ocr")
async def ocr_financial_document(
    image_path: str = Body(..., description="Absolute path to the image file on disk"),
    document_type: str = Body(..., description="SALARY_SLIP | BANK_STATEMENT | INCOME_CERT | BUSINESS_REG | etc."),
):
    """Extract raw text from a financial document image using EasyOCR.

    Accepts a file path to an image already on disk and returns all
    extracted text. The caller (Express backend) is responsible for:
    - Validating file existence
    - Running structured field extraction (salary, date, employer, etc.)
    - Comparing with user-declared values
    - Generating anomaly flags

    Args:
        image_path: Absolute path to the document image on disk.
        document_type: Type of financial document.

    Returns:
        dict: {
            "full_text": str,
            "confidence": float,
            "text_lines": list[str]
        }

    Raises:
        400: Image file not found or unreadable.
        500: OCR engine error.
    """
    try:
        resolved = Path(image_path)
        if not resolved.exists():
            # Try relative to backend-node/uploads
            alt = Path("backend-node") / image_path
            if alt.exists():
                resolved = alt
            else:
                alt2 = Path("..") / "backend-node" / image_path
                if alt2.exists():
                    resolved = alt2
                else:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Image file not found: {image_path}",
                    )

        result = await get_service().extract_text(str(resolved.resolve()))

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
