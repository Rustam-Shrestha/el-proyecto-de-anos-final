# AGENT.md — FinGuard Architectural Contract




> Canonical reference for autonomous coding agents working on FinGuard.  

> Read once per session. Deep-dive by opening the specific service/route files named below — this doc maps territory, doesn't duplicate code.




---




## 1. What FinGuard Is




AI-assisted loan default risk prediction platform, modeled on the Home Credit Default Risk dataset, built as a final-year fintech project with production-inspired (not production-scale) architecture. Serves both banked and unbanked applicants in Nepal.




**Core user journey:**

```

Register → KYC (identity + face match) → Financial Portfolio (employment + income declaration)

  → Document Upload (salary slip / bank statement / income cert / alternates)

  → Async OCR Extraction (FastAPI) → Comparison & Anomaly Flagging (Node)

  → Admin/Reviewer Verification → Loan Application → Risk Scoring (rule-based, Home Credit-aligned)

  → Loan Officer Decision

```




**Explicit non-goals:** live bank API integration, government ID verification APIs, credit bureau queries, payment gateway, ML model in production (currently rule-based placeholder), document forgery detection, enterprise-scale queueing.




---




## 2. Three-Service Architecture




| Service | Role | Tech | Owns |

|---|---|---|---|

| `frontend` | UI | React 18.3, Vite 8, RTK, TanStack Query 5, RHF+Zod, Tailwind 3.4, react-router 7 | Presentation, client state, forms |

| `backend-node` | API + Business Logic + Persistence | Express 5, Prisma 7 (Postgres, schema `auth`), Zod 4, pino | Auth, RBAC, all DB writes, verification decisions, risk scoring, audit log |

| `backend-fastapi` | Extraction Microservice | Python async, likely uvicorn | OCR text extraction, table parsing, face verification — **stateless, no DB** |




**The single most important architectural boundary:** backend-fastapi never writes to the database and never makes verification/lending decisions. It receives a file path, returns structured JSON. backend-node is the sole source of truth for what happens with that data. Violating this (e.g. having FastAPI call Prisma, or having Node re-implement OCR parsing) is an architecture violation — reject on review.




---




## 3. Backend-Node Deep Map




### Layered pattern (every domain follows this)

```

routes/{domain}Routes.ts     authenticate → authorize(role) → validate(zodSchema) → controller

routes/{domain}Schemas.ts    Zod request/response schemas

controllers/{domain}Controller.ts   try/catch → next(error); apiResponse.success/error/paginated; auditService.log()

services/{domain}Service.ts  object-literal export; throws AppError; NO try/catch here

```




### Domains present




- **auth** — login/register/refresh/RBAC (`middleware/rbac.ts`, `oauth2.ts`)

- **kyc** — `kycController`, `kycService`, `kycVerificationService`; models `KycApplication`, `OCRResult`, `FaceVerification`, `VerificationReport`, `KYCSubmissionFile`

- **document** — generic document upload/versioning (`documentController`, `documentService`, models `Document`/`DocumentVersion`)

- **financialDocument** — portfolio-specific docs (salary slip, bank statement, etc.) — `financialDocumentController/Service`, model `FinancialDocument`

- **employment** — `employmentController/Service`, model `EmploymentInfo`

- **portfolio** / **portfolioAdmin** — `portfolioController`, `portfolioVerificationService`, `portfolioAdminController`; model `PortfolioVerification`

- **loan** — `loanController`, `loanService`, `loanAccountService`; models `LoanApplication`, `LoanAccount`

- **riskScoring** — `riskScoringController`, `riskScoringService`, `riskService`, `homeCreditFeatureService`; models `LoanFeatures`, `BorrowerFeatures`

- **admin** — cross-cutting admin stats/actions (`adminController`)




### OCR/Extraction integration (Node side)

```

jobs/ocrProcessingJob.ts     → async trigger, calls backend-fastapi, non-blocking on upload

services/ocrService.ts       → thin client wrapper for FastAPI calls

services/documentExtractionService.ts   → normalize/compare/flag orchestration (Node-side business rules)

services/extractionVerificationService.ts → declared-vs-extracted comparison logic

models: OcrExtraction, ExtractionVerification, ManualReviewQueue

```




