FinGuard Frontend: OCR & Face UI Guide

Location: `frontend/src/features/kyc`

Purpose
This document explains the frontend integration for the KYC module (OCR + face verification). It covers UI components used, validation, state management, routing, and run instructions.

Key components used
- `InputField`: reusable text input with built-in label and error state
- `CustomTextArea`: reusable textarea control
- `PrimaryButton`, `SecondaryButton`, `FileUploadButton`: common action controls
- `Modal`: shared modal component for async flows and confirmations
- `useKYC` hook: encapsulates API calls and TanStack Query state

Pages
- `KYCPage` (features/kyc/pages/KYCPage.tsx): page wrapper that mounts the KYC flow
- `KYCForm` (features/kyc/components/KYCForm.tsx): multi-step form using reusable components

Form Validation
- Step 1 uses `react-hook-form` + `zod` to validate fields (name, email, address, phone)
- File uploads are validated client-side by checking file presence and by server-side checks

State Management
- `useKYC` uses TanStack Query for polling KYC status and useMutation for uploads/verify calls
- Global auth and UI state read via Redux hooks for navigation and theme

Routing
- The KYC page is registered at `/app/kyc` in the router
- Header navigation includes an entry for `KYC` linking to `/app/kyc`

How the UI triggers backend
- `uploadDocument()` (kycApi) posts multipart/form-data to `POST /api/v1/kyc/upload`
- `verifyFace()` posts verification request to `POST /api/v1/kyc/verify`
- `getKYCStatus()` polls `GET /api/v1/kyc/status/{kyc_application_id}`

Running locally (quick steps)

1. Start PostgreSQL (see backend README or use Docker):

```bash
# using Docker
docker run --name kyc-postgres -e POSTGRES_USER=kyc_user -e POSTGRES_PASSWORD=kyc_password -e POSTGRES_DB=kyc_db -p 5432:5432 -d postgres:15
```

2. Backend (from project root):

```bash
cd backend-fastapi
python -m venv .venv
# On Windows
.venv\Scripts\activate
pip install -r requirements.txt
# copy and update .env
cp ..\.env.example .env
# Run migration or rely on async init
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

3. Frontend (from project root):

```bash
cd frontend
npm install
# create .env.local with VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

4. Access the app in the browser:
- Frontend: http://localhost:5173
- Backend docs & health: http://localhost:8000/docs and /health

Notes
- The frontend uses project-wide reusable UI components; avoid raw HTML inputs unless implementing a new custom widget.
- `KYCForm` uses `FileUploadButton` which internally handles the file input element.
- For production set `VITE_API_BASE_URL` to your backend host and ensure CORS is configured.

Troubleshooting
- If uploads fail, check `backend-fastapi` logs for file save errors and CORS.
- If the KYC nav item doesn't appear, ensure user permissions include KYC or `isDisable` flag is false in nav config.

Files to review
- `frontend/src/features/kyc/components/KYCForm.tsx`
- `frontend/src/features/kyc/hooks/useKYC.ts`
- `frontend/src/features/kyc/api/kycApi.ts`
- `docs/backend-node/kyc/DOCS_KYC.md` (detailed backend docs)

