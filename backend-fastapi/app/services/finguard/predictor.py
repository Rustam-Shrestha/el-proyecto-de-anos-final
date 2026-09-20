import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional
import numpy as np

from .preprocessing import PreprocessingPipeline

logger = logging.getLogger(__name__)


class CreditDefaultPredictor:
    def __init__(self, model_path: str, manifest_path: str, preprocessing: PreprocessingPipeline):
        self.model_path = model_path
        self.manifest_path = manifest_path
        self.preprocessing = preprocessing
        self.threshold = 0.5
        self.model = None
        self.manifest: Dict[str, Any] = {}
        self.explainer = None

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

        # SHAP explainer (optional, degrade gracefully)
        try:
            import shap
            # get booster for TreeExplainer
            booster = self.model.get_booster() if hasattr(self.model, "get_booster") else self.model
            self.explainer = shap.TreeExplainer(booster)
            logger.info("SHAP explainer initialized")
        except Exception as e:
            logger.warning(f"SHAP explainer init failed, running without SHAP: {e}")
            self.explainer = None

    def predict(self, data_dict: Dict[str, Any]) -> Dict[str, Any]:
        X = self.preprocessing.transform(data_dict)

        # Predict probability
        prob = float(self.model.predict_proba(X)[:, 1][0])

        # SHAP top5
        shap_summary: Dict[str, float] = {}
        if self.explainer is not None:
            try:
                vals = self.explainer.shap_values(X)
                if isinstance(vals, list):
                    vals = vals[1] if len(vals) > 1 else vals[0]
                # vals shape (1, n_features)
                arr = np.array(vals[0])
                top_idx = np.argsort(np.abs(arr))[-5:][::-1]
                order = self.manifest.get("features", {}).get("order", self.preprocessing.feature_order)
                for idx in top_idx:
                    col = order[int(idx)] if int(idx) < len(order) else f"f{idx}"
                    shap_summary[col] = float(abs(float(arr[int(idx)])))
            except Exception as e:
                logger.warning(f"SHAP compute failed: {e}")

        # Decision
        credit_score = max(300, min(850, int(300 + 550 * (1 - prob))))
        risk_band = "Low" if prob < 0.2 else ("Medium" if prob <= 0.5 else "High")
        decision = "Approve" if prob < self.threshold else "Decline"

        return {
            "model_version": self.manifest.get("modelVersion", "1.0.0"),
            "default_probability": round(prob, 4),
            "credit_score": credit_score,
            "risk_band": risk_band,
            "decision": decision,
            "threshold": round(float(self.threshold), 4),
            "shap_summary": shap_summary,
            "features_used": self.manifest.get("features", {}).get("order", self.preprocessing.feature_order),
        }


_predictor: Optional[CreditDefaultPredictor] = None


def get_predictor() -> Optional[CreditDefaultPredictor]:
    return _predictor


def init_predictor(model_path: str, manifest_path: str, preprocessing_path: str) -> CreditDefaultPredictor:
    global _predictor
    pre = PreprocessingPipeline(preprocessing_path)
    _predictor = CreditDefaultPredictor(model_path, manifest_path, pre)
    return _predictor
