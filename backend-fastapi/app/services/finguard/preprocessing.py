import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import numpy as np

logger = logging.getLogger(__name__)

DEFAULT_SUBSISTENCE_COST = 4000.0  # NPR per dependent minimum monthly subsistence threshold


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
        # Try lowercase, uppercase, and camelCase
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

    def extract_derived_features(self, data_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract derived features including status flags, ratios, disposable income,
        and out-of-distribution (OOD) indicators.
        """
        eps = 1e-6

        # 1. Income and Loan Amounts (Standardized to NPR)
        annual_income = self._safe_get(data_dict, "amt_income_total", 0.0)
        monthly_income = self._safe_get(data_dict, "monthly_income", 0.0)
        if annual_income <= 0 and monthly_income > 0:
            annual_income = monthly_income * 12.0
        elif monthly_income <= 0 and annual_income > 0:
            monthly_income = annual_income / 12.0
        elif annual_income <= 0 and monthly_income <= 0:
            annual_income = self.numeric_medians.get("AMT_INCOME_TOTAL", 150000.0)
            monthly_income = annual_income / 12.0

        loan_amount = self._safe_get(data_dict, "amt_credit", 0.0)
        if loan_amount <= 0:
            loan_amount = self.numeric_medians.get("AMT_CREDIT", 500000.0)

        # 2. Status and Employment Flags
        status_raw = str(
            data_dict.get("status")
            or data_dict.get("employment_status")
            or data_dict.get("employmentStatus")
            or data_dict.get("name_income_type")
            or data_dict.get("NAME_INCOME_TYPE")
            or data_dict.get("occupation_type")
            or data_dict.get("OCCUPATION_TYPE")
            or ""
        ).strip().upper()

        is_student = 1.0 if "STUDENT" in status_raw else 0.0
        days_employed = self._safe_get(data_dict, "days_employed", -1648.0)
        is_unemployed = 1.0 if ("UNEMPLOYED" in status_raw or days_employed == 365243 or days_employed == 365243.0) else 0.0

        employer_val = (
            data_dict.get("employer")
            or data_dict.get("employer_name")
            or data_dict.get("employerName")
            or data_dict.get("organization_type")
            or data_dict.get("ORGANIZATION_TYPE")
            or data_dict.get("business_name")
            or data_dict.get("businessName")
        )
        has_employer = 1.0 if (
            employer_val is not None
            and str(employer_val).strip().upper() not in ("", "NONE", "NULL", "N/A", "NA", "UNDEFINED", "XNA")
            and is_student == 0.0
            and is_unemployed == 0.0
        ) else 0.0

        # One-hot encoded status categories
        status_category = "OTHER"
        if is_student == 1.0:
            status_category = "STUDENT"
        elif "SELF" in status_raw or "BUSINESS" in status_raw or "ENTREPRENEUR" in status_raw:
            status_category = "SELF_EMPLOYED"
        elif is_unemployed == 1.0:
            status_category = "UNEMPLOYED"
        elif has_employer == 1.0 or "EMPLOYED" in status_raw or "WORKING" in status_raw:
            status_category = "EMPLOYED"

        status_one_hot = {
            "status_is_student": 1.0 if status_category == "STUDENT" else 0.0,
            "status_is_employed": 1.0 if status_category == "EMPLOYED" else 0.0,
            "status_is_self_employed": 1.0 if status_category == "SELF_EMPLOYED" else 0.0,
            "status_is_unemployed": 1.0 if status_category == "UNEMPLOYED" else 0.0,
            "status_is_other": 1.0 if status_category == "OTHER" else 0.0,
        }

        # 3. Dependents & Subsistence
        dependents = self._safe_get(
            data_dict, "dependents", self._safe_get(data_dict, "cnt_children", 0.0)
        )
        fam_members = self._safe_get(
            data_dict, "cnt_fam_members", dependents + 1.0
        )
        if fam_members < 1.0:
            fam_members = 1.0

        subsistence_cost = DEFAULT_SUBSISTENCE_COST
        disposable_income = monthly_income - (dependents * subsistence_cost)
        income_per_dependent = monthly_income / (dependents + 1.0)
        loan_to_income_ratio = loan_amount / max(annual_income, 1.0)
        loan_to_monthly_income_ratio = loan_amount / max(monthly_income, 1.0)

        # 4. Out of Distribution (OOD) Profile Detection
        # Check if applicant is in an extreme low-representation space (e.g. extreme leverage or student high debt)
        out_of_distribution = False
        if is_student == 1.0 and (loan_amount > 100000.0 or dependents >= 3):
            out_of_distribution = True
        elif loan_to_income_ratio > 10.0:
            out_of_distribution = True
        elif monthly_income < 3000.0:
            out_of_distribution = True

        return {
            "annual_income": annual_income,
            "monthly_income": monthly_income,
            "loan_amount": loan_amount,
            "is_student": is_student,
            "is_unemployed": is_unemployed,
            "has_employer": has_employer,
            "status_category": status_category,
            "status_one_hot": status_one_hot,
            "loan_to_income_ratio": loan_to_income_ratio,
            "loan_to_monthly_income_ratio": loan_to_monthly_income_ratio,
            "disposable_income": disposable_income,
            "income_per_dependent": income_per_dependent,
            "out_of_distribution": out_of_distribution,
        }

    def check_null_rates_and_log(self, data_dict: Dict[str, Any]) -> None:
        """Log warnings if any feature set experiences high missingness at inference."""
        core_keys = [
            "amt_income_total", "amt_credit", "days_birth", "days_employed",
            "cnt_children", "cnt_fam_members", "ext_source_1", "ext_source_2", "ext_source_3"
        ]
        missing_count = sum(1 for k in core_keys if data_dict.get(k) is None and data_dict.get(k.upper()) is None)
        missing_rate = missing_count / len(core_keys)
        if missing_rate > 0.20:
            logger.warning(
                f"[FinGuard Inference Audit] Feature missingness rate is {missing_rate:.1%} (>20% threshold). "
                f"Missing keys: {[k for k in core_keys if data_dict.get(k) is None and data_dict.get(k.upper()) is None]}"
            )

    def transform(self, data_dict: Dict[str, Any]) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Transform raw application and borrower inputs into the exact 243-feature
        vector expected by the trained XGBoost model, returning the vector and
        extracted pipeline metadata.
        """
        self.check_null_rates_and_log(data_dict)
        derived = self.extract_derived_features(data_dict)

        # 1. Start with dataset numeric medians
        mapped: Dict[str, Any] = dict(self.numeric_medians)

        income = derived["annual_income"]
        credit = derived["loan_amount"]

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

        # Handle days employed
        days_employed = self._safe_get(data_dict, "days_employed", self.numeric_medians.get("DAYS_EMPLOYED", -1648.0))
        if derived["is_student"] == 1.0 or derived["is_unemployed"] == 1.0:
            days_employed = 365243.0
        elif days_employed > 0 and days_employed != 365243:
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
        ext1 = data_dict.get("ext_source_1") or data_dict.get("EXT_SOURCE_1")
        ext2 = data_dict.get("ext_source_2") or data_dict.get("EXT_SOURCE_2")
        ext3 = data_dict.get("ext_source_3") or data_dict.get("EXT_SOURCE_3")

        eps = 1e-6
        dti = (annuity * 12.0) / (income + eps)
        tenure_years = abs(days_employed) / 365.25 if days_employed < 0 else 0.0

        if ext2 is not None:
            v2 = float(ext2)
            mapped["EXT_SOURCE_2"] = v2 / 100.0 if v2 > 1.0 else v2
        else:
            # Calibrated baseline
            quality_factor = min(0.35, max(-0.35, (tenure_years - 2.0) * 0.04 - (dti - 0.20) * 0.5))
            if derived["is_student"] == 1.0 or derived["is_unemployed"] == 1.0:
                quality_factor -= 0.10
            mapped["EXT_SOURCE_2"] = min(0.95, max(0.05, float(self.numeric_medians.get("EXT_SOURCE_2", 0.5659)) + quality_factor))

        v2_val = float(mapped["EXT_SOURCE_2"])

        if ext3 is not None:
            v3 = float(ext3)
            mapped["EXT_SOURCE_3"] = v3 / 100.0 if v3 > 1.0 else v3
        else:
            mapped["EXT_SOURCE_3"] = min(0.95, max(0.05, v2_val))

        if ext1 is not None:
            v1 = float(ext1)
            mapped["EXT_SOURCE_1"] = v1 / 100.0 if v1 > 1.0 else v1
        else:
            mapped["EXT_SOURCE_1"] = min(0.95, max(0.05, v2_val))

        # 4. Derived ratios & aggregations
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

        # Standard contact & document completeness
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

        # Activate Student / Unemployed categorical OHE if applicable
        if derived["is_student"] == 1.0:
            student_col = "NAME_INCOME_TYPE_Student"
            if student_col in idx_map:
                vec[idx_map[student_col]] = 1.0
        elif derived["is_unemployed"] == 1.0:
            unemp_col = "NAME_INCOME_TYPE_Unemployed"
            if unemp_col in idx_map:
                vec[idx_map[unemp_col]] = 1.0

        return np.array(vec, dtype=np.float32).reshape(1, -1), derived
