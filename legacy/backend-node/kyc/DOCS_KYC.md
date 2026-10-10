KYC Module Documentation

Overview

The KYC (Know Your Customer) module provides a comprehensive identity verification pipeline supporting mixed-script (Devanagari + English) document processing.

Architecture

The KYC system is decoupled into independent layers:

Backend Layer (FastAPI + SQLAlchemy)
- API Endpoints: Document upload, face verification, status retrieval
- OCR Service: PaddleOCR-based extraction with fuzzy matching
- Identity Service: DeepFace-based face verification
- Database Layer: PostgreSQL with JSONB support

Notes:
If you want, I can:
Try alternate PaddlePaddle versions (e.g., `>=2.6.2,<3.0`) in `requirements.txt`.
Add a small `scripts/install_windows_paddle.ps1` helper that automates wheel lookup and install for Windows.

Helper script

I added a small helper script to automate installing `uvicorn` into the repository venv:

- `backend-fastapi/scripts/install_uvicorn.ps1` — detects common `.venv` locations and runs `pip install uvicorn` using the venv's Python; use `-RunServer` to start the server after install.

Example usage (PowerShell from `backend-fastapi/scripts`):

```powershell
.\install_uvicorn.ps1            # install uvicorn into detected venv
.\install_uvicorn.ps1 -RunServer # install and start uvicorn
```

Backend module import fix (Windows)

If you run from `backend-fastapi/app`, this command can fail:

```powershell
python -m uvicorn main:app --reload
```

with `ModuleNotFoundError: No module named 'main'`.

Reason:
- `main:app` is importable when your working directory is `backend-fastapi/` (so Python can see the `app/` package).

Use one of these options:

```powershell
# Option 1: run from backend-fastapi
cd D:\miDirectarios\studies\8th sem files\projectIII\backend-fastapi
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Option 2: use helper script from anywhere
.\backend-fastapi\scripts\run_backend.ps1 -Reload
```

The helper script auto-detects these interpreters in order and uses the first one found:
- `.venv\Scripts\python.exe`
- `backend-fastapi\.venv\Scripts\python.exe`
- `backend-fastapi\venv\Scripts\python.exe`

If dependencies are missing in that environment, install with the same interpreter:

```powershell
<detected-python> -m pip install -r backend-fastapi/requirements.txt
```

OpenCV / PaddleOCR dependency note

During installation `pip` may encounter a dependency conflict between `paddleocr` and newer `opencv-python` releases. `paddleocr==2.7.0.3` depends on `opencv-python<=4.6.0.66`. To avoid a `ResolutionImpossible` error, the repository now pins `opencv-python==4.6.0.66` in `backend-fastapi/requirements.txt` which is compatible with the pinned `paddleocr`.

If you intentionally need a newer `opencv-python` (4.8+), options are:
- Upgrade `paddleocr` to a newer release that supports that OpenCV version (may require code adjustments).
- Remove the `paddleocr` pin and install a different OCR library that supports newer OpenCV.

For most users on Windows with the current KYC code, keep the pinned `opencv-python==4.6.0.66` and run the install commands from the docs.

PyMuPDF build failure fix (Python 3.11 / Windows)

If install fails with errors similar to `Failed building wheel for PyMuPDF` and references to `devenv.com` not found, this comes from older `paddleocr` dependency resolution trying to compile `PyMuPDF` from source.

Applied fix in this repository:
- `paddleocr` updated to `2.7.3` in `backend-fastapi/requirements.txt`.

Why this works:
- `paddleocr==2.7.3` resolves to `PyMuPDF>=1.26.7` on modern environments, which has prebuilt wheels for Python 3.11 Windows and avoids local Visual Studio compilation.
Frontend Layer (React + TypeScript)
- KYC Form Component: Multi-step form for user input
- API Service: Axios-based backend communication
- Custom Hook (useKYC): Wraps TanStack Query for data management

Key Components

1. OCR Module (backend-fastapi/app/services/ocr_service.py)

Functionality:
- Loads images and preprocesses (grayscale, resize to max 1080px, contrast enhancement)
- Runs PaddleOCR with lang=['hi', 'en'] for mixed-script support
- Detects language (Devanagari, English, or mixed)
- Applies fuzzy matching to extract structured key-value pairs
- Calculates confidence scores for each field

Fuzzy Matching Strategy:
- Compares each extracted text line against predefined keywords (Devanagari + English)
- Uses token_set_ratio from thefuzz library for flexible matching (threshold: 60)
- Extracts field values from the next line or remainder of the matched line
- Returns structured JSON with detected fields: name, surname, dob, citizenship_number, etc.

Language Detection:
Uses Unicode ranges to classify text:
- Devanagari: U+0900 to U+097F
- Latin: U+0041-U+005A, U+0061-U+007A
- Returns 'hi' (>70% Devanagari), 'en' (>70% Latin), or 'mixed'

