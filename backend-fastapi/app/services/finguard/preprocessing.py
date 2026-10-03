import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class PreprocessingPipeline:
    def __init__(self, preprocessing_path: str):
        with open(preprocessing_path, "r") as f:
            self.config = json.load(f)
        self.numeric_and_ohe_cols = self.config.get("numeric_and_ohe_cols", [])
        self.cat_present = self.config.get("cat_present", self.config.get("high_card_cols", []))
        self.target_encoding_maps = self.config.get("target_encoding_maps", {})
        self.feature_order = self.config.get("feature_order") or self.config.get("final_feature_cols") or []
        self.impute_stats = self.config.get("impute_stats", {})
        self.numeric_medians: Dict[str, float] = self.impute_stats.get("numeric_median", {})

    def _safe_get(self, data: Dict[str, Any], key: str, default: float = 0.0) -> float:
        # Try both lowercase and uppercase keys
        v = data.get(key)
        if v is None:
            v = data.get(key.upper())
        if v is None:
            v = data.get(key.lower())
        if v is None:
            return default
        try:
            return float(v)
        except Exception:
            return default

    def transform(self, data_dict: Dict[str, Any]) -> np.ndarray:
        """
        Transform raw application and borrower inputs into the exact 243-feature
        vector expected by the trained XGBoost model.
        """
        # 1. Start with the dataset numeric medians so unprovided historical features
        # (e.g. bureau averages, registration age, document flags) reflect a standard baseline
        # rather than extreme zero-outlier anomalies.
        mapped: Dict[str, Any] = dict(self.numeric_medians)

        # 2. Extract core numerical parameters
        income = self._safe_get(data_dict, "amt_income_total", self.numeric_medians.get("AMT_INCOME_TOTAL", 150000.0))
        if income <= 0:
            income = self.numeric_medians.get("AMT_INCOME_TOTAL", 150000.0)

        credit = self._safe_get(data_dict, "amt_credit", self.numeric_medians.get("AMT_CREDIT", 500000.0))
        if credit <= 0:
            credit = self.numeric_medians.get("AMT_CREDIT", 500000.0)

        # Default annuity to realistic tenure EMI if 0
        annuity = self._safe_get(data_dict, "amt_annuity", 0.0)
        if annuity <= 0:
            tenure = self._safe_get(data_dict, "tenure_months", 24.0)
            if tenure <= 0:
                tenure = 24.0
            annuity = credit / tenure

        # Default goods price to credit for standard cash/personal/business loans
        goods = self._safe_get(data_dict, "amt_goods_price", 0.0)
        if goods <= 0:
            goods = credit

        # Handle days birth (Home Credit standard: negative days)
        days_birth = self._safe_get(data_dict, "days_birth", self.numeric_medians.get("DAYS_BIRTH", -15000.0))
        if days_birth > 0:
            days_birth = -abs(days_birth)
        if days_birth > -5000:
            days_birth = -12000.0

        # Handle days employed (Home Credit standard: negative days or 365243 for unemployed)
        days_employed = self._safe_get(data_dict, "days_employed", self.numeric_medians.get("DAYS_EMPLOYED", -1648.0))
        if days_employed > 0 and days_employed != 365243:
            days_employed = -abs(days_employed)

        cnt_children = self._safe_get(data_dict, "cnt_children", 0.0)
        cnt_fam_members = self._safe_get(data_dict, "cnt_fam_members", cnt_children + 1.0)
        if cnt_fam_members < 1.0:
            cnt_fam_members = 1.0

        mapped["AMT_INCOME_TOTAL"] = income
        mapped["AMT_CREDIT"] = credit
        mapped["AMT_ANNUITY"] = annuity
        mapped["AMT_GOODS_PRICE"] = goods
        mapped["DAYS_BIRTH"] = days_birth
        mapped["DAYS_EMPLOYED"] = days_employed
        mapped["CNT_CHILDREN"] = cnt_children
        mapped["CNT_FAM_MEMBERS"] = cnt_fam_members

        # 3. External source scores (EXT_SOURCE_1, 2, 3)
        # Check explicit inputs first
        ext1 = data_dict.get("ext_source_1") or data_dict.get("EXT_SOURCE_1")
        ext2 = data_dict.get("ext_source_2") or data_dict.get("EXT_SOURCE_2")
        ext3 = data_dict.get("ext_source_3") or data_dict.get("EXT_SOURCE_3")

        # Dynamic inference if not provided: estimate external quality from financial stability & DTI
        eps = 1e-6
        dti = (annuity * 12.0) / (income + eps)
        tenure_years = abs(days_employed) / 365.25 if days_employed < 0 else 0.0

        if ext2 is not None:
            v2 = float(ext2)
            mapped["EXT_SOURCE_2"] = v2 / 100.0 if v2 > 1.0 else v2
        else:
            # Calibrated baseline around 0.56, adjusted by tenure and debt burden
            quality_factor = min(0.35, max(-0.35, (tenure_years - 2.0) * 0.04 - (dti - 0.20) * 0.5))
            mapped["EXT_SOURCE_2"] = min(0.95, max(0.05, float(self.numeric_medians.get("EXT_SOURCE_2", 0.5659)) + quality_factor))

        if ext3 is not None:
            v3 = float(ext3)
            mapped["EXT_SOURCE_3"] = v3 / 100.0 if v3 > 1.0 else v3
        else:
            quality_factor = min(0.35, max(-0.35, (tenure_years - 2.0) * 0.04 - (dti - 0.20) * 0.5))
            mapped["EXT_SOURCE_3"] = min(0.95, max(0.05, float(self.numeric_medians.get("EXT_SOURCE_3", 0.5352)) + quality_factor))

        if ext1 is not None:
            v1 = float(ext1)
            mapped["EXT_SOURCE_1"] = v1 / 100.0 if v1 > 1.0 else v1
        else:
            mapped["EXT_SOURCE_1"] = min(0.95, max(0.05, float(self.numeric_medians.get("EXT_SOURCE_1", 0.5060))))

        # 4. Derived ratios & aggregations (matching training feature engineering)
        age_years = abs(days_birth) / 365.25
        years_employed = abs(days_employed) / 365.25 if days_employed < 0 else 0.0

        mapped["AGE_YEARS"] = age_years
        mapped["YEARS_EMPLOYED"] = years_employed
        mapped["CREDIT_INCOME_RATIO"] = credit / (income + eps)
        mapped["ANNUITY_INCOME_RATIO"] = annuity / (income + eps)
        mapped["GOODS_CREDIT_RATIO"] = goods / (credit + eps)
        mapped["EMPLOYED_BIRTH_RATIO"] = days_employed / (days_birth + eps) if days_birth != 0 else 0.0
        mapped["INCOME_PER_FAMILY"] = income / cnt_fam_members
        mapped["CHILDREN_RATIO"] = cnt_children / cnt_fam_members
        mapped["DAYS_EMPLOYED_PERCENT"] = (days_employed / (days_birth + eps)) * 100.0 if days_birth != 0 else 0.0
        mapped["DAYS_EMPLOYED_ANOM"] = 1.0 if days_employed == 365243 else 0.0

        ext_vals = [float(mapped["EXT_SOURCE_1"]), float(mapped["EXT_SOURCE_2"]), float(mapped["EXT_SOURCE_3"])]
        mapped["EXT_SOURCE_MEAN"] = float(np.mean(ext_vals))
        mapped["EXT_SOURCE_STD"] = float(np.std(ext_vals))

        # Standard contact & document completeness for active applicants
        mapped["DOCUMENT_COUNT"] = 1.0
        mapped["FLAG_DOCUMENT_3"] = 1.0
        mapped["FLAG_EMP_PHONE"] = 1.0 if days_employed != 365243 else 0.0
        mapped["FLAG_WORK_PHONE"] = 1.0 if days_employed != 365243 else 0.0
        mapped["FLAG_CONT_MOBILE"] = 1.0
        mapped["CONTACT_FLAG_SUM"] = 2.0

        # Merge extra_features if provided
        extra = data_dict.get("extra_features") or {}
        for k, v in extra.items():
            if k in mapped:
                try:
                    mapped[k] = float(v)
                except Exception:
                    mapped[k] = v

        # 5. Target encodings for high-cardinality columns
        for cat in self.cat_present:
            cfg = self.target_encoding_maps.get(cat, {})
            gmean = cfg.get("global_mean", 0.0807)
            mapping = cfg.get("map", {})
            raw_val = data_dict.get(cat.lower()) or data_dict.get(cat) or "XNA"
            mapped[f"{cat}_TE"] = mapping.get(str(raw_val), gmean)

        # 6. One-Hot Encoding activations
        idx_map = {c: i for i, c in enumerate(self.feature_order)}
        vec = []
        for col in self.feature_order:
            if col in mapped:
                try:
                    vec.append(float(mapped[col]))
                except Exception:
                    vec.append(0.0)
            else:
                vec.append(0.0)

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
        for prefix, req_key in ohe_map.items():
            val = data_dict.get(req_key) or data_dict.get(prefix)
            if val:
                col_name = f"{prefix}_{val}"
                if col_name in idx_map:
                    vec[idx_map[col_name]] = 1.0

        return np.array(vec, dtype=np.float32).reshape(1, -1)
