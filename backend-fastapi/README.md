# README.md — FinGuard Backend FastAPI (ML & CV Microservice)

> Source of truth for autonomous coding agents and machine learning engineers working in `backend-fastapi`.
> Extracted directly from the actual codebase. Read once per session before touching code or model pipelines.
> **Philosophy:** Search → Map → Read → Reuse → Extend → Modify. Never duplicate logic. Ship right once.

---

## 1. TECH STACK (Confirmed from Codebase & Dependencies)

- **Runtime**: Python `3.10+` / `3.11`
- **Web Framework**: FastAPI `0.115.11` (`fastapi`)
- **ASGI Server**: Uvicorn `0.34.0` (`uvicorn[standard]`)
- **Asynchronous Database Driver**: PostgreSQL via `asyncpg 0.30.0` & SQLAlchemy 2.0 async (`sqlalchemy>=2.0.38`)
- **Computer Vision & Face Verification**: DeepFace `0.0.93`, OpenCV (`opencv-python-headless 4.11.0.86`), Pillow `11.1.0`
- **Facial Model**: Facenet / VGG-Face with Cosine Distance metrics
- **OCR Engines**:
  - Primary: EasyOCR `1.7.2` (Bilingual: English & Nepali/Hindi)
  - Secondary/Fallback: PaddleOCR `2.9.1` (`paddlepaddle>=2.6.0`, `paddleocr>=2.9.1`)
  - Utilities: PyTesseract `0.3.13`
- **Machine Learning & Scoring Pipeline**:
  - Engine: LightGBM `4.6.0`, XGBoost `2.1.4`, Scikit-learn `1.6.1`
  - Data Processing: Pandas `2.2.3`, NumPy `1.26.4` / `2.0.2`, SciPy `1.15.2`
  - Model Artifacts: `finguard_model_v1.3.0/finguard_artifacts/` (`model.pkl`, `model_manifest.json`, `preprocessing.json`, `feature-schema.json`)
- **Validation & Environment Settings**: Pydantic `2.10.6` & Pydantic-Settings `2.8.1` (`BaseSettings`)
- **PDF & Document Parsing**: PyPDF `5.3.1`, pdfplumber `0.11.5`, python-docx `1.1.2`, openpyxl `3.1.5`
- **Testing Engine**: pytest `8.3.5`, pytest-asyncio `0.25.3`, httpx `0.28.1`

**Environment Variables (`backend-fastapi/.env` validated via `app/config.py`):**
- `NODE_ENV` (default: `development`)
- `DATABASE_URL` (default: `postgresql+asyncpg://postgres:admin@localhost:5432/finguard`)
- `API_HOST` (default: `0.0.0.0`), `API_PORT` (default: `8000`), `DEBUG` (default: `False`)
- `UPLOAD_DIR` (default: `uploads/kyc`), `MAX_FILE_SIZE` (default: `10485760` — 10MB)
- `FACE_MODEL` (default: `VGG-Face`), `FACE_MATCH_THRESHOLD` (default: `0.4`)
- `OCR_CONFIDENCE_THRESHOLD` (default: `0.5`), `OCR_FIELD_MATCH_THRESHOLD` (default: `60`)
- `ML_MODEL_PATH` (default: `../finguard_artifacts/model.pkl`)
- `ML_MANIFEST_PATH` (default: `../finguard_artifacts/model_manifest.json`)
- `ML_PREPROCESSING_PATH` (default: `../finguard_artifacts/preprocessing.json`)
- `ML_SCHEMA_PATH` (default: `../finguard_artifacts/feature-schema.json`)
- `LOG_LEVEL` (default: `INFO`)
- `FINANCIAL_OCR_ENABLED` (default: `false` — toggles legacy text extraction)

---

## 2. BOOT SEQUENCE & LIFESPAN (`main.py`) — Non-Negotiable Lifecycle

