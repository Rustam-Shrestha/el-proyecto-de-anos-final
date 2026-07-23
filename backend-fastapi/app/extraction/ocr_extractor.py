import asyncio
import logging
import os
import time
from pathlib import Path
from typing import Optional

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# Disable OneDNN to avoid "Filter not found in OneDnnContext" error in fused conv ops
os.environ["FLAGS_use_mkldnn"] = "0"


class OcrExtractor:
    """OCR extraction with PaddleOCR primary, EasyOCR fallback.

    Decision order:
    1. PaddleOCR (best Devanagari + table structure)
    2. EasyOCR (decent accuracy, simpler setup)
    3. Return error if neither available
    """

    MAX_RETRIES = 3
    RETRY_DELAY = 1.0

    def __init__(self):
        self._paddle_reader = None
        self._easy_reader = None
        self._use_paddle = self._check_paddle()

    def _check_paddle(self) -> bool:
        try:
            import paddle
            paddle.set_flags({"FLAGS_use_mkldnn": 0})
            from paddleocr import PaddleOCR
            self._paddle_reader = PaddleOCR(use_angle_cls=False, lang='en', show_log=False, use_gpu=False)
            logger.info("PaddleOCR loaded successfully")
            return True
        except Exception as e:
            logger.warning("PaddleOCR unavailable (%s), will use EasyOCR", e)
            return False

    def _get_easy_reader(self):
        if self._easy_reader is None:
            import easyocr
            self._easy_reader = easyocr.Reader(["hi", "en"], gpu=False, verbose=False)
            logger.info("EasyOCR loaded successfully")
        return self._easy_reader

    async def extract(self, file_path: str) -> dict:
        path = Path(file_path)
        if not path.exists():
            return {"full_text": "", "text_lines": [], "error": "file_not_found"}

        if path.suffix.lower() in (".pdf",):
            return await self._ocr_pdf(path)

        return await self._ocr_image(path)

    async def _ocr_pdf(self, path: Path) -> dict:
        try:
            import fitz
        except ImportError:
            return {"full_text": "", "text_lines": [], "error": "PyMuPDF not installed"}

        doc = fitz.open(str(path))
        all_text_lines = []
        all_confidences = []

        for page_num in range(doc.page_count):
            page = doc[page_num]
            pix = page.get_pixmap(dpi=200)
            img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
            img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

            result = await self._ocr_image_array(img)
            all_text_lines.extend(result.get("text_lines", []))
            all_confidences.extend(result.get("confidences", []))

        doc.close()

        avg_conf = sum(all_confidences) / len(all_confidences) if all_confidences else 0.0
        return {
            "full_text": "\n".join(all_text_lines),
            "text_lines": all_text_lines,
            "confidence": min(avg_conf, 1.0),
            "source_type": "OCR_SCANNED_PDF",
        }

    async def _ocr_image(self, path: Path) -> dict:
        img = cv2.imread(str(path))
        if img is None:
            return {"full_text": "", "text_lines": [], "error": "cannot_load_image"}
        return await self._ocr_image_array(img)

    async def _ocr_image_array(self, img: np.ndarray) -> dict:
        preprocessed = self._preprocess(img)

        if self._use_paddle and self._paddle_reader:
            return await self._run_paddle(preprocessed)

        return await self._run_easy(preprocessed)

    def _preprocess(self, img: np.ndarray) -> np.ndarray:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape
        if w > 2000:
            scale = 2000 / w
            gray = cv2.resize(gray, (2000, int(h * scale)), interpolation=cv2.INTER_AREA)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        return cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)

    async def _run_paddle(self, img: np.ndarray) -> dict:
        loop = asyncio.get_event_loop()

        def _sync():
            results = self._paddle_reader.ocr(img, cls=False)
            if not results or not results[0]:
                return {"full_text": "", "text_lines": [], "confidence": 0.0}
            lines = []
            confs = []
            for line in results[0]:
                text = line[1][0]
                conf = line[1][1]
                if conf >= 0.3:
                    lines.append(text)
                    confs.append(conf)
            avg_conf = sum(confs) / len(confs) if confs else 0.0
            return {
                "full_text": "\n".join(lines),
                "text_lines": lines,
                "confidences": confs,
                "confidence": min(avg_conf, 1.0),
                "source_type": "OCR_PADDLE",
            }

        for attempt in range(self.MAX_RETRIES):
            try:
                return await loop.run_in_executor(None, _sync)
            except (ConnectionResetError, ConnectionAbortedError, ConnectionError) as e:
                logger.warning("PaddleOCR connection error (attempt %d/%d): %s", attempt + 1, self.MAX_RETRIES, e)
                if attempt < self.MAX_RETRIES - 1:
                    await asyncio.sleep(self.RETRY_DELAY * (attempt + 1))
                else:
                    logger.error("PaddleOCR failed after %d retries", self.MAX_RETRIES)
                    return await loop.run_in_executor(None, _sync)

    async def _run_easy(self, img: np.ndarray) -> dict:
        reader = self._get_easy_reader()
        loop = asyncio.get_event_loop()

        def _sync():
            results = reader.readtext(img, detail=1, paragraph=False)
            lines = []
            confs = []
            for bbox, text, conf in results:
                if conf >= 0.3:
                    lines.append(text)
                    confs.append(conf)
            avg_conf = sum(confs) / len(confs) if confs else 0.0
            return {
                "full_text": "\n".join(lines),
                "text_lines": lines,
                "confidences": confs,
                "confidence": min(avg_conf, 1.0),
                "source_type": "OCR_EASYOCR",
            }

        for attempt in range(self.MAX_RETRIES):
            try:
                return await loop.run_in_executor(None, _sync)
            except (ConnectionResetError, ConnectionAbortedError, ConnectionError) as e:
                logger.warning("EasyOCR connection error (attempt %d/%d): %s", attempt + 1, self.MAX_RETRIES, e)
                if attempt < self.MAX_RETRIES - 1:
                    await asyncio.sleep(self.RETRY_DELAY * (attempt + 1))
                else:
                    logger.error("EasyOCR failed after %d retries", self.MAX_RETRIES)
                    return await loop.run_in_executor(None, _sync)
