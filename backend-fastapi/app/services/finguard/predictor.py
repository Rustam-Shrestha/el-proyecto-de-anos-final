import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np

from .preprocessing import PreprocessingPipeline
from .validators import (
    SPEC_THRESHOLD,
    ValidationError,
    decide,
    to_pipeline_input,
    to_risk_band,
    to_risk_score,
    validate_request,
    validate_response,
)

logger = logging.getLogger(__name__)

#: Number of features the trained model expects (manifest / feature-schema.json).
EXPECTED_TOTAL_FEATURES = 243


class CreditDefaultPredictor:
    def __init__(
        self,
        model_path: str,
        manifest_path: str,
        preprocessing: PreprocessingPipeline,
        schema_path: Optional[str] = None,
    ):
        self.model_path = model_path
        self.manifest_path = manifest_path
        self.preprocessing = preprocessing
        self.threshold = 0.5
        self.model = None
        self.manifest: Dict[str, Any] = {}
        self.explainer = None
        self.feature_schema: Dict[str, Any] = {}
        self.feature_schema_path: Optional[str] = None
        self.total_features: int = len(preprocessing.feature_order)
        self.base_value: Optional[float] = None

        # Load model (xgboost separated from face; allow degraded mode)
        try:
            import joblib
            artifact = joblib.load(model_path)
            if isinstance(artifact, dict) and "model" in artifact:
                self.model = artifact["model"]
                self.threshold = float(artifact.get("threshold", 0.5))
            else:
                self.model = artifact
        except ModuleNotFoundError as e:
            if "xgboost" in str(e):
                logger.error(f"xgboost not installed, credit scoring will be degraded: {e}")
                raise
            logger.error(f"Failed to load model.pkl: {e}")
            raise
        except Exception as e:
            logger.error(f"Failed to load model.pkl: {e}")
            raise

        # Load manifest (authoritative threshold lives there too)
        with open(manifest_path, "r") as f:
            self.manifest = json.load(f)
        # Prefer manifest decision_threshold if present
        if "decision_threshold" in self.manifest:
            try:
                self.threshold = float(self.manifest["decision_threshold"])
            except Exception:
                pass

        # Load the published feature schema (optional, metadata only)
        self._load_feature_schema(schema_path)

        # SHAP explainer (optional, degrade gracefully)
        try:
            import shap
            # get booster for TreeExplainer
            booster = self.model.get_booster() if hasattr(self.model, "get_booster") else self.model
            self.explainer = shap.TreeExplainer(booster)
            self.base_value = _scalar(getattr(self.explainer, "expected_value", None))
            logger.info("SHAP explainer initialized")
        except Exception as e:
            logger.warning(f"SHAP explainer init failed, running without SHAP: {e}")
            self.explainer = None
            self.base_value = None

    # ─── metadata ───────────────────────────────────────────────────────

    def _load_feature_schema(self, schema_path: Optional[str]) -> None:
        """Load ``feature-schema.json`` if present and cross-check the order."""
        candidate: Optional[Path] = None
        if schema_path:
            candidate = Path(schema_path)

        if candidate is None or not candidate.exists():
            # Default location: ../finguard_artifacts/feature-schema.json
            for base in (
                Path(self.manifest_path).parent,
                Path(__file__).resolve().parents[3],
            ):
                guess = Path(base) / "finguard_artifacts" / "feature-schema.json"
                if guess.exists():
                    candidate = guess
                    break
                sibling = Path(base) / "feature-schema.json"
                if sibling.exists():
                    candidate = sibling
                    break

        if candidate is None or not candidate.exists():
            logger.warning("feature-schema.json not found; continuing without it")
            self._expose_feature_schema_info(None, False)
            return

        try:
            with open(candidate, "r") as f:
                schema = json.load(f)
        except Exception as e:
            logger.warning(f"Failed to read feature schema {candidate}: {e}")
            self._expose_feature_schema_info(None, False)
            return

        self.feature_schema = schema
        self.feature_schema_path = str(candidate)
        self._expose_feature_schema_info(schema, True)

    def _expose_feature_schema_info(
        self, schema: Optional[Dict[str, Any]], loaded: bool
    ) -> None:
        """Expose schema metadata (and the total_features check) in the manifest."""
        order = list(self.manifest.get("features", {}).get("order") or self.preprocessing.feature_order)
        self.total_features = len(order)
        self.manifest["features"] = {**self.manifest.get("features", {}), "order": order}

        declared = None
        version = None
        if schema:
            declared = schema.get("total_features")
            version = schema.get("version")

        matches = declared is not None and int(declared) == self.total_features
        if loaded and declared is not None and not matches:
            logger.warning(
                "feature-schema total_features=%s does not match pipeline order length=%s",
                declared,
                self.total_features,
            )

        self.manifest["feature_schema"] = {
            "loaded": loaded,
            "path": self.feature_schema_path,
            "version": version,
            "total_features": declared,
            "order_length": self.total_features,
            "expected_total_features": EXPECTED_TOTAL_FEATURES,
            "matches_pipeline_order": matches,
            "matches_expected": self.total_features == EXPECTED_TOTAL_FEATURES,
        }

    @property
    def spec_threshold(self) -> float:
        """Threshold quoted by the API specification (0.23)."""
        return SPEC_THRESHOLD

    def feature_schema_payload(self) -> Dict[str, Any]:
        """Payload for ``GET /finguard/schema``."""
        order = list(self.manifest.get("features", {}).get("order") or [])
        return {
            "status": "success",
            "model_version": self.manifest.get("modelVersion", "1.0.0"),
            "total_features": self.feature_schema.get("total_features", self.total_features),
            "order_length": len(order) or self.total_features,
            "threshold": float(self.threshold),
            "spec_threshold": SPEC_THRESHOLD,
            "decision_threshold": float(self.threshold),
            "expected_total_features": EXPECTED_TOTAL_FEATURES,
            "categorical_mappings": self.feature_schema.get("categorical_mappings", {}),
            "feature_schema": self.feature_schema or {
                "version": None,
                "total_features": self.total_features,
                "features": order,
                "categorical_mappings": {},
            },
            "order": order,
        }

    # ─── inference ──────────────────────────────────────────────────────

    def _features_used(self) -> List[str]:
        return list(
            self.manifest.get("features", {}).get("order") or self.preprocessing.feature_order
        )

    def _shap_values(self, X: np.ndarray):
        """Return the raw SHAP vector for a single sample, or None."""
        if self.explainer is None:
            return None
        try:
            vals = self.explainer.shap_values(X)
            if isinstance(vals, list):
                vals = vals[1] if len(vals) > 1 else vals[0]
            arr = np.array(vals)
            if arr.ndim == 3:
                arr = arr[:, :, -1] if arr.shape[2] == 2 else arr[:, :, 0]
            if arr.ndim == 2:
                arr = arr[0]
            return arr
        except Exception as e:
            logger.warning(f"SHAP compute failed: {e}")
            return None

    def _build_envelope(self, prob: float, shap_summary: Dict[str, float]) -> Dict[str, Any]:
        """Adapter envelope carrying both internal and spec naming sets."""
        threshold = float(self.threshold)
        risk_score = to_risk_score(prob)
        prediction = decide(prob, threshold)

        envelope: Dict[str, Any] = {
            # --- spec naming set ---
            "status": "success",
            "prediction": prediction,
            "probability": round(prob, 6),
            "risk_score": risk_score,
            "spec_threshold": SPEC_THRESHOLD,
            # --- pre-existing internal naming set ---
            "model_version": self.manifest.get("modelVersion", "1.0.0"),
            "default_probability": round(prob, 4),
            "credit_score": risk_score,
            "risk_band": to_risk_band(prob),
            "decision": "Approve" if prediction == "APPROVE" else "Decline",
            "threshold": round(threshold, 4),
            "shap_summary": shap_summary,
            "features_used": self._features_used(),
        }
        return validate_response(envelope)

    def predict(self, data_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Validate (Rules 1-5, 7), predict, and return the adapter envelope."""
        normalized = validate_request(data_dict)
        X = self.preprocessing.transform(to_pipeline_input(normalized))

        # Predict probability
        prob = float(self.model.predict_proba(X)[:, 1][0])

        # SHAP top5
        shap_summary: Dict[str, float] = {}
        arr = self._shap_values(X)
        if arr is not None and arr.size:
            order = self._features_used()
            top_idx = np.argsort(np.abs(arr))[-5:][::-1]
            for idx in top_idx:
                col = order[int(idx)] if int(idx) < len(order) else f"f{idx}"
                shap_summary[col] = float(abs(float(arr[int(idx)])))

        envelope = self._build_envelope(prob, shap_summary)
        envelope["timestamp"] = datetime.now(timezone.utc).isoformat()
        return envelope

    def predict_batch(self, items: List[Dict[str, Any]], stop_on_error: bool = False) -> Dict[str, Any]:
        """Predict a list of requests; per-item failures are reported inline."""
        results: List[Dict[str, Any]] = []
        errors: List[Dict[str, Any]] = []
        for index, item in enumerate(items or []):
            try:
                results.append(self.predict(item))
            except ValidationError as e:
                errors.append({"index": index, "error": str(e), "status": "error"})
                if stop_on_error:
                    break
            except Exception as e:  # pragma: no cover - model/runtime failure
                logger.error(f"batch predict failed at index {index}: {e}", exc_info=True)
                errors.append({"index": index, "error": str(e), "status": "error"})
                if stop_on_error:
                    break
        return {
            "status": "success",
            "count": len(results),
            "results": results,
            "errors": errors,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def explain(self, data_dict: Dict[str, Any], top_n: int = 5) -> Dict[str, Any]:
        """Return the envelope plus the top-N signed SHAP contributions."""
        normalized = validate_request(data_dict)
        X = self.preprocessing.transform(to_pipeline_input(normalized))
        prob = float(self.model.predict_proba(X)[:, 1][0])

        order = self._features_used()
        contributions: List[Dict[str, Any]] = []
        arr = self._shap_values(X)
        if arr is not None and arr.size:
            top_idx = np.argsort(np.abs(arr))[-max(1, int(top_n)):][::-1]
            for idx in top_idx:
                name = order[int(idx)] if int(idx) < len(order) else f"f{idx}"
                contributions.append(
                    {"feature": name, "shap_value": round(float(arr[int(idx)]), 6)}
                )

        envelope = self._build_envelope(
            prob, {c["feature"]: abs(c["shap_value"]) for c in contributions}
        )
        envelope.update(
            {
                "base_value": self.base_value,
                "shap_values": contributions,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )
        return envelope


def _scalar(value: Any) -> Optional[float]:
    """Best-effort conversion of a SHAP base value to a float."""
    if value is None:
        return None
    try:
        arr = np.array(value, dtype=float).ravel()
        if arr.size == 0:
            return None
        return float(arr[0])
    except Exception:
        return None


_predictor: Optional[CreditDefaultPredictor] = None


def get_predictor() -> Optional[CreditDefaultPredictor]:
    return _predictor


def init_predictor(
    model_path: str,
    manifest_path: str,
    preprocessing_path: str,
    schema_path: Optional[str] = None,
) -> CreditDefaultPredictor:
    global _predictor
    pre = PreprocessingPipeline(preprocessing_path)
    _predictor = CreditDefaultPredictor(model_path, manifest_path, pre, schema_path=schema_path)
    return _predictor
