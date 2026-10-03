import asyncio
import os
import sys

os.environ['PYTHONIOENCODING'] = 'utf-8'
os.environ['TF_USE_LEGACY_KERAS'] = '1'
os.environ['FLAGS_use_mkldnn'] = '0'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

try:
    from .app.db import init_db
    from .app.api.v1 import api_router
except Exception:
    from app.db import init_db
    from app.api.v1 import api_router

logger = logging.getLogger(__name__)

# Global model state
_models_ready = {"ocr": False, "face": False, "ocr_paddle": False}


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting FastAPI application...")
    await init_db()
    logger.info("Database initialized successfully")

    logger.info("Loading AI models before accepting requests...")
    _models_ready["ocr"] = False
    _models_ready["ocr_paddle"] = False
    _models_ready["face"] = False

    try:
        from app.services.ocr_service import ocr_service
        _ = ocr_service.processor.ocr
        _models_ready["ocr"] = True
        logger.info("EasyOCR ready")
    except Exception as e:
        logger.warning("EasyOCR pre-load failed: %s", e)

    try:
        from app.extraction.ocr_extractor import OcrExtractor
        _ = OcrExtractor()
        _models_ready["ocr_paddle"] = True
        logger.info("PaddleOCR ready")
    except Exception as e:
        logger.warning("PaddleOCR pre-load failed: %s", e)

    try:
        from app.services.identity_service import face_service
        from deepface import DeepFace
        DeepFace.build_model("Facenet")
        _models_ready["face"] = True
        logger.info("DeepFace Facenet ready")
    except Exception as e:
        logger.warning("DeepFace pre-load failed: %s", e)

    logger.info("All AI models loaded — server ready")
    yield
    logger.info("Shutting down FastAPI application...")


def create_app() -> FastAPI:
    app = FastAPI(
        title="KYC & Financial OCR Service",
        description="""Professional Identity Verification & Document OCR Pipeline.

**Capabilities:**
- **KYC Workflow** — Document upload, face matching (DeepFace), OCR extraction (EasyOCR)
- **Financial OCR** — Stateless text extraction from salary slips, bank statements, income certificates
- **Health Checks** — Model readiness & service liveness probes

**ML Models:** EasyOCR (Nepali/English), DeepFace Facenet, PaddleOCR
**Auth:** JWT-based (via Express backend proxy)
""",
        version="1.0.0",
        contact={
            "name": "FinGuard Team",
            "url": "https://github.com/anomalyco/finguard",
        },
        license_info={
            "name": "MIT",
        },
        openapi_tags=[
            {
                "name": "kyc",
                "description": "KYC verification workflow — upload, OCR, face matching, status",
            },
            {
                "name": "financial-ocr",
                "description": "Stateless document OCR for financial proofs (salary, bank, etc.)",
            },
            {
                "name": "health",
                "description": "Service health and ML model readiness checks",
            },
        ],
        lifespan=lifespan
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router)

    @app.get("/health", tags=["health"])
    async def health_check():
        """Liveness probe — returns OK if the service is running."""
        return {
            "status": "ok",
            "service": "kyc-service",
            "models_ready": _models_ready
        }

    @app.get("/ready", tags=["health"])
    async def readiness_check():
        """Readiness probe — returns 200 only when all ML models are loaded."""
        if all(_models_ready.values()):
            return {"ready": True, "models": _models_ready}
        raise HTTPException(status_code=503, detail={"ready": False, "models": _models_ready})

    return app


app = create_app()
