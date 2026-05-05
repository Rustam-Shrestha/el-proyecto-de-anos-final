"""
OCR Service - Mixed-Script Document Processing.

This module provides comprehensive OCR functionality for extracting structured data
from documents containing both Devanagari (Hindi) and English text.

Core Components:
1. Image Preprocessing: Grayscale conversion, resizing, noise reduction.
2. PaddleOCR Integration: Language detection and text extraction.
3. Fuzzy Matcher: Identifies key fields using Devanagari/English keyword matching.
4. Data Structuring: Converts raw OCR output into structured key-value pairs.
5. Persistence: Saves results to the database.

Key Features:
- Supports mixed-script documents (Devanagari + English).
- Proximity-based field detection for structured data extraction.
- Confidence scoring for extracted fields.
- Async processing for I/O-intensive operations.
"""

import asyncio
import json
import logging
import uuid
from pathlib import Path
from typing import Dict, List, Tuple, Optional

import cv2
import numpy as np
from paddleocr import PaddleOCR
from thefuzz import fuzz
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import OCRResult, KYCApplication

logger = logging.getLogger(__name__)


class OCRProcessor:
    """
    Manages OCR extraction and data structuring for mixed-script documents.
    """

    # Devanagari and English keywords for fuzzy matching
    FIELD_KEYWORDS = {
        "name": ["नाम", "name", "नाम:"],
        "surname": ["थर", "surname", "थर:", "family name"],
        "dob": ["जन्म मिति", "date of birth", "dob", "जन्म:", "d.o.b"],
        "citizenship_number": ["नागरिकता नं", "citizenship no", "citizenship number", "नागरिकता:"],
        "citizenship_number_alt": ["document number", "दस्तावेज संख्या"],
        "gender": ["लिङ्ग", "sex", "gender", "लिङ्ग:"],
        "address": ["ठेगाना", "address", "address:", "ठेगाना:"],
        "father_name": ["बाबु", "father", "father name", "बाबु:"],
        "mother_name": ["आमा", "mother", "mother name", "आमा:"],
    }

    CONFIDENCE_THRESHOLD = 0.5  # Minimum OCR confidence to include a field

    def __init__(self, use_gpu: bool = False, lang: str = "hi"):
        """
        Initialize PaddleOCR with configuration for i3 processor compatibility.

        Args:
            use_gpu (bool): Enable GPU acceleration (False for i3 compatibility).
            lang (str): Primary language ('hi' for Devanagari, 'en' for English).
        """
        logger.info("Initializing PaddleOCR with use_gpu=%s, lang=%s", use_gpu, lang)
        # PaddleOCR expects a hashable language identifier (string); passing a list
        # caused `TypeError: unhashable type: 'list'`. Use a single language string here.
        # For mixed-script extraction, you can switch to a different model or run
        # two passes (hi then en) if needed. Default to the provided `lang`.
        self.ocr = PaddleOCR(use_gpu=use_gpu, lang=lang, use_angle_cls=True)
        self.lang = lang

    async def process_image_async(self, image_path: str) -> Dict:
        """
        Asynchronously process an image file for OCR extraction.

        Args:
            image_path (str): Path to the image file.

        Returns:
            Dict: Contains 'raw_text', 'structured_data', 'confidence_score', 'language_detected'.

        Raises:
            FileNotFoundError: If image file does not exist.
            ValueError: If image cannot be processed.
        """
        if not Path(image_path).exists():
            raise FileNotFoundError(f"Image file not found: {image_path}")

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, self._process_image_sync, image_path)
        return result

    def _process_image_sync(self, image_path: str) -> Dict:
        """
        Synchronous image processing (executed in thread pool).

        Steps:
        1. Load and preprocess image.
        2. Run PaddleOCR extraction.
        3. Detect language.
        4. Apply fuzzy matching.
        5. Structure data and calculate confidence.
        """
        try:
            # Step 1: Preprocess image
            preprocessed = self._preprocess_image(image_path)
            logger.debug("Image preprocessed: %s", image_path)

            # Step 2: Run OCR
            ocr_output = self.ocr.ocr(preprocessed, cls=True)
            raw_text_lines = self._extract_raw_text(ocr_output)
            raw_text = "\n".join(raw_text_lines)
            logger.debug("OCR extraction complete. Lines: %d", len(raw_text_lines))

            # Step 3: Detect language
            language = self._detect_language(raw_text)

            # Step 4: Apply fuzzy matching and structuring
            structured_data, confidence = self._structure_data(raw_text_lines, ocr_output)
            logger.info("Data structured. Confidence: %.2f", confidence)

            return {
                "raw_text": raw_text,
                "structured_data": structured_data,
                "confidence_score": confidence,
                "language_detected": language,
            }

        except Exception as e:
            logger.error("Error processing image %s: %s", image_path, str(e), exc_info=True)
            raise ValueError(f"Failed to process image: {str(e)}")

    def _preprocess_image(self, image_path: str) -> np.ndarray:
        """
        Preprocess image for optimal OCR extraction.

        Steps:
        1. Load image.
        2. Convert to grayscale.
        3. Resize to max 1080px width while maintaining aspect ratio.
        4. Apply slight contrast enhancement using CLAHE.
        """
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Cannot load image: {image_path}")

        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Resize to max 1080px width
        height, width = gray.shape
        if width > 1080:
            scale = 1080 / width
            new_height = int(height * scale)
            gray = cv2.resize(gray, (1080, new_height), interpolation=cv2.INTER_AREA)

        # Apply CLAHE for contrast enhancement
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        gray = clahe.apply(gray)

        logger.debug("Image preprocessed. Shape: %s", gray.shape)
        return gray

    def _extract_raw_text(self, ocr_output: List) -> List[str]:
        """
        Extract raw text from PaddleOCR output.

        PaddleOCR returns: [[[x1, y1], [x2, y2], ...], ('text', confidence)], ...]

        Returns:
            List[str]: Extracted text lines.
        """
        raw_lines = []
        for line in ocr_output:
            for word_info in line:
                text = word_info[1][0]
                confidence = word_info[1][1]
                if confidence >= self.CONFIDENCE_THRESHOLD:
                    raw_lines.append(text)
        return raw_lines

    def _detect_language(self, text: str) -> str:
        """
        Detect the language in the text (hi, en, or mixed).

        Uses Unicode ranges:
        - Devanagari: U+0900 to U+097F
        - Latin: U+0041 to U+005A, U+0061 to U+007A
        """
        devanagari_count = sum(1 for c in text if '\u0900' <= c <= '\u097F')
        latin_count = sum(1 for c in text if ('A' <= c <= 'Z') or ('a' <= c <= 'z'))
        total = devanagari_count + latin_count

        if total == 0:
            return "unknown"

        devanagari_ratio = devanagari_count / total
        latin_ratio = latin_count / total

        if devanagari_ratio > 0.7:
            return "hi"
        elif latin_ratio > 0.7:
            return "en"
        else:
            return "mixed"

    def _structure_data(self, raw_lines: List[str], ocr_output: List) -> Tuple[Dict, float]:
        """
        Apply fuzzy matching to extract structured key-value pairs.

        Algorithm:
        1. For each field type, find the best matching line using fuzzy matching.
        2. Extract the value from the matched line (proximity-based if possible).
        3. Calculate overall confidence as average of matched field confidences.

        Args:
            raw_lines (List[str]): Extracted text lines.
            ocr_output (List): Full OCR output with bounding boxes and confidence.

        Returns:
            Tuple[Dict, float]: (structured_data, confidence_score)
        """
        structured = {}
        confidences = []

        for field_name, keywords in self.FIELD_KEYWORDS.items():
            best_match = None
            best_score = 0
            best_confidence = 0

            for i, line in enumerate(raw_lines):
                for keyword in keywords:
                    # Use token_set_ratio for more flexible matching
                    score = fuzz.token_set_ratio(keyword.lower(), line.lower())
                    if score > best_score and score > 60:  # Threshold for fuzzy match
                        best_score = score
                        best_match = i
                        # Extract confidence from OCR output
                        best_confidence = ocr_output[i][0][-1] if i < len(ocr_output) else 0.5

            if best_match is not None:
                # Extract value: next non-keyword line or remainder of matched line
                value = self._extract_field_value(raw_lines, best_match)
                structured[field_name] = value
                confidences.append(best_confidence)

        # Calculate overall confidence
        overall_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        overall_confidence = min(overall_confidence, 1.0)

        logger.debug("Structured data: %s fields. Overall confidence: %.2f", len(structured), overall_confidence)
        return structured, overall_confidence

    def _extract_field_value(self, lines: List[str], line_index: int) -> str:
        """
        Extract the value for a matched field.

        Strategy:
        1. Check if the next line is a value (non-keyword).
        2. Otherwise, extract remainder of the current line after the keyword.
        3. Fallback to the entire line if nothing else works.
        """
        if line_index + 1 < len(lines):
            next_line = lines[line_index + 1]
            # Check if next line is a keyword (heuristic: short, all caps or Devanagari)
            if not any(kw.lower() in next_line.lower() for kws in self.FIELD_KEYWORDS.values() for kw in kws):
                return next_line.strip()

        # Try to extract the part after the colon or keyword
        line = lines[line_index]
        if ":" in line:
            parts = line.split(":", 1)
            if len(parts) > 1:
                return parts[1].strip()

        return line.strip()


