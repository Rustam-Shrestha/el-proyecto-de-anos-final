import os
os.environ['PYTHONIOENCODING'] = 'utf-8'
os.environ['TF_USE_LEGACY_KERAS'] = '1'

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
_models_ready = {"ocr": False, "face": False}


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting FastAPI application...")
    await init_db()
    logger.info("Database initialized successfully")

    logger.info("Loading AI models before accepting requests...")
    try:
        import easyocr
        logger.info("Loading EasyOCR (hi+en)...")
        _ = easyocr.Reader(["hi", "en"], gpu=False, verbose=False)
        _models_ready["ocr"] = True
        logger.info("EasyOCR ready")
    except Exception as e:
        logger.warning("EasyOCR pre-load failed: %s", e)

    try:
        from deepface import DeepFace
        logger.info("Loading DeepFace Facenet model...")
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
        title="KYC Service",
        description="Professional KYC & Identity Verification Pipeline",
        version="1.0.0",
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

    @app.get("/health")
    async def health_check():
        return {
            "status": "ok",
            "service": "kyc-service",
            "models_ready": _models_ready
        }

    @app.get("/ready")
    async def readiness_check():
        if all(_models_ready.values()):
            return {"ready": True, "models": _models_ready}
        raise HTTPException(status_code=503, detail={"ready": False, "models": _models_ready})

    return app


app = create_app()
