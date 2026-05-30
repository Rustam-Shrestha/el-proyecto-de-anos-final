"""API Router Initialization - Aggregates all endpoint modules."""

from fastapi import APIRouter
from app.api.v1.endpoints import kyc

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(kyc.router)
