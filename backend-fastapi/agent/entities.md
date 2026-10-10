# Backend-FastAPI Entities & Schemas

> Pydantic schemas and database models utilized in `backend-fastapi`.

---

| Pydantic / DB Schema | File Location | Purpose |
|---|---|---|
| `FinGuardInput` | `app/services/finguard/schemas.py` | Complete borrower & loan feature vector for ML inference |
| `PredictionOutput` | `app/services/finguard/schemas.py` | Inference output: `default_probability`, `risk_tier`, `factors` |
| `KycVerificationRequest` | `app/routes/kyc.py` | Multipart input containing front, back, and selfie files |
| `FaceMatchResponse` | `app/routes/kyc.py` | Verification status: `is_match`, `confidence`, `distance` |
| `FinancialOcrResponse` | `app/routes/financial_ocr.py` | Structured raw lines, extracted numbers, and confidence |
| `NluParseRequest` | `app/routes/nlu.py` | User input message string and optional conversation context |