```
[1] Platform & Thread Optimization Flags (Top of main.py)
    ├─ os.environ['PYTHONIOENCODING'] = 'utf-8'
    ├─ os.environ['TF_USE_LEGACY_KERAS'] = '1' (ensures Keras 2 compatibility for DeepFace)
    ├─ os.environ['FLAGS_use_mkldnn'] = '0' & TF_ENABLE_ONEDNN_OPTS = '0' (prevents thread panics)
    └─ If Windows: asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

[2] Lifespan Startup Hook (lifespan in main.py)
    ├─ await init_db(): Establishes connection pool to PostgreSQL via SQLAlchemy asyncpg.
    ├─ Predictor Discovery (app/services/finguard/predictor.py):
    │   └─ Scans candidate directories:
    │      1. settings.ML_MODEL_PATH
    │      2. backend-fastapi/../finguard_model_v1.3.0/finguard_artifacts/
    │      3. backend-fastapi/../finguard_artifacts/
    │      4. backend-fastapi/finguard_artifacts/
    │   └─ Validates presence of model.pkl, model_manifest.json, preprocessing.json.
    │   └─ Calls init_predictor(model_path, manifest_path, preproc_path, schema_path).
    │   └─ Executes predictor.warmup() with synthetic sample vector to preheat JIT/caches.
    └─ Face & OCR Service Initialization:
        └─ Face matching service configured for lazy evaluation on demand.
        └─ Active KYC flow isolates face verification from heavy text extraction.

[3] Router Mounting & Spec Aliases (create_app in main.py)
    ├─ Mounts api_router under prefix /api/v1 (kyc, financial_ocr, nlu, finguard).
    ├─ Mounts Root Spec Aliases: /finguard/* and /nlu/* at service root for legacy callers.
    ├─ Configures OpenAPI Documentation: /api/v1/docs, /api/v1/redoc, /api/v1/openapi.json.
    └─ Mounts Health Endpoints: /health (liveness) and /ready (model readiness probe).

[4] Shutdown Hook
    └─ Cleanly disposes database connection pools and frees thread resources.
```

---

## 3. DATA & INFERENCE ARCHITECTURE (Non-Negotiable)

```
Stateless Microservice Model:
  ├─ All OCR and Computer Vision endpoints accept file paths on disk or multi-part uploads.
  ├─ Path Resolution Helper: resolve_image_path() handles cross-service relative paths
  │  (e.g., searches uploads/kyc, backend-node/, ../backend-node/).
  └─ Caller Responsibility: The Node.js Express backend orchestrates file persistence,
     passes paths to FastAPI, and persists extracted metadata to its central Postgres database.

Concurrency & Async/Sync Separation:
  ├─ CPU-intensive tasks (EasyOCR, DeepFace facial inference, LightGBM tree evaluation)
  │  MUST execute in threadpools (asyncio.to_thread or standard def route endpoints)
  │  to avoid starving the Uvicorn asyncio event loop.
  └─ Database access for internal verification records uses SQLAlchemy AsyncSession.

Graceful Model Degradation:
  ├─ If DeepFace fails or model artifacts are absent, /ready marks degraded: true
  │  without crashing the service, allowing core DB and health checks to stay alive.
  └─ OCR pipeline supports PaddleOCR -> EasyOCR fallback cascade.
```

---

## 4. REPOSITORY LAYOUT (Actual Tree from Codebase)

