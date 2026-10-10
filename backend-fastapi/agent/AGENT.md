# AGENT.md (Backend FastAPI ML & CV Microservice)

> Canonical knowledge for autonomous coding agents modifying `backend-fastapi`.
> Read once per session before making modifications in this service.

## 1. Tech Stack
- **Runtime**: Python 3.10+
- **Framework**: FastAPI 0.115+
- **Server**: Uvicorn (ASGI)
- **Database Engine**: PostgreSQL via asyncpg & SQLAlchemy 2.0 async
- **Computer Vision**: OpenCV (`cv2`), DeepFace (Facenet model)
- **OCR Engines**: EasyOCR (Nepali & English), PaddleOCR fallback, Tesseract
- **ML Inference**: Scikit-Learn, LightGBM (`model.pkl`), Pandas, NumPy
- **Artifacts**: `finguard_model_v1.3.0/finguard_artifacts/`

---

## 2. Boot Flow (`main.py`)
1. **Windows Selector Policy**: Sets `asyncio.WindowsSelectorEventLoopPolicy()` if running on Windows.
2. **Environment Flags**: Enforces legacy Keras (`TF_USE_LEGACY_KERAS=1`) and disables mkldnn to avoid thread panics.
3. **Database Lifespan**: `init_db()` connects async database engine.
4. **Predictor Discovery**:
   - Searches candidate directories for `model.pkl`, `model_manifest.json`, `preprocessing.json`.
   - Initializes and warms up `FinGuardPredictor` (`app/services/finguard/predictor.py`).
5. **Router Mount**: Mounts `api_router` at `/api/v1` and roots `/finguard` & `/nlu`.
6. **Listener**: Starts HTTP on port 8000.

---

## 3. Architecture Rules
1. **Stateless Operations**: OCR and ML inference endpoints should avoid long-lived persistent file locks; clean temporary files in `finally` blocks.
2. **Graceful Model Degradation**: If DeepFace or PaddleOCR fail due to OS library mismatches, fall back to pure EasyOCR or rule-based heuristics without crashing the process.
3. **Async / Sync Separation**: CPU-heavy ML inference and computer vision loops should run in threadpools (`asyncio.to_thread` or FastAPI standard def) to avoid starving the async event loop.
4. **Input Schema Compliance**: ML inference requests must validate against `app/services/finguard/schemas.py`.

---

## 4. Directory Layout
```
backend-fastapi/
├── main.py                       # Application creation, lifespan, model pre-warm
├── requirements.txt              # Python dependencies
└── app/
    ├── config.py                 # Pydantic Settings & environment variables
    ├── api/v1/                   # Router aggregation (__init__.py)
    ├── db/                       # SQLAlchemy async database session & init
    ├── routes/                   # kyc.py, financial_ocr.py, finguard.py, nlu.py
    └── services/                 # identity_service, ocr_service, financial_ocr_service
        └── finguard/             # predictor.py, preprocessing.py, validators.py, schemas.py
```

---

## 5. Search Strategy (Ripgrep Precision)
```bash
# Search ML inference handler
rg "def predict_finguard" app/routes/

# Search DeepFace matching function
rg "def verify_faces" app/services/

# Search OCR extraction method
rg "def extract_text" app/services/
```

---

## 6. Shipping Checklist
- [ ] ML artifacts verified in `finguard_artifacts/` (`model.pkl`, `model_manifest.json`).
- [ ] Schema types matched with `backend-node` caller.
- [ ] Temporary files safely removed after processing.
- [ ] Health check returning `{"status": "ok"}` on `/health`.
