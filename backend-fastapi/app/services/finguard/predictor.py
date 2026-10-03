import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

from .preprocessing import PreprocessingPipeline
from .rules import evaluate_business_rules
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
PIPELINE_VERSION = "1.4.0"
DEFAULT_DECISION_THRESHOLD = 0.15


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
        self.threshold = DEFAULT_DECISION_THRESHOLD
        self.model = None
        self.manifest: Dict[str, Any] = {}
        self.explainer = None
        self.feature_schema: Dict[str, Any] = {}
        self.feature_schema_path: Optional[str] = None
        self.total_features: int = len(preprocessing.feature_order)
        self.base_value: Optional[float] = None

        # Load model (xgboost separated from face; allow degraded mode)
        try:
            import warnings
            with warnings.catch_warnings():
                warnings.filterwarnings("ignore", category=UserWarning)
                warnings.filterwarnings("ignore", message=".*serialized model.*")
                import joblib
                artifact = joblib.load(model_path)
                if isinstance(artifact, dict) and "model" in artifact:
                    self.model = artifact["model"]
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

        # Load manifest
        with open(manifest_path, "r") as f:
            self.manifest = json.load(f)

        # In v1.4.0 pipeline, default decision threshold is 0.15 (single source of truth)
        self.threshold = DEFAULT_DECISION_THRESHOLD

        # Load the published feature schema (optional, metadata only)
        self._load_feature_schema(schema_path)

        # SHAP explainer (optional, degrade gracefully)
        try:
            import shap
            import shap.explainers._tree as shap_tree

            if hasattr(shap_tree, "decode_ubjson_buffer"):
                orig_decode = shap_tree.decode_ubjson_buffer

                def safe_decode(fd):
                    jmodel = orig_decode(fd)
                    try:
                        lmp = jmodel.get("learner", {}).get("learner_model_param", {})
                        if "base_score" in lmp:
                            val = lmp["base_score"]
                            if isinstance(val, str):
                                lmp["base_score"] = float(val.strip("[] \t\n\r"))
                            elif isinstance(val, (list, tuple)) and len(val) > 0:
                                lmp["base_score"] = float(val[0])
                    except Exception:
                        pass
                    return jmodel

                shap_tree.decode_ubjson_buffer = safe_decode

            booster = self.model.get_booster() if hasattr(self.model, "get_booster") else self.model
            self.explainer = shap.TreeExplainer(booster)
            self.base_value = _scalar(getattr(self.explainer, "expected_value", None))
            logger.info("SHAP explainer initialized successfully")
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
        """Expose schema metadata in the manifest."""
        order = list(self.manifest.get("features", {}).get("order") or self.preprocessing.feature_order)
        self.total_features = len(order)
        self.manifest["features"] = {**self.manifest.get("features", {}), "order": order}

        declared = None
        version = None
        if schema:
            declared = schema.get("total_features")
            version = schema.get("version")

        matches = declared is not None and int(declared) == self.total_features
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
        return SPEC_THRESHOLD

    def feature_schema_payload(self) -> Dict[str, Any]:
        """Payload for ``GET /finguard/schema``."""
        order = list(self.manifest.get("features", {}).get("order") or [])
        return {
            "status": "success",
            "model_version": self.manifest.get("modelVersion", "1.3.0"),
            "pipeline_version": PIPELINE_VERSION,
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

    def warmup(self) -> None:
        """Warm-start dummy pass."""
        try:
            n = len(self._features_used()) or self.total_features
            if n > 0:
                frame = np.zeros((1, n))
                if self.model is not None:
                    self.model.predict_proba(frame)
                if self.explainer is not None:
                    self._shap_values(frame)
        except Exception as e:
            logger.warning(f"Predictor warmup skipped: {e}")

    def _evaluate_decision(
        self,
        prob: float,
        hard_rule_triggered: bool,
        reason_codes: List[str],
        out_of_distribution: bool = False,
    ) -> Tuple[str, str, str, str, str, int]:
        """
        Decision Layer (Single Source of Truth):
        - p < 0.05 -> LOW / APPROVE
        - 0.05 - 0.15 -> MEDIUM / MANUAL_REVIEW
        - > 0.15 -> HIGH / REJECT
        - Hard business rules override with REJECT / HIGH tier.
        - Out of distribution profiles force MANUAL_REVIEW / MEDIUM tier.

        Returns:
            (decision_tier, recommendation, prediction, decision, risk_band, credit_score)
        """
        threshold = float(self.threshold)

        if hard_rule_triggered:
            decision_tier = "HIGH"
            recommendation = "REJECT"
            prediction = "REJECT"
            decision = "Decline"
            risk_band = "High"
            # High risk score penalty for hard rule violations
            credit_score = min(to_risk_score(max(prob, 0.70)), 450)
            return decision_tier, recommendation, prediction, decision, risk_band, credit_score

        if out_of_distribution:
            decision_tier = "MEDIUM"
            recommendation = "MANUAL_REVIEW"
            prediction = "REJECT" if prob > threshold else "APPROVE"
            decision = "Manual Review"
            risk_band = "Medium"
            credit_score = to_risk_score(prob)
            return decision_tier, recommendation, prediction, decision, risk_band, credit_score

        # Normal scoring bounds
        if prob < 0.05:
            decision_tier = "LOW"
            recommendation = "APPROVE"
            prediction = "APPROVE"
            decision = "Approve"
            risk_band = "Low"
        elif prob <= threshold:
            decision_tier = "MEDIUM"
            recommendation = "MANUAL_REVIEW"
            prediction = "APPROVE"
            decision = "Manual Review"
            risk_band = "Medium"
        else:
            decision_tier = "HIGH"
            recommendation = "REJECT"
            prediction = "REJECT"
            decision = "Decline"
            risk_band = "High"

        credit_score = to_risk_score(prob)
        return decision_tier, recommendation, prediction, decision, risk_band, credit_score

    def predict(self, data_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        1. Pre-model business rules (hard gates).
        2. Feature transformation & derived analytics.
        3. Model scoring (XGBoost).
        4. Unified decision layer (Single Source of Truth).
        5. Output Contract response envelope.
        """
        # 1. Evaluate Pre-Model Business Rules
        hard_rule_triggered, reason_codes = evaluate_business_rules(data_dict)

        # 2. Normalize and Transform Features
        normalized = validate_request(data_dict)
        pipeline_input = to_pipeline_input(normalized)
        X, derived_meta = self.preprocessing.transform(pipeline_input)

        out_of_distribution = bool(derived_meta.get("out_of_distribution", False))
        if out_of_distribution and not hard_rule_triggered:
            reason_codes.append("OUT_OF_DISTRIBUTION_PROFILE")

        # 3. Model Probability
        prob = float(self.model.predict_proba(X)[:, 1][0])

        # 4. Decision Layer
        decision_tier, recommendation, prediction, decision, risk_band, credit_score = self._evaluate_decision(
            prob=prob,
            hard_rule_triggered=hard_rule_triggered,
            reason_codes=reason_codes,
            out_of_distribution=out_of_distribution,
        )

        # 5. SHAP top-5 feature contributions
        shap_summary: Dict[str, float] = {}
        arr = self._shap_values(X)
        if arr is not None and arr.size:
            order = self._features_used()
            top_idx = np.argsort(np.abs(arr))[-5:][::-1]
            for idx in top_idx:
                col = order[int(idx)] if int(idx) < len(order) else f"f{idx}"
                shap_summary[col] = float(abs(float(arr[int(idx)])))

        applicant_id = str(data_dict.get("applicant_id") or data_dict.get("userId") or "anon")

        envelope: Dict[str, Any] = {
            # --- v1.4.0 Output Contract ---
            "applicant_id": applicant_id,
            "model_probability": round(prob, 6),
            "decision_tier": decision_tier,
            "recommendation": recommendation,
            "hard_rule_triggered": hard_rule_triggered,
            "reason_codes": reason_codes,
            "model_version": self.manifest.get("modelVersion", "1.3.0"),
            "pipeline_version": PIPELINE_VERSION,
            "out_of_distribution": out_of_distribution,
            # --- Spec & Legacy adapter fields ---
            "status": "success",
            "prediction": prediction,
            "probability": round(prob, 6),
            "risk_score": credit_score,
            "credit_score": credit_score,
            "risk_band": risk_band,
            "decision": decision,
            "threshold": round(float(self.threshold), 4),
            "spec_threshold": SPEC_THRESHOLD,
            "shap_summary": shap_summary,
            "features_used": self._features_used(),
            "derived_features": derived_meta,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        return validate_response(envelope)

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
            except Exception as e:
                logger.error(f"batch predict failed at index {index}: {e}", exc_info=True)
                errors.append({"index": index, "error": str(e), "status": "error"})
                if stop_on_error:
                    break
        return {
            "status": "success",
            "count": len(results),
            "results": results,
            "errors": errors,
            "pipeline_version": PIPELINE_VERSION,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def explain(self, data_dict: Dict[str, Any], top_n: int = 5) -> Dict[str, Any]:
        """Return the envelope plus the top-N signed SHAP contributions."""
        hard_rule_triggered, reason_codes = evaluate_business_rules(data_dict)
        normalized = validate_request(data_dict)
        pipeline_input = to_pipeline_input(normalized)
        X, derived_meta = self.preprocessing.transform(pipeline_input)

        out_of_distribution = bool(derived_meta.get("out_of_distribution", False))
        if out_of_distribution and not hard_rule_triggered:
            reason_codes.append("OUT_OF_DISTRIBUTION_PROFILE")

        prob = float(self.model.predict_proba(X)[:, 1][0])
        decision_tier, recommendation, prediction, decision, risk_band, credit_score = self._evaluate_decision(
            prob=prob,
            hard_rule_triggered=hard_rule_triggered,
            reason_codes=reason_codes,
            out_of_distribution=out_of_distribution,
        )

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

        applicant_id = str(data_dict.get("applicant_id") or data_dict.get("userId") or "anon")

        envelope: Dict[str, Any] = {
            "applicant_id": applicant_id,
            "model_probability": round(prob, 6),
            "decision_tier": decision_tier,
            "recommendation": recommendation,
            "hard_rule_triggered": hard_rule_triggered,
            "reason_codes": reason_codes,
            "model_version": self.manifest.get("modelVersion", "1.3.0"),
            "pipeline_version": PIPELINE_VERSION,
            "out_of_distribution": out_of_distribution,
            "status": "success",
            "prediction": prediction,
            "probability": round(prob, 6),
            "risk_score": credit_score,
            "credit_score": credit_score,
            "risk_band": risk_band,
            "decision": decision,
            "threshold": round(float(self.threshold), 4),
            "spec_threshold": SPEC_THRESHOLD,
            "base_value": self.base_value,
            "shap_values": contributions,
            "shap_summary": {c["feature"]: abs(c["shap_value"]) for c in contributions},
            "features_used": self._features_used(),
            "derived_features": derived_meta,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        return validate_response(envelope)


def _scalar(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        if isinstance(value, str):
            clean = value.strip("[] \t\n\r")
            return float(clean)
        arr = np.array(value).ravel()
        if arr.size == 0:
            return None
        first = arr[0]
        if isinstance(first, str):
            first = first.strip("[] \t\n\r")
        return float(first)
    except Exception:
        try:
            return float(str(value).strip("[] \t\n\r"))
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
