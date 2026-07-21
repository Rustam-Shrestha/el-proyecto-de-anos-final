"""
Financial Document OCR Service

Standalone service for extracting text from financial documents
(salary slips, bank statements, income certificates, etc.).

Uses EasyOCR (same engine as KYC OCR) but is completely independent
of KYC models, database, and application logic.

Usage:
    result = await financial_ocr_service.process_document("/path/to/image.jpg")
    # result = { "full_text": "...", "confidence": 0.92, "structured_data": {} }
"""

import asyncio
import logging
from pathlib import Path
from typing import Dict, Optional

import cv2
import numpy as np
import easyocr

logger = logging.getLogger(__name__)


class FinancialDocumentProcessor:
    """Processes financial document images and extracts raw text using EasyOCR."""

    CONFIDENCE_THRESHOLD = 0.3

    def __init__(self, use_gpu: bool = False):
        logger.info("Initializing Financial OCR with EasyOCR (gpu=%s)", use_gpu)
        self.reader = easyocr.Reader(["hi", "en"], gpu=use_gpu, verbose=False)

    async def process_image_async(self, image_path: str) -> Dict:
        """Run OCR on a financial document image asynchronously.

        Args:
            image_path: Absolute path to the image file.

        Returns:
            dict with keys:
                - full_text (str): All extracted text joined by newlines.
                - confidence (float): Average confidence score (0-1).
                - text_lines (list[str]): Individual text lines extracted.
                - error (str, optional): Error message if processing failed.
        """
        if not Path(image_path).exists():
            logger.warning("Financial document image not found: %s", image_path)
            return {
                "full_text": "",
                "confidence": 0.0,
                "text_lines": [],
                "error": "file_not_found",
            }

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, self._process_sync, image_path)
        return result

    def _process_sync(self, image_path: str) -> Dict:
        """Synchronous OCR processing pipeline.

        1. Load and preprocess image (grayscale, CLAHE, resize).
        2. Run EasyOCR text detection/recognition.
        3. Filter low-confidence results.
        4. Return raw text + confidence.
        """
        try:
            preprocessed = self._preprocess_image(image_path)
            logger.debug("Image preprocessed: %s", image_path)

            ocr_results = self.reader.readtext(preprocessed, detail=1, paragraph=False)

            lines = []
            confidences = []
            for bbox, text, confidence in ocr_results:
                if confidence >= self.CONFIDENCE_THRESHOLD:
                    lines.append(text)
                    confidences.append(confidence)

            full_text = "\n".join(lines)
            avg_confidence = (
                sum(confidences) / len(confidences)
                if confidences
                else 0.0
            )

            logger.info(
                "Financial OCR complete: %d lines, confidence=%.2f",
                len(lines),
                avg_confidence,
            )

            return {
                "full_text": full_text,
                "confidence": min(avg_confidence, 1.0),
                "text_lines": lines,
            }

        except Exception as e:
            logger.error(
                "Financial OCR processing error: %s", str(e), exc_info=True
            )
            return {
                "full_text": "",
                "confidence": 0.0,
                "text_lines": [],
                "error": str(e),
            }

    def _preprocess_image(self, image_path: str) -> np.ndarray:
        """Improve OCR accuracy with standard image preprocessing.

        - Convert to grayscale
        - Resize if too wide (keep aspect ratio, max 720px width)
        - Apply CLAHE for contrast enhancement
        """
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Cannot load image: {image_path}")

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        height, width = gray.shape
        if width > 720:
            scale = 720 / width
            new_height = int(height * scale)
            gray = cv2.resize(gray, (720, new_height), interpolation=cv2.INTER_AREA)

        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        gray = clahe.apply(gray)

        return gray


class FinancialOcrService:
    """High-level service wrapping FinancialDocumentProcessor."""

    def __init__(self):
        self.processor = FinancialDocumentProcessor(use_gpu=False)

    async def extract_text(self, image_path: str) -> Dict:
        """Extract all text from a financial document image.

        This is the main entry point. Returns raw OCR output only —
        structured field extraction happens in the Node.js backend
        (documentExtractionService.ts).

        Args:
            image_path: Absolute path to the image.

        Returns:
            dict with full_text, confidence, text_lines.
        """
        return await self.processor.process_image_async(image_path)


# Singleton instance
financial_ocr_service = FinancialOcrService()
