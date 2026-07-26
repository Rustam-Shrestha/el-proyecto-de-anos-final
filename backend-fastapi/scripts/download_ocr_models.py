"""Pre-download OCR models at setup time so they're cached locally.

Run this once after `pip install -r requirements.txt` to avoid
first-request latency from model downloads.
"""

import os
import sys
import logging
import warnings

warnings.filterwarnings("ignore", category=UserWarning, module="paddle")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("download_ocr_models")

os.environ["FLAGS_use_mkldnn"] = "0"
os.environ["FLAGS_set_cpu_numa_arena_num"] = "1"
os.environ["GLOG_minloglevel"] = "3"
os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "1"


def download_paddleocr():
    logger.info("Pre-downloading PaddleOCR models (detection + recognition)...")
    try:
        from paddleocr import PaddleOCR
        PaddleOCR(lang='en', use_textline_orientation=False)
        logger.info("PaddleOCR models cached successfully")
    except Exception as e:
        logger.error("PaddleOCR model download failed: %s", e)
        raise


def download_easyocr():
    logger.info("Pre-downloading EasyOCR models (hi + en)...")
    try:
        import easyocr
        easyocr.Reader(["hi", "en"], gpu=False, verbose=False)
        logger.info("EasyOCR models cached successfully")
    except Exception as e:
        logger.error("EasyOCR model download failed: %s", e)
        raise


if __name__ == "__main__":
    logger.info("=== OCR Model Pre-download ===")
    success = True
    try:
        download_paddleocr()
    except Exception as e:
        logger.error("PaddleOCR download failed: %s", e)
        success = False

    try:
        download_easyocr()
    except Exception as e:
        logger.error("EasyOCR download failed: %s", e)
        success = False

    if not success:
        logger.warning("Some models failed to download. They will be downloaded on first use.")
        sys.exit(1)

    logger.info("All OCR models pre-downloaded successfully!")
