import asyncio
import json
import logging
import os
import re
import uuid
from pathlib import Path
from typing import Dict, List, Tuple, Optional

import cv2
import numpy as np
import easyocr
from thefuzz import fuzz
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import OCRResult, KYCApplication

logger = logging.getLogger(__name__)


class OCRProcessor:

    FIELD_KEYWORDS = {
        "name": ["\u0928\u093e\u092e", "name", "\u0928\u093e\u092e:"],
        "surname": ["\u0925\u0930", "surname", "\u0925\u0930:", "family name"],
        "dob": ["\u091c\u0928\u094d\u092e \u092e\u093f\u0924\u093f", "date of birth", "dob", "\u091c\u0928\u094d\u092e:", "d.o.b"],
        "citizenship_number": ["\u0928\u093e\u0917\u0930\u093f\u0915\u0924\u093e \u0928\u0902", "citizenship no", "citizenship number", "\u0928\u093e\u0917\u0930\u093f\u0915\u0924\u093e:"],
        "citizenship_number_alt": ["document number", "\u0926\u0938\u094d\u0924\u093e\u0935\u0947\u091c \u0938\u0902\u0916\u094d\u092f\u093e"],
        "gender": ["\u0932\u093f\u0919\u094d\u0917", "sex", "gender", "\u0932\u093f\u0919\u094d\u0917:"],
        "address": ["\u0920\u0947\u0917\u093e\u0928\u093e", "address", "address:", "\u0920\u0947\u0917\u093e\u0928\u093e:"],
        "father_name": ["\u092c\u093e\u092c\u0941", "father", "father name", "\u092c\u093e\u092c\u0941:"],
        "mother_name": ["\u0906\u092e\u093e", "mother", "mother name", "\u0906\u092e\u093e:"],
    }

    CONFIDENCE_THRESHOLD = 0.3
    FUZZY_MATCH_THRESHOLD = 50
    FUZZY_MATCH_THRESHOLD_STRICT = 70  # For longer keywords (>5 chars)

    def __init__(self, use_gpu: bool = False, lang: str = "hi"):
        logger.info("Initializing EasyOCR with gpu=%s, lang=%s", use_gpu, lang)
        self.ocr = easyocr.Reader(["hi", "en"], gpu=use_gpu, verbose=False)
        self.lang = lang

    async def process_image_async(self, image_path: str) -> Dict:
        if not Path(image_path).exists():
            logger.warning("Image file not found: %s", image_path)
            return {"raw_text": "", "structured_data": {}, "confidence_score": 0.0, "language_detected": "unknown", "error": "file_not_found"}

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, self._process_image_sync, image_path)
        return result

    def _process_image_sync(self, image_path: str) -> Dict:
        try:
            preprocessed = self._preprocess_image(image_path)
            logger.debug("Image preprocessed: %s", image_path)

            ocr_results = self.ocr.readtext(preprocessed, detail=1, paragraph=False)

            raw_lines, confs = self._extract_raw_text(ocr_results)
            raw_text = "\n".join(raw_lines)
            logger.debug("OCR extraction complete. Lines: %d", len(raw_lines))

            language = self._detect_language(raw_text)

            structured_data, confidence = self._structure_data(raw_lines, confs)

            if "citizenship_number" not in structured_data or not structured_data["citizenship_number"]:
                civ = self._extract_citizenship_number(raw_lines)
                if civ:
                    structured_data["citizenship_number"] = civ

            logger.info("Data structured. Confidence: %.2f", confidence)

            return {
                "raw_text": raw_text,
                "structured_data": structured_data,
                "confidence_score": confidence,
                "language_detected": language,
            }

        except Exception as e:
            logger.error("Error processing image %s: %s", image_path, str(e), exc_info=True)
            return {
                "raw_text": "",
                "structured_data": {},
                "confidence_score": 0.0,
                "language_detected": "unknown",
                "error": str(e),
            }

    def _preprocess_image(self, image_path: str) -> np.ndarray:
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

        logger.debug("Image preprocessed. Shape: %s", gray.shape)
        return gray

    def _extract_raw_text(self, ocr_results: List) -> Tuple[List[str], List[float]]:
        raw_lines = []
        confidences = []
        for bbox, text, confidence in ocr_results:
            if confidence >= self.CONFIDENCE_THRESHOLD:
                raw_lines.append(text)
                confidences.append(confidence)
        return raw_lines, confidences

    def _detect_language(self, text: str) -> str:
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

    def _structure_data(self, raw_lines: List[str], confidences: List[float]) -> Tuple[Dict, float]:
        structured = {}
        matched_confidences = []

        for field_name, keywords in self.FIELD_KEYWORDS.items():
            best_match = None
            best_score = 0
            best_confidence = 0

            for i, line in enumerate(raw_lines):
                for keyword in keywords:
                    if self._find_field_in_text(keyword, line):
                        score = 100
                    else:
                        score = 0
                    if score > best_score and score > self.FUZZY_MATCH_THRESHOLD:
                        best_score = score
                        best_match = i
                        best_confidence = confidences[i] if i < len(confidences) else 0.5

            if best_match is not None:
                value = self._extract_field_value(raw_lines, best_match)
                if field_name in ("citizenship_number", "citizenship_number_alt") and value:
                    digits = re.sub(r'\D', '', value)
                    if re.match(r'^\d{11}$', digits):
                        value = digits
                    else:
                        logger.warning("Invalid citizenship number format: %s", value)
                        value = None
                if value is not None:
                    structured[field_name] = value
                    matched_confidences.append(best_confidence)

        if "citizenship_number_alt" in structured and "citizenship_number" not in structured:
            structured["citizenship_number"] = structured.pop("citizenship_number_alt")
        elif "citizenship_number_alt" in structured:
            del structured["citizenship_number_alt"]

        overall_confidence = sum(matched_confidences) / len(matched_confidences) if matched_confidences else 0.0
        overall_confidence = min(overall_confidence, 1.0)

        logger.debug("Structured data: %s fields. Overall confidence: %.2f", len(structured), overall_confidence)
        return structured, overall_confidence

    def _find_field_in_text(self, keyword: str, line: str) -> bool:
        if len(keyword) <= 5:
            return keyword.lower() in line.lower()
        score = fuzz.token_set_ratio(keyword.lower(), line.lower())
        return score > self.FUZZY_MATCH_THRESHOLD_STRICT

    def _extract_field_value(self, lines: List[str], line_index: int) -> str:
        line = lines[line_index]

        if line_index + 1 < len(lines):
            next_line = lines[line_index + 1].strip()
            is_keyword = any(
                kw.lower() in next_line.lower()
                for kws in self.FIELD_KEYWORDS.values()
                for kw in kws
            )
            if next_line and not is_keyword and len(next_line) > 2:
                return next_line

        for sep in [":", "-", "\u2014", "\u2013", "="]:
            if sep in line:
                parts = line.split(sep, 1)
                if len(parts) > 1 and parts[1].strip():
                    return parts[1].strip()

        all_keywords = sorted(
            set(kw for kws in self.FIELD_KEYWORDS.values() for kw in kws),
            key=len,
            reverse=True,
        )
        lower_line = line.lower()
        for kw in all_keywords:
            idx = lower_line.find(kw.lower())
            if idx >= 0:
                after = line[idx + len(kw):].strip().lstrip(":-\u2014\u2013= ").strip()
                if after:
                    return after

        return line.strip()

    def _extract_citizenship_number(self, raw_lines: List[str]) -> Optional[str]:
        for line in raw_lines:
            digits = re.sub(r'\D', '', line)
            if re.match(r'^\d{11}$', digits):
                return digits
        return None


class OCRService:

    def __init__(self):
        self.processor = OCRProcessor(use_gpu=False, lang="hi")

    async def process_document(
        self,
        image_path: str,
        kyc_application_id: str,
        document_type: str,
        session: AsyncSession,
    ) -> OCRResult:
        logger.info("Processing document: %s (app_id=%s)", image_path, kyc_application_id)

        result = await self.processor.process_image_async(image_path)

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


ocr_service = OCRService()
