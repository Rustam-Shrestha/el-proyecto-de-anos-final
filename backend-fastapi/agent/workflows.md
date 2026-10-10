# Backend-FastAPI Workflows

> Internal execution chains inside `backend-fastapi`.

---

### 1. Automated KYC Face Match & OCR Workflow
```
POST /api/v1/kyc/verify
  → app/routes/kyc.py::verify_kyc
  → Save upload files to temporary directory
  → app/services/ocr_service.py::extract_text (EasyOCR on front/back)
  → app/services/identity_service.py::verify_faces (DeepFace Facenet on selfie vs document)
  → Clean up temporary files
  → Return { success, ocr: { extracted_fields, confidence }, face_match: { is_match, distance } }
```

### 2. FinGuard ML Risk Scoring Workflow
```
POST /api/v1/finguard/predict
  → app/routes/finguard.py::predict_finguard
  → app/services/finguard/validators.py (validates input dictionary)
  → app/services/finguard/preprocessing.py (imputes nulls, encodes categoricals, scales numericals)
  → app/services/finguard/predictor.py (runs LightGBM pipeline inference)
  → Map probability to risk tier (LOW, MEDIUM, HIGH, VERY_HIGH)
  → Return { default_probability, risk_tier, top_risk_factors }
```
