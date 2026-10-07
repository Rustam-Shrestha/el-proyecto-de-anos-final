"""
FinGuard ML Risk Pipeline (v1.4.0) Regression & Integration Test Suite

Tests:
1. Exact Student Repro Case (Hard Rule Rejection).
2. Prime Borrower Profile (Low Risk / APPROVE).
3. Borderline DTI / Moderate Profile (Medium Risk / MANUAL_REVIEW).
4. Output Contract schema and reason codes integrity.
"""

import os
import sys
import unittest
from pathlib import Path

# Add backend-fastapi directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.services.finguard.rules import (
    evaluate_business_rules,
    REASON_LOAN_EXCEEDS_INCOME_MULTIPLE,
    REASON_STUDENT_NO_INCOME,
    REASON_DTI_EXCEEDS_50_PERCENT,
    REASON_SUBSISTENCE_INCOME_INSUFFICIENT,
)
from app.services.finguard.predictor import (
    CreditDefaultPredictor,
    init_predictor,
    get_predictor,
    PIPELINE_VERSION,
)
from app.services.finguard.preprocessing import PreprocessingPipeline


class TestFinGuardPipelineV140(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Locate artifacts directory
        candidate_dirs = [
            BASE_DIR.parent / "finguard_model_v1.3.0" / "finguard_artifacts",
            BASE_DIR.parent / "finguard_artifacts",
            BASE_DIR / "finguard_artifacts",
        ]
        chosen_dir = None
        for cd in candidate_dirs:
            if (cd / "model.pkl").exists() and (cd / "model_manifest.json").exists() and (cd / "preprocessing.json").exists():
                chosen_dir = cd
                break

        if not chosen_dir:
            raise FileNotFoundError(f"FinGuard model artifacts not found in candidate paths: {candidate_dirs}")

        mp = str(chosen_dir / "model.pkl")
        man = str(chosen_dir / "model_manifest.json")
        pp = str(chosen_dir / "preprocessing.json")
        sch = str(chosen_dir / "feature-schema.json") if (chosen_dir / "feature-schema.json").exists() else None

        cls.predictor = init_predictor(mp, man, pp, schema_path=sch)

    def test_repro_student_hard_rules(self):
        """
        REPRO CASE:
        - Status: STUDENT
        - Employer: N/A, Job Title: N/A, Business: N/A
        - Institution: TU, Education: Bachelor
        - Monthly Income: NPR 10,000 | Annual: NPR 120,000
        - Dependents: 5
        - Income Stability: 50/100
        - Loan Requested: NPR 200,000
        """
        payload = {
            "applicant_id": "repro-student-001",
            "status": "STUDENT",
            "employer": "N/A",
            "occupation_type": "N/A",
            "institution": "TU",
            "education": "Bachelor",
            "monthly_income": 10000.0,
            "annual_income": 120000.0,
            "amt_income_total": 120000.0,
            "amt_credit": 200000.0,
            "loan_amount": 200000.0,
            "dependents": 5,
            "cnt_children": 5,
            "cnt_fam_members": 6,
            "income_stability": 50,
            "days_birth": -7300,  # ~20 years old
            "days_employed": 365243,
        }

        # 1. Test standalone rules engine
        hard_rule_triggered, reason_codes = evaluate_business_rules(payload)
        self.assertTrue(hard_rule_triggered, "Hard rules must trigger for student with excessive loan")
        self.assertIn(REASON_LOAN_EXCEEDS_INCOME_MULTIPLE, reason_codes)
        self.assertIn(REASON_STUDENT_NO_INCOME, reason_codes)
        self.assertIn(REASON_DTI_EXCEEDS_50_PERCENT, reason_codes)
        self.assertIn(REASON_SUBSISTENCE_INCOME_INSUFFICIENT, reason_codes)

        # 2. Test full end-to-end predictor pipeline
        result = self.predictor.predict(payload)

        # Assert Output Contract & Decision Layer single source of truth
        self.assertEqual(result["applicant_id"], "repro-student-001")
        self.assertTrue(result["hard_rule_triggered"])
        self.assertEqual(result["decision_tier"], "HIGH")
        self.assertEqual(result["recommendation"], "REJECT")
        self.assertEqual(result["prediction"], "REJECT")
        self.assertEqual(result["decision"], "Decline")
        self.assertEqual(result["risk_band"], "High")
        self.assertEqual(result["pipeline_version"], "1.4.0")
        self.assertIn("LOAN_EXCEEDS_INCOME_MULTIPLE", result["reason_codes"])
        self.assertIn("STUDENT_NO_INCOME", result["reason_codes"])
        self.assertLessEqual(result["risk_score"], 450)

    def test_prime_borrower_approval(self):
        """
        Prime borrower:
        - Employed with reputable income, zero dependents, modest loan
        - Expected: APPROVE / LOW tier
        """
        payload = {
            "applicant_id": "prime-001",
            "status": "EMPLOYED",
            "employer": "Kathmandu Tech Ltd",
            "occupation_type": "High skill tech staff",
            "monthly_income": 150000.0,
            "annual_income": 1800000.0,
            "amt_income_total": 1800000.0,
            "amt_credit": 50000.0,
            "loan_amount": 50000.0,
            "dependents": 0,
            "cnt_children": 0,
            "cnt_fam_members": 1,
            "days_birth": -15000,
            "days_employed": -2500,
            "ext_source_1": 0.80,
            "ext_source_2": 0.85,
            "ext_source_3": 0.80,
        }

        result = self.predictor.predict(payload)

        self.assertFalse(result["hard_rule_triggered"])
        self.assertEqual(result["decision_tier"], "LOW")
        self.assertEqual(result["recommendation"], "APPROVE")
        self.assertEqual(result["prediction"], "APPROVE")
        self.assertEqual(result["decision"], "Approve")
        self.assertEqual(result["risk_band"], "Low")
        self.assertEqual(len(result["reason_codes"]), 0)
        self.assertGreaterEqual(result["risk_score"], 700)

    def test_borderline_manual_review(self):
        """
        Borderline profile:
        - Moderate income, moderate loan, manageable DTI
        - Expected: MANUAL_REVIEW / MEDIUM tier
        """
        payload = {
            "applicant_id": "borderline-001",
            "status": "EMPLOYED",
            "employer": "Local Services Co",
            "occupation_type": "Working",
            "monthly_income": 40000.0,
            "annual_income": 480000.0,
            "amt_income_total": 480000.0,
            "amt_credit": 100000.0,
            "loan_amount": 100000.0,
            "dependents": 1,
            "cnt_children": 1,
            "cnt_fam_members": 2,
            "days_birth": -10000,
            "days_employed": -500,
            "ext_source_2": 0.50,
        }

        result = self.predictor.predict(payload)

        self.assertFalse(result["hard_rule_triggered"])
        self.assertIn(result["decision_tier"], ("LOW", "MEDIUM"))
        self.assertIn(result["recommendation"], ("APPROVE", "MANUAL_REVIEW"))
        self.assertEqual(result["pipeline_version"], "1.4.0")

    def test_output_contract_fields(self):
        """Verify all fields in v1.4.0 output contract are present and typed properly."""
        payload = {
            "amt_income_total": 200000.0,
            "amt_credit": 100000.0,
            "days_birth": -12000,
            "days_employed": -1000,
        }
        result = self.predictor.predict(payload)

        required_contract_keys = [
            "applicant_id",
            "model_probability",
            "decision_tier",
            "recommendation",
            "hard_rule_triggered",
            "reason_codes",
            "model_version",
            "pipeline_version",
            "status",
            "prediction",
            "probability",
            "risk_score",
            "credit_score",
            "risk_band",
            "decision",
            "threshold",
            "shap_summary",
            "features_used",
            "timestamp",
        ]

        for key in required_contract_keys:
            self.assertIn(key, result, f"Required output contract key missing: {key}")

        self.assertEqual(result["pipeline_version"], "1.4.0")
        self.assertIsInstance(result["reason_codes"], list)
        self.assertIsInstance(result["hard_rule_triggered"], bool)


if __name__ == "__main__":
    unittest.main()
