"""FinGuard credit scoring routes.

Mounted twice by the application:

* ``/api/v1/finguard/*`` (pre-existing) and
* ``/finguard/*`` (spec alias)

Both expose the same adapter envelope, which carries the internal naming set
(``default_probability`` / ``credit_score`` / ``decision``) plus the spec naming
set (``status`` / ``prediction`` / ``probability`` / ``risk_score``).
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from app.services.finguard.predictor import get_predictor
from app.services.finguard.schemas import (
    FinguardBatchRequest,
    FinguardBatchResponse,
    FinguardExplainRequest,
    FinguardExplainResponse,
    FinguardPredictRequest,
    FinguardPredictResponse,
)
from app.services.finguard.validators import SPEC_THRESHOLD, ValidationError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/finguard", tags=["finguard"])


def _require_predictor():
    predictor = get_predictor()
    if not predictor:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return predictor


def _validation_error(exc: Exception) -> HTTPException:
    return HTTPException(status_code=422, detail=str(exc))


@router.get("/health")
async def health():
    p = get_predictor()
    if not p:
        return {"status": "not_ready", "ready": False}
    return {
        "status": "healthy",
        "ready": True,
        "model": p.manifest.get("modelVersion"),
        "threshold": float(p.threshold),
        "spec_threshold": SPEC_THRESHOLD,
        "total_features": p.total_features,
    }


@router.get("/model-info")
async def model_info():
    p = _require_predictor()
    return p.manifest


@router.get("/schema")
async def schema():
    """Feature schema (feature-schema.json) + manifest threshold + order length."""
    p = _require_predictor()
    return p.feature_schema_payload()


@router.post("/predict", response_model=FinguardPredictResponse)
async def predict(req: FinguardPredictRequest):
    p = _require_predictor()
    try:
        result = p.predict(req.to_validator_dict())
        result.setdefault("timestamp", datetime.now(timezone.utc).isoformat())
        return FinguardPredictResponse(**result)
    except ValidationError as e:
        logger.info(f"FinGuard predict rejected (rule violation): {e}")
        raise _validation_error(e)
    except Exception as e:
        logger.error(f"FinGuard predict error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/batch", response_model=FinguardBatchResponse)
async def batch(req: FinguardBatchRequest):
    p = _require_predictor()
    items: list[Dict[str, Any]] = list(req.items or [])
    if not items:
        raise HTTPException(status_code=422, detail="items must contain at least one request")
    try:
        result = p.predict_batch(items, stop_on_error=bool(req.stop_on_error))
    except ValidationError as e:
        raise _validation_error(e)
    except Exception as e:
        logger.error(f"FinGuard batch error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")

    if result["errors"] and not result["results"]:
        # Every item failed validation -> surface it as a 422 like /predict does.
        raise HTTPException(
            status_code=422, detail={"message": "Batch validation failed", "errors": result["errors"]}
        )

    return FinguardBatchResponse(**result)


@router.post("/explain", response_model=FinguardExplainResponse)
async def explain(req: FinguardExplainRequest):
    p = _require_predictor()
    try:
        result = p.explain(req.to_validator_dict())
        return FinguardExplainResponse(**result)
    except ValidationError as e:
        logger.info(f"FinGuard explain rejected (rule violation): {e}")
        raise _validation_error(e)
    except Exception as e:
        logger.error(f"FinGuard explain error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Explanation failed: {str(e)}")