```
backend-fastapi/
├── main.py                       # App factory, lifespan, model pre-warming, health probes
├── requirements.txt              # Pinned Python package dependencies
├── Dockerfile                    # Containerization manifest with system OpenCV libraries
├── app/
│   ├── config.py                 # Pydantic Settings & environment variable configuration
│   ├── api/
│   │   └── v1/
│   │       └── __init__.py       # Aggregates kyc, financial_ocr, nlu, and finguard routers
│   ├── db/                       # SQLAlchemy 2.0 async engine and session factory
│   │   ├── __init__.py           # init_db(), get_async_session(), Base metadata
│   │   └── session.py            # AsyncSessionLocal provider
│   ├── models/                   # SQLAlchemy ORM database models
│   │   ├── __init__.py           # Exports User, KYCApplication, Document, OCRResult, FaceVerification
│   │   ├── user.py               # User model definition
│   │   ├── kyc.py                # KYCApplication and Document models
│   │   └── verification.py       # OCRResult and FaceVerification models
│   ├── routes/                   # HTTP Controller modules
│   │   ├── __init__.py
│   │   ├── kyc.py                # Document upload, face verification, OCR citizenship, status
│   │   ├── financial_ocr.py      # Salary slip & bank statement extraction (/financial/*)
│   │   ├── finguard.py           # Credit scoring inference, batch, explain, schema (/finguard/*)
│   │   └── nlu.py                # Natural language intent parsing & financial Q&A (/nlu/*)
│   ├── extraction/               # Native document extractors (PDF, docx, xlsx table parsers)
│   │   ├── pdf_extractor.py      # Native PDF text and transaction table extraction
│   │   └── table_extractor.py    # Structured table heuristics and regex column mapping
│   └── services/                 # Core domain services and ML pipelines
│       ├── identity_service.py   # DeepFace facial verification, cosine distance scoring
│       ├── ocr_service.py        # EasyOCR Nepali/English processing with bounding boxes
│       ├── financial_ocr_service.py # Image OCR for financial documents
│       ├── financial_extraction_service.py # Unified document parsing decision tree
│       └── finguard/             # Credit risk prediction subsystem
│           ├── __init__.py
│           ├── predictor.py      # FinGuardPredictor: artifact loader, warm-up, inference
│           ├── preprocessing.py  # Feature alignment, imputation, scaling, label encoding
│           ├── rules.py          # Hard financial business rules (DTI cutoffs, minimum income)
│           ├── schemas.py        # Pydantic models for predict, batch, explain, and chat
│           └── validators.py     # Request validation, SPEC_THRESHOLD, HomeCredit feature bounds
├── scripts/                      # Utility scripts for local testing and data inspection
└── tests/                        # Pytest suite for endpoints and predictor logic
```

---

## 5. ROUTE & API CATALOG

All routes are mounted under `/api/v1/*` as well as root-level spec aliases (`/finguard/*`, `/nlu/*`).

### 5.1 KYC & Identity Verification (`app/routes/kyc.py`)

| Method | Endpoint | Handler | Description |
|---|---|---|---|
| `POST` | `/api/v1/kyc/upload` | `upload_documents` | Uploads ID front, back, or selfie image; creates `KYCApplication` record |
| `POST` | `/api/v1/kyc/verify` | `verify_face` | Database-backed face match between uploaded selfie and ID document |
| `POST` | `/api/v1/kyc/ocr/citizenship` | `ocr_citizenship` | Stateless OCR on citizenship card image; extracts name, DOB, ID number |
| `POST` | `/api/v1/kyc/face/verify` | `verify_face_stateless` | Stateless DeepFace comparison between citizenship photo and selfie |
| `GET` | `/api/v1/kyc/status/{id}` | `get_kyc_status` | Retrieves KYC application status, document count, and verification details |

### 5.2 Financial Document OCR (`app/routes/financial_ocr.py`)

| Method | Endpoint | Handler | Description |
|---|---|---|---|
| `POST` | `/api/v1/financial/ocr` | `ocr_financial_document` | Legacy raw text extraction from salary slip or bank statement via EasyOCR |
| `POST` | `/api/v1/financial/ocr/extract-document` | `extract_document` | Structured document extraction: auto-detects text vs scanned image, parses transactions & tables |

### 5.3 FinGuard Credit Default Prediction (`app/routes/finguard.py`)

| Method | Endpoint | Handler | Description |
|---|---|---|---|
| `GET` | `/api/v1/finguard/health` | `health` | Predictor liveness, loaded model version, and active threshold |
| `GET` | `/api/v1/finguard/model-info` | `model_info` | Model metadata, training manifest, and feature ordering |
| `GET` | `/api/v1/finguard/schema` | `schema` | Full JSON schema of required features and types (`feature-schema.json`) |
| `POST` | `/api/v1/finguard/predict` | `predict` | Single application inference: default probability, risk tier, credit score |
| `POST` | `/api/v1/finguard/batch` | `batch` | Batch inference: evaluates up to hundreds of applicant feature vectors |
| `POST` | `/api/v1/finguard/explain` | `explain` | Feature contribution breakdown and top risk-driving factors |

*Note: The FinGuard router is also accessible at root `/finguard/*` (e.g., `/finguard/predict`).*

### 5.4 Natural Language Financial Assistant (`app/routes/nlu.py`)

