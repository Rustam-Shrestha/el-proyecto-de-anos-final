# Backend-FastAPI Services

> Services and ML inference pipelines in `backend-fastapi/app/services`.

---

### `FinGuardPredictor` (`app/services/finguard/predictor.py`)
- **Purpose**: Loads Scikit-learn / LightGBM pipeline, applies preprocessors, executes prediction inference.
- **Key Methods**:
  - `predict(data: dict) -> PredictionOutput`: Computes `default_probability`, `risk_tier`, `confidence`.
  - `warmup() -> None`: Executes synthetic sample inference to trigger JIT / cache warm-up.
- **Dependencies**: `model.pkl`, `preprocessing.json`, `model_manifest.json`.

### `IdentityService` (`app/services/identity_service.py`)
- **Purpose**: Computer vision face detection, alignment, and facial distance scoring.
- **Key Methods**:
  - `verify_faces(selfie_path: str, doc_path: str) -> FaceMatchResult`: Computes cosine distance using Facenet.
- **Dependencies**: DeepFace, OpenCV (`cv2`).

### `OcrService` (`app/services/ocr_service.py`)
- **Purpose**: Document text extraction for Nepali & English identity cards.
- **Key Methods**:
  - `extract_text(image_path: str) -> OcrResult`: Extracts bounding boxes, lines, and confidence.
- **Dependencies**: EasyOCR, PaddleOCR fallback.

### `FinancialOcrService` (`app/services/financial_ocr_service.py`)
- **Purpose**: Financial statement and salary slip text extraction.
- **Key Methods**:
  - `process_document(file_path: str, doc_type: str) -> dict`: Extracts text lines and raw fields.
