# Backend-FastAPI Modules

> Functional boundaries and coordinates in `backend-fastapi`.

---

## 1. KYC & Identity Verification
- **Purpose**: Identity card OCR parsing and DeepFace selfie verification.
- **Key Files**: `app/routes/kyc.py`, `app/services/identity_service.py`, `app/services/ocr_service.py`.
- **Search Hints**: `verify_kyc`, `face_match`, `DeepFace.verify`.

---

## 2. Financial OCR Extraction
- **Purpose**: Stateless text extraction from salary slips, income certificates, and bank statements.
- **Key Files**: `app/routes/financial_ocr.py`, `app/services/financial_ocr_service.py`, `app/services/financial_extraction_service.py`.
- **Search Hints**: `extract_financial_text`, `FinancialOcrService`.

---

## 3. FinGuard ML Predictor
- **Purpose**: HomeCredit loan default probability scoring and risk level tiering via LightGBM / Scikit-learn.
- **Key Files**: `app/routes/finguard.py`, `app/services/finguard/predictor.py`, `app/services/finguard/preprocessing.py`, `app/services/finguard/schemas.py`.
- **Search Hints**: `predict_finguard`, `FinGuardPredictor.predict`, `warmup_finguard`.

---

## 4. NLU Parsing
- **Purpose**: Natural Language Understanding fallback for intent extraction from user financial queries.
- **Key Files**: `app/routes/nlu.py`.
- **Search Hints**: `parse_nlu`, `classify_intent`.