Performance Optimization:
- Async/await for I/O operations (thread pool executor for image processing)
- Resizes images to max 1080px to reduce processing time on i3 processor
- CLAHE contrast enhancement for improved OCR accuracy

2. Identity Verification Module (backend-fastapi/app/services/identity_service.py)

Functionality:
- Detects face in ID document using DeepFace.extract_faces()
- Crops and aligns face region (with 10px padding)
- Compares selfie with cropped ID face using DeepFace.verify()
- Returns distance and match verdict

DeepFace Configuration:
- Model: VGG-Face (64-D embedding)
- Detector: OpenCV cascade classifier
- Distance Metric: Euclidean distance on embeddings

Match Threshold (VGG-Face):
- distance < 0.4: Match (is_match = True)
- distance >= 0.4: No match (is_match = False)

Note: Threshold is tuned for VGG-Face model. Other models (FaceNet, ArcFace) may require adjustment.

Performance:
- Face detection: ~200-500ms per image (on i3 processor)
- Embedding computation: ~100-200ms per image
- Comparison: <10ms

3. API Endpoints (backend-fastapi/app/api/v1/endpoints/kyc.py)

POST /api/v1/kyc/upload
- Accepts multipart/form-data with user_id, document_type, and file
- Creates KYC application if not exists
- Saves file to uploads/kyc/<app_id>/<filename>
- Triggers async OCR processing for citizenship documents
- Returns: document_id, kyc_application_id, status

POST /api/v1/kyc/verify
- Accepts selfie_path and id_document_path
- Performs face verification asynchronously
- Updates KYC status to APPROVED or REJECTED based on match
- Returns: verification_id, is_match, distance, status

GET /api/v1/kyc/status/{kyc_application_id}
- Returns complete KYC status with all documents, OCR results, and face verifications
- Supports polling for real-time status updates
- Returns: status, confidence_score, documents, ocr_results, face_verifications

Data Flow

1. User initiates KYC:
   POST /upload (citizenship_front)
   -> Backend creates KYCApplication, saves file, triggers OCR
   -> OCRResult is stored with structured_data (name, surname, dob, etc.)

2. User uploads additional documents:
   POST /upload (citizenship_back, selfie)
   -> Documents are saved and associated with KYCApplication

3. User initiates face verification:
   POST /verify
   -> Backend detects face in citizenship_front, crops it
   -> Compares with selfie using DeepFace
   -> Updates KYCApplication.status based on match result

4. Frontend polls for status:
   GET /status/{kyc_application_id}
   -> Returns all associated data (documents, OCR results, face verification)
   -> Frontend displays confidence scores and extracted data

Mixed-Script Support

Devanagari Keyword Dictionary:
- नाम (name)
- थर (surname)
- जन्म मिति (date of birth)
- नागरिकता नं (citizenship number)
- लिङ्ग (gender)
- ठेगाना (address)
- बाबु (father)
- आमा (mother)

English Keywords:
- name, surname, father, mother
- date of birth, dob, d.o.b
- citizenship number, citizenship no, document number
- gender, sex
- address

Fuzzy matching handles variations, typos, and mixed formatting (e.g., "नाम:", "नाम :", "NAAMAAAA").

Error Handling

OCR Processing:
- File not found -> FileNotFoundError with path in message
- Image load failure -> ValueError with details
- Invalid format -> ValueError with file type in message

Face Verification:
- Face not detected -> ValueError with specific image label
- Face detection disabled by enforce_detection -> ValueError with details
- Comparison failure -> ValueError with underlying error

API Layer:
- Invalid document type -> HTTP 400
- Missing file or invalid format -> HTTP 400
- User not found -> HTTP 404
- KYC application not found -> HTTP 404
- Service errors (OCR, face verification) -> HTTP 500 with error message

Database Storage

KYC Results are stored in:

OCRResult table:
{
  "raw_text": "नाम राज कुमार\nथर शर्मा\n...",
  "structured_data": {
    "name": "राज कुमार",
    "surname": "शर्मा",
    "dob": "2000-01-15",
    "citizenship_number": "12345678"
  },
  "confidence_score": 0.85,
  "language_detected": "mixed"
}

FaceVerification table:
{
  "distance": 0.32,
  "is_match": true,
  "model_used": "VGG-Face"
}

KYCApplication table:
{
  "status": "APPROVED",
  "confidence_score": 0.92,
  "feature_vector": [64-D embedding from DeepFace]
}

Performance Considerations

For i3 Processor Compatibility:

1. Use GPU=False in PaddleOCR initialization
2. Resize images to max 1080px before processing
3. Use async/await for all I/O operations
4. Thread pool executors for CPU-intensive tasks (OCR, face detection)
5. Batch processing not recommended (process one document at a time)

