"""
FastAPI Application Entry Point - KYC Module
"""
import os
os.environ['PYTHONIOENCODING'] = 'utf-8'
os.environ['TF_USE_LEGACY_KERAS'] = '1'

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from .app.db import init_db
    from .app.api.v1 import api_router
except Exception:
    # Fallback for execution from repository root or different CWDs
    from app.db import init_db
    from app.api.v1 import api_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager."""
    # Startup
    logger.info("Starting FastAPI application...")
    await init_db()
    logger.info("Database initialized successfully")
    yield
    # Shutdown
    logger.info("Shutting down FastAPI application...")


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title="KYC Service",
        description="Professional KYC & Identity Verification Pipeline",
        version="1.0.0",
        lifespan=lifespan
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API routers
    app.include_router(api_router)

    # Health check endpoint
    @app.get("/health")
    async def health_check():
        return {"status": "ok", "service": "kyc-service"}

    return app


app = create_app()
