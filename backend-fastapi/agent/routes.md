# Backend-FastAPI Routes

> REST API endpoints exposed by `backend-fastapi`.

---

| Method | Endpoint | Handler | Description |
|---|---|---|---|
| `POST` | `/api/v1/kyc/verify` | `app.routes.kyc.verify_kyc` | Extract document text + verify face against selfie |
| `POST` | `/api/v1/kyc/face-match` | `app.routes.kyc.face_match` | Compare selfie photo with ID document portrait |
| `POST` | `/api/v1/kyc/ocr` | `app.routes.kyc.extract_ocr` | OCR extraction only on front/back ID |
| `POST` | `/api/v1/financial-ocr/extract` | `app.routes.financial_ocr.extract_financial_text` | Stateless OCR on financial documents |
| `POST` | `/api/v1/finguard/predict` | `app.routes.finguard.predict_finguard` | LightGBM inference: default probability & risk tier |
| `GET` | `/api/v1/finguard/warmup` | `app.routes.finguard.warmup_finguard` | Preload & warm ML model artifacts |
| `GET` | `/api/v1/finguard/schema` | `app.routes.finguard.schema_finguard` | Feature schema definitions |
| `POST` | `/api/v1/nlu/parse` | `app.routes.nlu.parse_nlu` | Intent and entity classification |
| `GET` | `/health` | `main.health_check` | Microservice and model readiness probe |
