"""API Router Initialization - Aggregates all endpoint modules."""

from fastapi import APIRouter
from app.routes import kyc
from app.routes import financial_ocr

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(kyc.router)
api_router.include_router(financial_ocr.router)
