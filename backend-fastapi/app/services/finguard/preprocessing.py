import json
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any


class PreprocessingPipeline:
    def __init__(self, preprocessing_path: str):
        with open(preprocessing_path, "r") as f:
            self.config = json.load(f)
        self.numeric_and_ohe_cols = self.config["numeric_and_ohe_cols"]
        self.cat_present = self.config.get("cat_present", [])
        self.target_encoding_maps = self.config.get("target_encoding_maps", {})
        self.feature_order = self.config["feature_order"]
        # Fallback defaults for numeric cols (0 or median-like)
        self._defaults: Dict[str, float] = {}

    def _safe_get(self, data: Dict[str, Any], key: str, default: float = 0.0) -> float:
        v = data.get(key, default)
        if v is None:
            return default
        try:
            return float(v)
        except Exception:
            return default

    def transform(self, data_dict: Dict[str, Any]) -> np.ndarray:
        # Build base df from known inputs; missing numeric -> 0
        df = pd.DataFrame([{}])

        # Map request fields to training column names
        # Request uses lower-case keys; training uses upper
        mapped: Dict[str, Any] = {}
        # Direct numeric mappings
        mapped["AMT_INCOME_TOTAL"] = self._safe_get(data_dict, "amt_income_total", 0)
        mapped["AMT_CREDIT"] = self._safe_get(data_dict, "amt_credit", 0)
        mapped["AMT_ANNUITY"] = self._safe_get(data_dict, "amt_annuity", 0)
        mapped["AMT_GOODS_PRICE"] = self._safe_get(data_dict, "amt_goods_price", 0)
        mapped["DAYS_BIRTH"] = self._safe_get(data_dict, "days_birth", -12000)
        mapped["DAYS_EMPLOYED"] = self._safe_get(data_dict, "days_employed", 365243)
        mapped["CNT_CHILDREN"] = self._safe_get(data_dict, "cnt_children", 0)
        mapped["CNT_FAM_MEMBERS"] = self._safe_get(data_dict, "cnt_fam_members", 1)

        # Categorical raw values for target encoding
        for cat in self.cat_present:
            key = cat.lower()  # e.g. OCCUPATION_TYPE -> occupation_type
            mapped[cat] = data_dict.get(key) or data_dict.get(cat) or "XNA"

        # Merge extra_features if provided
        extra = data_dict.get("extra_features") or {}
        for k, v in extra.items():
            mapped[k] = v

        for k, v in mapped.items():
            df[k] = [v]

        # Derived features (must match training)
        eps = 1e-6
        try:
            age_years = abs(float(df["DAYS_BIRTH"].iloc[0])) / 365.25
        except Exception:
            age_years = 30
        df["AGE_YEARS"] = age_years
        try:
            years_employed = abs(float(df["DAYS_EMPLOYED"].iloc[0])) / 365.25 if float(df["DAYS_EMPLOYED"].iloc[0]) < 0 else 0
        except Exception:
            years_employed = 0
        df["YEARS_EMPLOYED"] = years_employed
        df["CREDIT_INCOME_RATIO"] = float(df["AMT_CREDIT"].iloc[0]) / (float(df["AMT_INCOME_TOTAL"].iloc[0]) + eps)
        df["ANNUITY_INCOME_RATIO"] = float(df["AMT_ANNUITY"].iloc[0]) / (float(df["AMT_INCOME_TOTAL"].iloc[0]) + eps)
        df["GOODS_CREDIT_RATIO"] = float(df["AMT_GOODS_PRICE"].iloc[0]) / (float(df["AMT_CREDIT"].iloc[0]) + eps)
        df["EMPLOYED_BIRTH_RATIO"] = float(df["DAYS_EMPLOYED"].iloc[0]) / (float(df["DAYS_BIRTH"].iloc[0]) + eps) if float(df["DAYS_BIRTH"].iloc[0]) != 0 else 0
        fam = float(df["CNT_FAM_MEMBERS"].iloc[0]) if float(df["CNT_FAM_MEMBERS"].iloc[0]) > 0 else 1
        df["INCOME_PER_FAMILY"] = float(df["AMT_INCOME_TOTAL"].iloc[0]) / fam
        df["CHILDREN_RATIO"] = float(df["CNT_CHILDREN"].iloc[0]) / fam
        df["DAYS_EMPLOYED_PERCENT"] = float(df["DAYS_EMPLOYED"].iloc[0]) / (float(df["DAYS_BIRTH"].iloc[0]) + eps) * 100 if float(df["DAYS_BIRTH"].iloc[0]) != 0 else 0
        df["DAYS_EMPLOYED_ANOM"] = 1 if float(df["DAYS_EMPLOYED"].iloc[0]) == 365243 else 0
        # Placeholders for EXT sources
        for col in ["EXT_SOURCE_1", "EXT_SOURCE_2", "EXT_SOURCE_3"]:
            if col not in df.columns:
                df[col] = [0.5]
        ext_vals = [float(df[c].iloc[0]) for c in ["EXT_SOURCE_1", "EXT_SOURCE_2", "EXT_SOURCE_3"] if c in df.columns]
        df["EXT_SOURCE_MEAN"] = float(np.mean(ext_vals)) if ext_vals else 0.5
        df["EXT_SOURCE_STD"] = float(np.std(ext_vals)) if len(ext_vals) > 1 else 0
        df["DOCUMENT_COUNT"] = 0
        df["CONTACT_FLAG_SUM"] = 0
        df["CAR_AGE_RATIO"] = 0
        df["DAYS_EMPLOYED_ISNULL"] = 0
        # isnull flags default 0 (will be overridden by feature_order filling)

        # Target encoding
        for col in self.cat_present:
            cfg = self.target_encoding_maps.get(col, {})
            gmean = cfg.get("global_mean", 0.08)
            mapping = cfg.get("map", {})
            raw = str(df[col].iloc[0]) if col in df.columns else "XNA"
            df[f"{col}_TE"] = mapping.get(raw, gmean)

        # One-hot defaults: any OHE col not in df -> 0
        # Build ordered vector
        vec = []
        for col in self.feature_order:
            if col in df.columns:
                try:
                    vec.append(float(df[col].iloc[0]))
                except Exception:
                    vec.append(0.0)
            else:
                # Check if it's an OHE column that should be 0/1 based on mapped categorical
                vec.append(0.0)
        # Handle explicit OHE activations for categorical inputs that map to OHE
        # e.g., CODE_GENDER_M -> set 1 if code_gender==M
        ohe_map = {
            "CODE_GENDER": "code_gender",
            "NAME_CONTRACT_TYPE": "name_contract_type",
            "NAME_INCOME_TYPE": "name_income_type",
            "NAME_EDUCATION_TYPE": "name_education_type",
            "NAME_FAMILY_STATUS": "name_family_status",
            "NAME_HOUSING_TYPE": "name_housing_type",
            "OCCUPATION_TYPE": "occupation_type",
            "ORGANIZATION_TYPE": "organization_type",
        }
        # Build quick lookup for feature_order index
        idx_map = {c: i for i, c in enumerate(self.feature_order)}
        for prefix, req_key in ohe_map.items():
            val = data_dict.get(req_key)
            if val:
                col_name = f"{prefix}_{val}"
                # Some values have spaces/slashes; match as-is
                if col_name in idx_map:
                    vec[idx_map[col_name]] = 1.0

        return np.array(vec, dtype=np.float32).reshape(1, -1)
