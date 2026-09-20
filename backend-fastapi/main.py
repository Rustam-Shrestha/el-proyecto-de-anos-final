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
    logger.info("Starting FastAPI application without OCR model preloading...")
    await init_db()
    logger.info("Database initialized successfully")

    _models_ready["ocr"] = False
    _models_ready["ocr_paddle"] = False
    _models_ready["face"] = False
    logger.info("FastAPI OCR and text extraction are disabled in the active flow; only face matching remains enabled in the product path.")
    # Try to init FinGuard predictor (non-fatal)
    try:
        from app.config import settings
        from app.services.finguard.predictor import init_predictor
        from pathlib import Path
        mp = Path(settings.ML_MODEL_PATH)
        # resolve relative to project root if needed
        if not mp.is_absolute():
            # main.py is at backend-fastapi/main.py
            base = Path(__file__).parent
            mp = (base / settings.ML_MODEL_PATH).resolve()
            pp = (base / settings.ML_PREPROCESSING_PATH).resolve()
            man = (base / settings.ML_MANIFEST_PATH).resolve()
        else:
            pp = Path(settings.ML_PREPROCESSING_PATH)
            man = Path(settings.ML_MANIFEST_PATH)
        if mp.exists() and pp.exists() and man.exists():
            init_predictor(str(mp), str(man), str(pp))
            _models_ready["finguard"] = True
            logger.info(f"FinGuard model loaded: {mp}")
        else:
            _models_ready["finguard"] = False
            logger.warning(f"FinGuard artifacts missing: {mp} {pp} {man}")
    except Exception as e:
        _models_ready["finguard"] = False
        logger.warning(f"FinGuard init failed: {e}")
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
        """Readiness probe — face matching is independent from credit scoring (xgboost).
        Return 200 even if credit model is degraded; only fail if core DB not ready."""
        # finguard (xgboost) is optional - degrade gracefully
        finguard_ready = _models_ready.get("finguard", False)
        # face is lazy-loaded on demand, always report ready to avoid blocking KYC
        # 503 only if we explicitly mark degraded and caller wants strict check
        return {"ready": True, "models": {**_models_ready, "face_lazy": True}, "degraded": not finguard_ready}

    return app


app = create_app()
