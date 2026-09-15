from fastapi import APIRouter, HTTPException
from datetime import datetime
import logging
from app.services.finguard.schemas import FinguardPredictRequest, FinguardPredictResponse
from app.services.finguard.predictor import get_predictor

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/finguard", tags=["finguard"])


@router.get("/health")
async def health():
    p = get_predictor()
    if not p:
        return {"status": "not_ready", "ready": False}
    return {"status": "healthy", "ready": True, "model": p.manifest.get("modelVersion")}


@router.get("/model-info")
async def model_info():
    p = get_predictor()
    if not p:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return p.manifest


@router.post("/predict", response_model=FinguardPredictResponse)
async def predict(req: FinguardPredictRequest):
    p = get_predictor()
    if not p:
        raise HTTPException(status_code=503, detail="Model not loaded")
    try:
        result = p.predict(req.model_dump())
        result["timestamp"] = datetime.utcnow().isoformat()
        return FinguardPredictResponse(**result)
    except Exception as e:
        logger.error(f"FinGuard predict error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