| Method | Endpoint | Handler | Description |
|---|---|---|---|
| `POST` | `/api/v1/nlu/ask` | `ask_question` | Natural language question answering with intent & entity classification |
| `POST` | `/api/v1/nlu/chat` | `chat` | Conversational financial query handler |
| `POST` | `/api/v1/nlu/document/analyze` | `analyze_document` | Analyzes raw document text, extracts monetary entities, returns chart hints |
| `GET` | `/api/v1/nlu/health` | `health` | NLU subsystem health probe |

*Note: The NLU router is also accessible at root `/nlu/*` (e.g., `/nlu/ask`).*

### 5.5 System & Health Probes (`main.py`)

| Method | Endpoint | Handler | Description |
|---|---|---|---|
| `GET` | `/health` | `health_check` | General liveness probe (`{"status": "ok", "service": "kyc-service"}`) |
| `GET` | `/ready` | `readiness_check` | Model readiness probe (`ready: true`, reports model status and degradation) |
| `GET` | `/api/v1/docs` | `versioned_swagger_ui` | Interactive Swagger UI documentation |
| `GET` | `/api/v1/redoc` | `versioned_redoc` | ReDoc API specification viewer |

---

## 6. SERVICES & INFERENCE PIPELINES

### 6.1 `FinGuardPredictor` (`app/services/finguard/predictor.py`)
- **Singleton Management**: Initialized during application lifespan via `init_predictor(...)`, accessed via `get_predictor()`.
- **Pipeline Execution**:
  1. **Validation**: Validates input dictionary against `app/services/finguard/validators.py`.
  2. **Preprocessing**: Passes features through `FinGuardPreprocessor` (`preprocessing.py`) to align feature vectors, fill missing values via median/mode imputation, and apply standard scaling.
  3. **Prediction**: Invokes LightGBM/Scikit-learn model: `model.predict_proba(X)`.
  4. **Output Synthesis**:
     - `default_probability`: Float between `0.0` and `1.0`.
     - `credit_score`: Calibrated integer score (300 to 850).
     - `decision`: `"APPROVED"` | `"REJECTED"` | `"MANUAL_REVIEW"`.
     - `risk_tier`: `"LOW"` | `"MEDIUM"` | `"HIGH"`.

### 6.2 `IdentityService` (`app/services/identity_service.py`)
- **Face Detection & Alignment**: Loads OpenCV and DeepFace (`Facenet` or `VGG-Face`).
- **Core Method**: `verify_face_match_async(selfie_path, id_document_path, kyc_application_id, session)`.
- **Scoring & Match Threshold**:
  - Distance metric: Cosine distance.
  - `distance < 0.4`: Strong match (`status: MATCH`, `recommendation: APPROVE`).
  - `0.4 <= distance < 0.6`: Marginal match (`status: POSSIBLE_MATCH` / `LOW_CONFIDENCE`, `recommendation: REVIEW`).
  - `distance >= 0.6`: Mismatch (`status: MISMATCH`, `recommendation: REJECT`).
  - `similarity_score = max(0.0, 1.0 - distance)`.

### 6.3 `OcrService` (`app/services/ocr_service.py`)
- **Engine**: EasyOCR Reader initialized for `['en', 'ne']` (or `['en', 'hi']`).
- **Method**: `extract_text_async(image_path)` / `process_image_async(image_path)`.
- **Output**: Bounding boxes, extracted strings, confidence scores per token, and structured identity field mapping (citizenship number, full name, birth date, issuing district).

### 6.4 `FinancialExtractionService` (`app/services/financial_extraction_service.py`)
- **Decision Engine**:
  - Checks file extension:
    - Text-extractable (`.pdf`, `.docx`, `.xlsx`, `.txt`): Uses native parsers (`pdfplumber`, `python-docx`, `openpyxl`) for 100% accurate character rendering without OCR artifacts.
    - Image-based (`.jpg`, `.png`, scanned image PDFs): Routes to OCR pipeline.
- **Output Schema**: Returns unified JSON containing bank metadata, transaction ledger (`date`, `description`, `debit`, `credit`, `balance`), and parsing confidence.

---

## 7. SCHEMAS & DATA MODELS