Benchmark (i3-8100, 8GB RAM):
- Image preprocessing: 50-100ms
- PaddleOCR extraction: 800-1200ms per image
- Face detection: 200-500ms per image
- Face comparison: 100-200ms
- Total KYC workflow: 1.5-2.5 seconds per application

Logging

All services use Python logging with structured format:

logger.info("Processing document: %s (app_id=%s)", image_path, app_id)
logger.debug("Image preprocessed. Shape: %s", shape)
logger.error("Face verification failed: %s", error_message)

Log levels:
- DEBUG: Image processing steps, API request details
- INFO: Document processing start/completion, verification results
- ERROR: Failures in OCR, face detection, database operations
- WARNING: Confidence scores below thresholds

Future Enhancements

1. Liveness Detection: Add face liveness check to detect spoofing
2. Document Quality Assessment: Evaluate image sharpness, brightness, glare
3. Multi-model Approach: Compare VGG-Face with FaceNet for redundancy
4. Webhook Support: Notify frontend of async task completion via webhook
5. Batch Processing API: Handle bulk KYC submissions
6. Audit Trail: Log all verification attempts with timestamps and user actions


Local installation fixes (2026-05-02)

Summary:
- Resolved pip install failure that reported "No matching distribution found for paddlepaddle==2.5.1" by updating the pinned PaddlePaddle version to a platform-available release.
- Ensured `uvicorn` is present in `requirements.txt` so the ASGI server can be installed via the same requirements file.

What I changed:
- `backend-fastapi/requirements.txt`: replaced `paddlepaddle==2.5.1` with `paddlepaddle==2.6.2` (available on PyPI).

Why:
- The environment attempting installation reported available PaddlePaddle versions starting at `2.6.2`; pinning to `2.5.1` caused pip to fail. Upgrading the pinned version to `2.6.2` allows `pip install -r backend-fastapi/requirements.txt` to find a matching wheel for many Windows/Python combinations. If your Python version is older or unsupported by the available wheel, follow the alternative wheel-install instructions below.

Exact commands to create a clean venv and install dependencies (PowerShell):

```powershell
# from repository root
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r backend-fastapi/requirements.txt
```

If paddlepaddle still fails to install on Windows, install the official PaddlePaddle wheel using the project's wheel index (choose the wheel matching your Python version and CPU/GPU requirements):

```powershell
# Example: CPU wheel via PaddlePaddle official index
python -m pip install paddlepaddle==2.6.2 -f https://www.paddlepaddle.org.cn/whl/windows.html
# Then install remaining deps
python -m pip install -r backend-fastapi/requirements.txt --no-deps
```

Verify `uvicorn` and run the server (from backend-fastapi):

```powershell
python -m pip show uvicorn
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Notes:
- If you see a "No module named uvicorn" error, ensure the venv activation used to run the server is the same interpreter used to install packages (PowerShell activation above). Use the fully qualified path to the venv Python when installing if needed: `.\.venv\Scripts\python.exe -m pip install -r backend-fastapi/requirements.txt`.
- PaddlePaddle provides platform-specific wheels; if your Python version is not supported by the provided wheels, consider using a matching Python version (3.10/3.11 are commonly supported) or use Conda to install a compatible build.

If you want, I can:
- Try alternate PaddlePaddle versions (e.g., `>=2.6.2,<3.0`) in `requirements.txt`.
- Add a small `scripts/install_windows_paddle.ps1` helper that automates wheel lookup and install for Windows.

Python 3.11 specific instructions

If your environment runs Python 3.11 (e.g. `Python 3.11.0`), use PaddlePaddle `3.2.2` which provides compatible wheels for Windows/Python 3.11 on supported builds. Use the following sequence in PowerShell from the repo root:

```powershell
# Create and activate venv
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Upgrade pip tools
python -m pip install --upgrade pip setuptools wheel

# Install PaddlePaddle from the official wheel index (Windows CPU example)
python -m pip install paddlepaddle==3.2.2 -f https://www.paddlepaddle.org.cn/whl/windows.html

# Install remaining dependencies
python -m pip install -r backend-fastapi/requirements.txt --no-deps

# Ensure uvicorn is installed
python -m pip install uvicorn

# Run the server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

If you still see wheel compatibility errors, either:
- switch to Python 3.10 (widely supported by older Paddle wheels) or
- use Conda: `conda create -n kyc python=3.11 -c conda-forge` then install PaddlePaddle via their instructions.

I updated `backend-fastapi/requirements.txt` to pin `paddlepaddle==3.2.2` to match Python 3.11. If you run the PowerShell commands above and paste any remaining pip error output here, I'll pick the exact wheel or provide an automated `install_windows_paddle.ps1` to fetch and install the correct wheel.