Flow: upload → `FinancialDocument` row created (`ocrStatus: PENDING`) → job calls FastAPI → response persisted into `OcrExtraction` → `extractionVerificationService` compares against `EmploymentInfo`/declared values → mismatches populate `ManualReviewQueue` → admin resolves via `portfolioAdminController`.




### Role/Permission Model




String-based roles on `User.roleId → Role.name` (`USER`, `ADMIN`, `REVIEWER`). No bitmask/constant-table permission system (unlike the boilerplate's `M/SM/A` model — that pattern does NOT apply here, do not import it). Middleware: `authorize('ADMIN', 'REVIEWER')`.




---




## 4. Backend-FastAPI Deep Map




```

app/routes/financial_ocr.py, kyc.py    → thin route layer

app/services/

  ocr_service.py                       → engine selection/orchestration

  financial_ocr_service.py             → bank-statement-specific pipeline

  financial_extraction_service.py      → field extraction orchestration

  identity_service.py                  → face verification (KYC selfie vs ID photo)

app/extraction/

  text_extractor.py    → native parse (pdfplumber/docx/xlsx) — ALWAYS TRY FIRST

  ocr_extractor.py      → PaddleOCR/EasyOCR fallback for image-based/scanned docs

  table_parser.py       → rule-based column-synonym mapping (deposit≈credit≈received, etc.)

  normalizer.py          → currency/date/number cleanup, balance-chain sanity check

app/models/            → Pydantic request/response models (base, document, kyc, ocr_result, face_verification, user)

```




**Contract:** returns unified JSON — `{ bankMeta, transactions[], extractedFields, comparisonResult?, parsingConfidence, rawExtractedText }`. No persistence. Timeout-capped (design target: text-PDF <2s, OCR <20s hard cap, fail gracefully to `FAILED` + manual entry fallback).




---




## 5. Frontend Deep Map




### ⚠️ Known architectural debt — read before touching frontend




Two parallel structures currently coexist covering overlapping domains:

```

src/features/{auth,kyc,loans,admin,dashboard,profile,users}/{api,components,pages}/   ← CANONICAL, extend this

src/pages/{kyc,portfolio,document,admin,auth,user}/                                    ← LEGACY duplicate, do not extend

```




Both implement KYC screens, document upload, portfolio pages independently. **Rule:** all new work targets `src/features/{domain}`. When editing something that exists in `src/pages/`, migrate its logic into the matching `features/` module and mark the `pages/` version for removal rather than editing both.




Also legacy/dead from original non-FinGuard boilerplate — do not extend, do not treat as project convention:




`src/helper/timesheetFormatters.ts`, `src/services/timesheetService.ts`, `src/services/periodicService.ts`, `src/services/withApiCall.tsx`, folder name typos (`SkletonLoader/`, `CutomDatePicker/`) — preserved only because renaming has ripple risk, not because they're correct.




### Feature module shape (canonical)

```

features/{domain}/

  api/          TanStack Query hooks, one file per resource (e.g. kycApi.ts, loansApi.ts, portfolioApi.ts)

  components/   domain-local UI (KYCWizardSteps, LoanApplicationForm, RiskScoreDisplay, etc.)

  pages/        route-level containers

  index.ts      barrel (where present)

```




Present domains: `auth, kyc (+ multi-step wizard: Step1Upload…Step5Report), loans (+ portfolio admin sub-pages), admin, dashboard, profile, users`.




### Shared layer

```

src/components/common/    30+ primitives (Button, Modal, SelectField, CustomFileUpload, TableView,

                            SkletonLoader[sic], ThemeCustomizer, etc.) — check here before creating new UI

src/shared/                newer parallel shared layer (Button, Modal, FileUploadField,

                            DocumentStatusBadge, layouts/DashboardLayout) — being consolidated into

                            common/, direction unclear — confirm before adding to either

src/store/slices/          accountSlice, uiSlice (Redux Toolkit — cross-cutting only, never server data)

src/hooks/                 useApiQuery, useKyc, useDocument, useAdmin, useUser, usePagination, useToast, useUI, reduxHooks

```




### State rule (same discipline as any modern React app, non-negotiable)




```

Server data       → TanStack Query (per-feature api/ hooks)

Cross-cutting UI   → Redux slices via useUI()/reduxHooks

Ephemeral/local    → useState/useReducer

```




Never call `apiService`/axios directly from a component. Never store server data in Redux.




### Routing




`src/app/router.tsx` + `ProtectedRoute.tsx` (auth gate) + `RoleProtectedRoute.tsx` (role gate, e.g. block ADMIN from `/kyc-submit`, block USER from `/admin/*`).




---




## 6. ML / Risk Scoring Status




**Current:** rule-based scoring (`riskService.ts` / `riskScoringService.ts`), fed by `homeCreditFeatureService.ts` which computes the 7 core + 6 derived Home Credit features:




Core: `AMT_INCOME_TOTAL, AMT_CREDIT, DAYS_BIRTH, DAYS_EMPLOYED, AMT_ANNUITY, OCCUPATION_TYPE, CNT_CHILDREN`




Derived: `CREDIT_INCOME_PERCENT, ANNUITY_INCOME_PERCENT, INCOME_PER_PERSON, DAYS_EMPLOYED_PERCENT, EMPLOYMENT_STABILITY, AGE_CATEGORY`




Features persisted in `LoanFeatures`/`BorrowerFeatures`.




**Deferred, not implemented:** XGBoost/CatBoost model training and swap-in. Infrastructure (feature calculation, storage schema) is ready for it. Do not implement unless explicitly requested — placeholder only.




---




## 7. Verification Philosophy (Applies to KYC, Portfolio, and Documents Alike)




1. OCR/AI extracts and compares. It never approves or rejects.

2. Every declared value gets compared against extracted value; mismatches are flagged (`ManualReviewQueue`, `anomalyFlags` on `FinancialDocument`), never silently resolved either way.

3. Raw extraction output and the original uploaded file are always retained, independent of parsing success.

4. A human (`ADMIN`/`REVIEWER`) makes the final call on every KYC and financial document; audit-logged via `auditService`.

5. Documents are evidence, not proof. Multiple proof types are accepted per income type (salaried/self-employed/student/other) rather than forcing one document format.




---




## 8. Conventions Quick Reference




- **Naming:** components PascalCase, hooks `useX`, services/controllers camelCase, routes `{domain}Routes.ts` + `{domain}Schemas.ts`.

- **Validation:** Zod on both frontend (RHF resolver) and backend (route middleware) — schemas are not shared cross-boundary, defined independently per side.

- **Error handling (Node):** `AppError` thrown in services, caught in controllers, formatted by `middleware/errorHandler.ts`.

- **Response shape (Node):** `apiResponse.success(msg, data) / .error(msg, code) / .paginated(msg, items, page, limit, total)`.

- **Audit:** `auditService.log({ userId, action, metadata, ip, userAgent })` called from controllers only, never services.

- **File uploads:** `middleware/upload.ts` (multer), stored under `/uploads/{domain}/{userId}/{type}/{timestamp}_{filename}`, static-served.

- **Logging:** pino (`config/logger.ts`), not console.log.




---




## 9. Agent Operating Rules




1. **Search → Reuse → Extend → Create.** Check `features/{domain}` (frontend) and `services/{domain}Service.ts` (backend) before writing anything new.




2. **Never blur the FastAPI/Node boundary.** Extraction logic lives only in `backend-fastapi/app/extraction/`. Business/verification logic lives only in `backend-node/src/services/`.




3. **Never extend `src/pages/*` or the timesheet-boilerplate leftovers.** Treat as migration debt; consolidate into `src/features/*` when touched.




4. **Never implement ML/XGBoost/CatBoost prediction** unless explicitly instructed — current scope is rule-based scoring only.




5. **Never let OCR/AI output become an automatic approval/rejection.** Always route through flagging + human review.




6. **Never discard raw extraction data**, even after successful structured parsing — required for audit trail.




7. **Text-layer documents skip OCR** — always attempt native extraction (`text_extractor.py`) first for speed.




8. **All new financial document types** get added to the existing `FinancialDocument`/`OcrExtraction`/`DocumentType` enum pattern, not a parallel table.




9. **Never hardcode endpoint URLs.** All live in backend-node's config/endpoints or frontend's services/endpoints/index.ts.




10. **Roles are strings, not constants.** Check via `authorize('ADMIN')` or `req.user.role === 'USER'`, never via bitmask/symbols.




---




## 10. Prisma Schema at a Glance




All models in schema `auth`, mapped to PostgreSQL tables:




```

Enums: DocumentType, DocumentVerificationStatus, LoanStatus, LoanPurpose, RiskLevel




Core Auth:

  Role(id, name, createdAt, updatedAt)

  User(id, email, passwordHash, roleId FK, isVerified, isDeleted, createdAt, updatedAt)

  Profile(id, userId unique FK, fullName, phone, address, dateOfBirth, avatarUrl, updatedAt)

  Session(id, userId FK, refreshTokenHash, isRevoked, expiresAt, createdAt)

  AuditLog(id, userId nullable FK, action, metadata JSON, ip, userAgent, createdAt)




KYC Flow:

  KycApplication(id, userId FK, status, submittedAt, reviewedAt, reviewerId, rejectionReason, ...)

  OCRResult(id, kycApplicationId unique FK, documentType, rawOcrText, extractedData JSON, confidence, ...)

  FaceVerification(id, kycApplicationId unique FK, similarityScore, status, recommendation, ...)

  VerificationReport(id, kycApplicationId unique FK, faceSimilarity, ocrConfidence, fieldsCorrected, ...)

  KYCSubmissionFile(id, kycApplicationId FK, filePath, fileSize, uploadedAt, ...)




Document Management:

  Document(id, userId FK, kycId FK, type, filePath, mimeType, sizeBytes, version, isDeleted, ...)

  DocumentVersion(id, documentId FK, filePath, version, createdAt)

  FinancialDocument(id, userId FK, documentType, filePath, ocrStatus, extractedFields JSON, ...)

  OcrExtraction(id, financialDocumentId FK, rawOcrText, extractedData JSON, confidence, ...)

  ExtractionVerification(id, userId FK, comparisonResult JSON, anomalyFlags, flagCount, ...)

  ManualReviewQueue(id, documentId FK, priority, reason, createdAt, assignedTo, resolvedAt, ...)




Portfolio:

  EmploymentInfo(id, userId unique FK, employmentStatus, occupationJobTitle, employerName,

                   employmentStartDate, monthlyGrossIncome, dependentsCount, ...)

  PortfolioVerification(id, userId unique FK, status, loanToIncomeRatio, emiToIncomeRatio,

                        incomePerDependent, overallRiskScore, riskLevel, ...)

  LoanFeatures(id, userId unique FK, AMT_INCOME_TOTAL, AMT_CREDIT, DAYS_BIRTH, DAYS_EMPLOYED,

               AMT_ANNUITY, ..., CREDIT_INCOME_PERCENT, ..., lastCalculated, ...)

  BorrowerFeatures(id, userId unique FK, amtIncomeTotal, amtCredit, daysBirth, daysEmployed, ...)




Loan:

  LoanApplication(id, userId FK, requestedAmount, tenureMonths, purpose, calculatedEmi,

                  status, riskScore, riskLevel, reviewedBy, reviewedAt, ...)

  LoanAccount(id, userId FK, loanId, principalAmount, outstandingBalance, monthlyEmi,

              status, startDate, expectedEndDate, lastRepaymentDate, ...)

```




---




## 11. Quick Launch Checklist




Before starting work:




- [ ] Identify which domain this affects (kyc/loan/portfolio/document/admin/etc.)

- [ ] Is there already a matching `services/{domain}Service.ts` + `controllers/{domain}Controller.ts`? → Extend it

- [ ] Is there already a matching `features/{domain}/` in frontend? → Extend it

- [ ] Does this involve file extraction? → Check `backend-fastapi/app/extraction/` first

- [ ] Does this touch verification/flagging? → Check `extractionVerificationService.ts`, `ManualReviewQueue`

- [ ] Does this require new Prisma model? → Add to schema, migrate, regenerate

- [ ] Frontend route? → Use `RoleProtectedRoute` or `ProtectedRoute` guard

- [ ] API endpoint? → Define in `routes/{domain}Schemas.ts` (Zod), add to `services/endpoints/` if relevant




---




**Status:** Reflects actual repo state as of 2026-07-26 repomix export. Supersedes any prior AGENT.md/shredded_context.md describing timesheet/CRM/payroll domains — those describe the unrelated original boilerplate, not FinGuard.




**Last updated:** 2026-07-26