### 7.1 Pydantic Validation Schemas (`app/services/finguard/schemas.py`)
- `FinguardPredictRequest`: Accepts applicant demographic, financial, and credit bureau features (HomeCredit dataset format). Includes helper `.to_validator_dict()`.
- `FinguardPredictResponse`: Returns dual-envelope response (internal names: `default_probability`, `credit_score`, `decision`, `risk_tier`; spec alias names: `status`, `prediction`, `probability`, `risk_score`).
- `FinguardBatchRequest` / `FinguardBatchResponse`: Accepts array of applicant dictionaries, supports `stop_on_error`.
- `FinguardExplainRequest` / `FinguardExplainResponse`: Explains key drivers behind risk score.
- `AskRequest` / `AskResponse`: NLU query format (`user_id`, `message`, `session_id`).
- `DocumentAnalyzeRequest` / `DocumentAnalyzeResponse`: Document analysis format with visualization hints (`chart_type`, `data_keys`).

### 7.2 Database Models (`app/models/`)
- `User` (`app/models/user.py`): Maps `auth.users` table (`id`, `email`, `role`, `tenant_id`).
- `KYCApplication` (`app/models/kyc.py`): Primary verification record (`id`, `user_id`, `status: PENDING|APPROVED|REJECTED`, `confidence_score`).
- `Document` (`app/models/kyc.py`): Uploaded file references (`id`, `kyc_application_id`, `document_type`, `file_path`, `file_size`, `mime_type`).
- `FaceVerification` (`app/models/verification.py`): Facial matching audit (`id`, `kyc_application_id`, `is_match`, `distance`, `verified_at`).
- `OCRResult` (`app/models/verification.py`): Extracted text records (`id`, `kyc_application_id`, `document_type`, `structured_data`, `confidence_score`).

---

## 8. ML DOMAIN RULES & RISK TIERS

### 8.1 Model Thresholds
- **Trained Model Threshold**: `0.0807` (derived from optimal F1 / ROC-AUC on imbalanced default dataset).
- **Spec Threshold**: `SPEC_THRESHOLD = 0.50` (standard binary classification cutoff).
- The service exposes both thresholds in `/finguard/health` and calibrates the credit score accordingly.

### 8.2 Hard Business Rules (`app/services/finguard/rules.py`)
Even if the ML model outputs a low default probability, the application enforces statutory guardrails:
1. **Maximum Debt-to-Income (DTI)**: Applications exceeding statutory limits are flagged for `MANUAL_REVIEW` or rejected.
2. **Minimum Income Threshold**: Monthly income below subsistence thresholds triggers auto-decline.
3. **Severe Delinquency**: Past severe defaults or active bureau write-offs override ML predictions to enforce rejection.

---

## 9. SEARCH STRATEGY (Ripgrep Precision)

Quickly locate critical components in `backend-fastapi` using these targeted ripgrep commands:

```bash
# 1. Locate FinGuard ML prediction handler
rg "async def predict" app/routes/

# 2. Locate FinGuardPredictor class and inference logic
rg "class FinGuardPredictor" app/services/finguard/

# 3. Locate Face Verification logic and DeepFace calls
rg "verify_face" app/services/identity_service.py

# 4. Locate OCR extraction methods
rg "process_image_async|extract_text" app/services/ocr_service.py

# 5. Search KYC router endpoints
rg "@router\.(post|get)" app/routes/kyc.py

# 6. Locate NLU intent definitions and regex matchers
rg "class Intent|def classify_intent" app/routes/nlu.py

# 7. Locate Pydantic settings and env variable declarations
rg "class Settings" app/config.py
```

---

## 10. SHIPPING CHECKLIST

Before deploying or committing changes to `backend-fastapi`, verify the following:

- [ ] **Model Artifacts**: Ensure `model.pkl`, `model_manifest.json`, and `preprocessing.json` are present in candidate paths.
- [ ] **Warmup Integrity**: Health endpoint `/finguard/health` reports `"ready": true` and `/ready` responds with `200 OK`.
- [ ] **Cross-Platform Compatibility**: Windows event loop policy guard remains active at the top of `main.py`.
- [ ] **Stateless Safety**: Image files used during verification do not leave unhandled file locks; temporary files are deleted in `finally` blocks.
- [ ] **Dual Schema Support**: FinGuard responses contain both internal keys (`default_probability`, `credit_score`) and spec keys (`prediction`, `probability`, `risk_score`).
- [ ] **Error Handling**: Missing files return HTTP 400; validation errors return HTTP 422; internal model failures return HTTP 500.
