"""API Router Initialization - Aggregates all endpoint modules."""

from fastapi import APIRouter
from app.routes import kyc
from app.routes import financial_ocr
from app.routes import nlu
from app.routes import finguard

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(kyc.router)
api_router.include_router(financial_ocr.router)
api_router.include_router(nlu.router)
api_router.include_router(finguard.router)
