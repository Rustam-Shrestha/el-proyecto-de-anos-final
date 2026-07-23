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
import io
import logging
import os
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

        Supports both images (.jpg, .png, etc.) and PDFs.
        PDFs are rendered to images internally via PyMuPDF.

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

    @staticmethod
    def _pdf_to_images(pdf_path: str) -> list:
        try:
            import fitz
        except ImportError:
            raise ImportError("PyMuPDF (fitz) is required to OCR PDF files")

        doc = fitz.open(pdf_path)
        images = []
        for page_num in range(doc.page_count):
            page = doc[page_num]
            pix = page.get_pixmap(dpi=200)
            img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
            img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
            images.append(img)
        doc.close()
        return images

    def _process_sync(self, image_path: str) -> Dict:
        """Synchronous OCR processing pipeline.

        1. Load file (PDF → render to images, image → load directly).
        2. Preprocess (grayscale, CLAHE, resize).
        3. Run EasyOCR text detection/recognition.
        4. Filter low-confidence results.
        5. Return raw text + confidence.
        """
        try:
            path = Path(image_path)
            ext = path.suffix.lower()

            if ext == ".pdf":
                page_images = self._pdf_to_images(image_path)
            else:
                page_images = [cv2.imread(image_path)]
                if page_images[0] is None:
                    raise ValueError(f"Cannot load image: {image_path}")

            all_lines = []
            all_confidences = []

            for img in page_images:
                preprocessed = self._preprocess_image_array(img)
                ocr_results = self.reader.readtext(preprocessed, detail=1, paragraph=False)

                for bbox, text, confidence in ocr_results:
                    if confidence >= self.CONFIDENCE_THRESHOLD:
                        all_lines.append(text)
                        all_confidences.append(confidence)

            full_text = "\n".join(all_lines)
            avg_confidence = (
                sum(all_confidences) / len(all_confidences)
                if all_confidences
                else 0.0
            )

            logger.info(
                "Financial OCR complete: %d lines, confidence=%.2f",
                len(all_lines),
                avg_confidence,
            )

            return {
                "full_text": full_text,
                "confidence": min(avg_confidence, 1.0),
                "text_lines": all_lines,
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

    @staticmethod
    def _preprocess_image_array(img: np.ndarray) -> np.ndarray:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        height, width = gray.shape
        if width > 720:
            scale = 720 / width
            new_height = int(height * scale)
            gray = cv2.resize(gray, (720, new_height), interpolation=cv2.INTER_AREA)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        return clahe.apply(gray)

    def _preprocess_image(self, image_path: str) -> np.ndarray:
        """Legacy method — kept for backward compatibility."""
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Cannot load image: {image_path}")
        return self._preprocess_image_array(image)


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