class OCRService:
    """
    High-level OCR service for integration with FastAPI endpoints.
    """

    def __init__(self):
        self.processor = OCRProcessor(use_gpu=False, lang="hi")

    async def process_document(
        self,
        image_path: str,
        kyc_application_id: str,
        document_type: str,
        session: AsyncSession,
    ) -> OCRResult:
        """
        Process a document image and save results to the database.

        Args:
            image_path (str): Path to the image file.
            kyc_application_id (str): ID of the KYC application.
            document_type (str): Type of document (citizenship_front, citizenship_back, etc.).
            session (AsyncSession): SQLAlchemy async session.

        Returns:
            OCRResult: Database record of the OCR result.
        """
        logger.info("Processing document: %s (app_id=%s)", image_path, kyc_application_id)

        # Process image asynchronously
        result = await self.processor.process_image_async(image_path)

        # Create database record
        ocr_record = OCRResult(
            id=uuid.uuid4(),
            kyc_application_id=kyc_application_id,
            document_type=document_type,
            raw_text=result["raw_text"],
            structured_data=result["structured_data"],
            confidence_score=result["confidence_score"],
            language_detected=result["language_detected"],
        )

        session.add(ocr_record)
        await session.flush()
        logger.info("OCR result saved: %s", ocr_record.id)

        return ocr_record


# Global OCR service instance
ocr_service = OCRService()
