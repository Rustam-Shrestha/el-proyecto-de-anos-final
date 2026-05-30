# Backend FastAPI (Python)

Folder structure (full):
```
backend-fastapi/
├─ main.py
├─ app/
│  ├─ config.py
│  ├─ api/
│  │  └─ v1/
│  │     └─ endpoints/
│  ├─ db/
│  │  └─ __init__.py
│  ├─ services/
│  └─ models/
```

Import rules:
- Always import from the `app` package root (e.g. `from app.models import User`).
- Never import with repository-relative paths like `backend-fastapi.*`.

Pydantic settings (example `app/config.py`):
```py
from pydantic import BaseSettings

class Settings(BaseSettings):
	DATABASE_URL: str
	UPLOAD_DIR: str = 'uploads/kyc'

settings = Settings()
```

Async SQLAlchemy:
- Keep engine/session in `app/db/` and pass sessions into service functions.

KYC/identity/OCR ownership:
- `app/services/identity_service.py` and `app/services/ocr_service.py` hold ML model calls and DB orchestration.

Run command (Windows script provided):
```
./backend-fastapi/scripts/run_backend.ps1 -Reload
```

FastAPI dependency guidance:
- Use explicit versions in `requirements.txt` and pin for reproducible builds (e.g., `fastapi~=0.95`, `sqlalchemy[asyncio]~=1.4`).

Endpoint registration:
- All v1 endpoints live under `app/api/v1/` and are included in `main.py` with `app.include_router(...)`.

Rules (short):
- Validate inputs with Pydantic models
- Keep DB I/O asynchronous and inside services

