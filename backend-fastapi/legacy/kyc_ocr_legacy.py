"""Legacy OCR extraction code retained for reference only.

This module intentionally is not imported by the active FastAPI app.
The live KYC workflow now performs face verification only and expects the
user to enter identity details manually.
"""

from __future__ import annotations

from typing import Any, Dict


async def legacy_ocr_citizenship(image_path: str, document_type: str) -> Dict[str, Any]:
    """Previous implementation placeholder.

    This used to call EasyOCR/PaddleOCR to derive identity data such as name,
    citizenship number, date of birth, gender, and address from the uploaded
    citizenship document.

    It is intentionally left here as an archive only. The active application does
    not call this code path.
    """
    return {
        "image_path": image_path,
        "document_type": document_type,
        "extracted_data": {},
        "overall_confidence": 0,
        "raw_text": "",
        "status": "legacy_disabled",
    }
