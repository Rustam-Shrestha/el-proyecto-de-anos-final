# shredded_context.md — FinGuard Complete Reference

> Load before every task. 2000-3000 tokens. Complete project snapshot, architecture-first.

---

## PROJECT IDENTITY

**Name:** FinGuard — AI-Assisted Loan Default Prediction Platform  
**Purpose:** Assess loan repayment capacity for banked/unbanked populations in Nepal using Home Credit Default Risk dataset alignment  
**Scope:** KYC → Financial Portfolio → Document OCR → Risk Scoring → Admin Decision  
**Stack:** React 18.3 (Vite 8) + Express 5 + Python async (FastAPI) + Prisma 7 + PostgreSQL  
**Timeline:** College final-year project, ~3 months  
**Boundary:** Production-inspired architecture, NOT production-scale infrastructure (no live APIs, no enterprise queueing, no ML models in production)

---

## THREE-SERVICE ARCHITECTURE

```
┌─ frontend (React 18.3 + Vite 8 + TypeScript 6 + Redux Toolkit 2.12 + TanStack Query 5)
│ Port: dev 5173, prod: static
├─ backend-node (Express 5 + Prisma 7 + PostgreSQL + Zod 4 + pino logging)
│ Port: 3000 (or configured via ENV)
└─ backend-fastapi (Python async, likely uvicorn)
   Port: 8001 (internal extraction microservice only)
```

**CRITICAL BOUNDARY (NEVER VIOLATE):**
- **FastAPI:** Text extraction, OCR, face verification, table parsing, normalization → returns JSON only, NO database writes, NO business decisions, NO persistence
- **Node:** Everything else — auth, RBAC, portfolio verification, flagging, loan decisions, audit logging, all Prisma writes
- Blur = architecture failure. Reject on code review.

---

## COMPLETE FOLDER STRUCTURE

### backend-fastapi/
```
app/
  db/ Database connection (async SQLAlchemy, rarely used — stateless design preferred)
  extraction/ Text & OCR pipeline (CORE)
    text_extractor.py pdfplumber/python-docx/openpyxl native parsing (try FIRST)
    ocr_extractor.py PaddleOCR (primary) / EasyOCR (fallback) / Tesseract (last resort)
    table_parser.py Rule-based column mapping (deposit≈credit, withdraw≈debit, etc.)
    normalizer.py Currency/date/number cleanup, balance-chain validation
    __init__.py
  models/ Pydantic schemas (request/response contracts, NOT ORM)
    base.py
    document.py
    face_verification.py
    kyc.py
    ocr_result.py
    user.py
    __init__.py
  routes/ FastAPI routers (thin layer)
    financial_ocr.py POST /ocr/extract-document, POST /ocr/verify-face
    kyc.py
    __init__.py
  services/ Orchestration layer
    ocr_service.py Engine selection, pipeline coordination
    financial_ocr_service.py Bank-statement-specific workflow
    financial_extraction_service.py Field extraction + post-processing
    identity_service.py Face verification (KYC selfie vs ID)
  __init__.py
scripts/
  download_ocr_models.ps1 Model initialization
  run_backend.ps1
main.py FastAPI app creation, router registration, startup/shutdown
```

**Contract:** POST request with file path → async processing → returns `{ bankMeta, transactions[], extractedFields, parsingConfidence, rawExtractedText, needsManualMapping? }` → response time <2s (text PDF) or <20s (OCR, hard timeout).

---

### backend-node/
```
src/
  controllers/ Request handlers (try/catch → next(error), audit logging)
    adminController.ts Admin stats, user management
    documentController.ts Generic document upload/list/delete
    employmentController.ts Employment info CRUD
    financialDocumentController.ts Portfolio-specific documents
    kycController.ts KYC application lifecycle
    loanController.ts Loan application + review
    portfolioController.ts User portfolio summary
    portfolioAdminController.ts Admin document verification workflow
    riskScoringController.ts Risk calculation endpoint
    userController.ts User profile updates
    healthController.ts Health check
  
  services/ Business logic (object literal, throw AppError, no try/catch)
    auditService.ts Log all sensitive actions (user, action, metadata, ip, ua)
    userService.ts User CRUD
    kycService.ts KYC application creation/status
    kycVerificationService.ts KYC review logic
    documentService.ts Document CRUD, versioning
    financialDocumentService.ts Portfolio doc upload/storage/expiry
    employmentService.ts Employment info persistence
    ocrService.ts FastAPI client wrapper
    documentExtractionService.ts Normalization + comparison orchestration
    extractionVerificationService.ts Declared vs extracted comparison
    faceService.ts Face verification wrapper + decision logic
    portfolioVerificationService.ts Verify documents + flag anomalies
    loanService.ts Loan application + EMI calculation
    loanAccountService.ts Track active loans, affect future eligibility
    riskService.ts Rule-based risk scoring (6 factors)
    riskScoringService.ts Risk endpoint wrapper
    homeCreditFeatureService.ts Calculate 7 core + 6 derived features (ML-ready)
    mailService.ts Email notifications
    kycSubmissionFileService.ts KYC file storage management
  
  routes/ Endpoint definitions (authenticate → authorize → validate → controller)
    index.ts Route registration
    authRoutes.ts
    userRoutes.ts
    kycRoutes.ts + kycSchemas.ts
    documentRoutes.ts + documentSchemas.ts
    employmentRoutes.ts + employmentSchemas.ts
    financialDocumentRoutes.ts (implied, likely merged)
    loanRoutes.ts + loanSchemas.ts
    portfolioRoutes.ts + portfolioSchemas.ts
    adminRoutes.ts
    schemas.ts Shared/base Zod schemas
  
  middleware/ Request processing (order matters in app.ts)
    authenticate.ts JWT token validation, user context injection
    rbac.ts Role-based access control (authorize(role1, role2, ...))
    requestValidation.ts Zod schema enforcement on routes
    upload.ts Multer configuration, file destination, size limits
    avatarUpload.ts Profile avatar upload specific
    rateLimiter.ts express-rate-limit configuration
    oauth2.ts OAuth2 flow (if used)
    errorHandler.ts Global error formatter (AppError → HTTP response)
    notFound.ts 404 handler
  
  jobs/ Async background tasks
    ocrProcessingJob.ts Queue/trigger OCR extraction on FinancialDocument upload
  
  config/
    database.ts Prisma client singleton
    env.ts Environment variable validation (Zod or dotenv)
    logger.ts pino logger configuration
  
  utils/
    apiResponse.ts Response formatter (success/error/paginated)
    AppError.ts Custom error class (message, statusCode, details)
    pagination.ts Pagination helpers (page, limit, skip, total)
    pathUtils.ts File path management
  
  types/
    custom.d.ts Global type augmentations
    express.d.ts Express request augmentations (userData, etc.)
  
  app.ts Express app setup, middleware chain
  server.ts Server start (app listen)
  seed.ts Database seeding (optional)

prisma/
  schema.prisma 24 models, all in schema "auth"
  migrations/ History of schema changes

scripts/
  reset-db.ts Database reset helper
```

**Pattern (every domain):**
```
routes/{domain}Routes.ts + {domain}Schemas.ts
  ↓
controllers/{domain}Controller.ts (named exports, try/catch, audit log)
  ↓
services/{domain}Service.ts (object literal, throw AppError)
  ↓
Prisma models in schema.prisma
```

**Role Model:** Strings, not enums. `User.roleId → Role.name` (`USER`, `ADMIN`, `REVIEWER`). Check via `authorize('ADMIN')` or `req.user.role === 'ADMIN'`.

---

### frontend/
```
src/
  app/
    ProtectedRoute.tsx Auth + permission gate (redirect to /auth or /403)
    RoleProtectedRoute.tsx Role-specific gate (e.g., block USER from /admin)
    router.tsx React Router v7 route definitions
    store.ts Redux store initialization
    queryClient.ts TanStack Query config (staleTime: 30s, retry: 1)
  
  components/
    common/ 25+ reusable primitives (barrel export in index.ts)
      Button/index.tsx
      Modal.tsx
      Input.tsx
      SelectField.tsx
      CustomFileUpload/index.tsx
      CustomCheckbox/index.tsx
      CustomRadioField/index.tsx
      CustomTableAccount/index.tsx
      CustomTableFooter/index.tsx
      CustomTextArea/index.tsx
      CustomTimePicker/index.tsx
      CutomDatePicker/index.tsx [sic — typo preserved from scaffold]
      MultiSelectDatePicker/index.tsx
      MultiSelectField/index.tsx
      QuestionField/index.tsx
      RichTextEditor/index.tsx
      ThemeCustomizer/index.tsx
      DesktopNav/index.tsx
      MobileNav/index.tsx
      LeftSidebar/index.tsx
      RightSidebar/index.tsx
      SkletonLoader/index.tsx [sic — typo preserved]
      TableView/index.tsx
      HeroSlider/index.tsx
      calender.tsx
      index.ts Barrel export
    
    document/
      DocumentUploadField.tsx
    
    forms/
      KycSubmitForm.tsx
    
    modals/
      ApproveKycModal.tsx
      RejectKycModal.tsx
    
    shared/ Newer parallel shared components (consolidating into common/)
      components/
        Button.tsx
        Modal.tsx
        FileUploadField.tsx
        DocumentStatusBadge.tsx
        SkeletonLoader.tsx
        converted/ Legacy conversions
      layouts/
        DashboardLayout.tsx
        MainLayout.tsx
      hooks/
        useModal.ts
        useToast.ts
      types/
        common.ts
      utils/
        roleUtils.ts
        validators.ts
      validation/
        authSchemas.ts
    
    page.tsx
    header.tsx
    footer.tsx
    user.tsx
    view.tsx
    ProtectedRoute.tsx
    PopMessage.tsx
    Input.tsx
    Button.tsx
    index.ts Barrel
  
  features/ CANONICAL domain modules (extend this, never src/pages/)
    auth/
      api/authApi.ts TanStack Query hooks (useLogin, useRegister, useRefresh, etc.)
      pages/
        LoginPage.tsx
        RegisterPage.tsx
      index.ts
    
    kyc/ Multi-step wizard + admin verification
      api/kycApi.ts Hooks: useSubmitKyc, useKycStatus, useApproveKyc, etc.
      components/
        KYCForm.tsx
        KYCList.tsx
        KYCDetailsModal.tsx
        KYCSubmissionForm.tsx
        KYCWizardSteps.tsx
        Step1Upload.tsx, Step2Processing.tsx, Step3Review.tsx, Step4FaceResult.tsx, Step5Report.tsx
        steps/
          Step1Identity.tsx, Step2Selfie.tsx, Step3Employment.tsx, Step4Income.tsx, Step5Review.tsx
      pages/
        KYCListPage.tsx, KYCStatusPage.tsx, KYCSubmitPage.tsx, UserKYCPage.tsx, UserKYCStatusPage.tsx
      index.ts
    
    loans/ Portfolio verification + loan application + risk scoring
      api/
        loansApi.ts Hooks: useLoanApplication, useLoanStatus, useLoanList, etc.
        employmentApi.ts
        portfolioApi.ts
      components/
        LoanApplicationForm.tsx
        LoanDetailsModal.tsx
        LoansList.tsx
        RiskScoreBadge.tsx
        RiskScoreDisplay.tsx
      pages/
        LoanApplicationPage.tsx
        LoanStatusPage.tsx
        LoanOfficerDashboardPage.tsx
        PortfolioPage.tsx
        admin/
          PortfolioAdminListPage.tsx
          PortfolioAdminDetailPage.tsx
      index.ts
    
    admin/
      api/adminApi.ts
      components/AdminStats.tsx
      pages/AdminDashboardPage.tsx
      index.ts
    
    dashboard/
      api/dashboardApi.ts
      pages/
        AdminDashboardPage.tsx
        ReportsPage.tsx
      index.ts
    
    profile/
      api/profileApi.ts
      components/ProfileForm.tsx
      pages/ProfilePage.tsx
      index.ts
    
    users/
      api/usersApi.ts
      components/
        UsersList.tsx
        UserFormModal.tsx
        DeleteUserModal.tsx
      hooks/
        useUsers.ts
        useUsersList.ts
      pages/UsersPage.tsx
      index.ts
  
  pages/ LEGACY (do not extend — consolidate into features/)
    auth/, kyc/, portfolio/, document/, admin/, user/ Duplicate of features/
  
  helper/ DEAD BOILERPLATE (carryover from original scaffold)
    timesheetFormatters.ts ← unused, flag for removal
    periodicService.ts ← unused, flag for removal
    addressFields.tsx
    exportToExcel.tsx
    numberFormatters.ts
    index.tsx
  
  hooks/ Cross-cutting hooks (complements feature-level hooks)
    useApiQuery.ts TanStack Query wrapper (fetch)
    useKyc.ts
    useDocument.ts
    useAdmin.ts
    useUser.ts
    usePagination.ts
    useToast.ts
    useUI.ts Redux useUI hook
    useFormValidation.ts
    useConfirmation.ts
    useDebounce.tsx
    useClickOutside.tsx
    reduxHooks.ts useAppDispatch, useAppSelector typed wrappers
  
  services/ API client + endpoints
    endpoints/index.ts Single source of truth for all API URLs (NEVER hardcode URLs in components)
    authService.ts
    documentService.ts
    kycService.ts
    portfolioService.ts
    userService.ts
    adminService.ts
    queryClient.ts TanStack Query client configuration
    withApiCall.tsx LEGACY HOC (migrate to useApiQuery on touch)
  
  store/ Redux Toolkit (cross-cutting global state only)
    store.ts
    hooks.ts useAppDispatch, useAppSelector
    slices/
      accountSlice.ts selectedAccount, filters, pagination, modals
      uiSlice.ts theme, notifications, modal content
  
  types/ TypeScript definitions
    admin.ts
    auth.ts
    document.ts
    financial.ts
    kyc.ts
    user.ts
    legacy-modules.d.ts Type definitions for dead modules (remove when deleting them)
    lucide-react.d.ts
  
  utils/
    constants.ts
    validation.ts
  
  assets/styles/global.css
  vite-env.d.ts
  main.tsx React entrypoint
```

**Key:** `src/features/{domain}/` is canonical, `src/pages/` is legacy/debt, `src/helper/` and dead boilerplate like `timesheetService.ts` should be flagged for removal.

---

## DATABASE SCHEMA (Prisma, PostgreSQL, schema "auth")

**24 models, all mapped to `auth` schema:**

### Enums
```
DocumentType: SALARY_SLIP, BANK_STATEMENT, INCOME_CERT, BUSINESS_REG, INCOME_LETTER, ...
DocumentVerificationStatus: PENDING, VERIFIED, REJECTED, FLAGGED_REVIEW, NEEDS_RESUBMISSION
LoanStatus: SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED
LoanPurpose: HOME, EDUCATION, BUSINESS, PERSONAL
RiskLevel: LOW, MEDIUM, HIGH
```

### Core Auth (5 models)
```
Role(id, name unique, createdAt, updatedAt) @@map("roles")
User(id, email unique, passwordHash, roleId FK, isVerified, isDeleted, ...)
Profile(id, userId unique FK, fullName, phone, address, dateOfBirth, avatarUrl, ...)
Session(id, userId FK, refreshTokenHash, isRevoked, expiresAt, ...)
AuditLog(id, userId nullable FK, action, metadata JSON, ip, userAgent, createdAt)
```

### KYC Flow (5 models)
```
KycApplication(id, userId FK, status, submittedAt, reviewedAt, reviewerId, rejectionReason, ...)
OCRResult(id, kycApplicationId unique FK, documentType, rawOcrText, extractedData JSON, confidence, ...)
FaceVerification(id, kycApplicationId unique FK, similarityScore 0-1, status, recommendation, ...)
VerificationReport(id, kycApplicationId unique FK, faceSimilarity, ocrConfidence, fieldsCorrected, ...)
KYCSubmissionFile(id, kycApplicationId FK, filePath, fileSize, uploadedAt, isExpired, ...)
```

### Document Management (6 models)
```
Document(id, userId FK, kycId nullable FK, type, filePath, mimeType, sizeBytes, isDeleted, version, ...)
DocumentVersion(id, documentId FK, filePath, version, createdAt)
FinancialDocument(id, userId FK, documentType, filePath, ocrStatus, extractedFields JSON, ...)
OcrExtraction(id, financialDocumentId FK, rawOcrText, extractedData JSON, confidence, ...)
ExtractionVerification(id, userId FK, comparisonResult JSON, anomalyFlags string[], flagCount, ...)
ManualReviewQueue(id, documentId FK, priority, reason, createdAt, assignedTo nullable, resolvedAt, ...)
```

### Portfolio (5 models)
```
EmploymentInfo(id, userId unique FK, employmentStatus enum, occupationJobTitle, employerName,
               employmentStartDate, monthlyGrossIncome, monthlyNetIncome, dependentsCount, ...)
PortfolioVerification(id, userId unique FK, verificationStatus, loanToIncomeRatio, emiToIncomeRatio,
                      incomePerDependent, overallRiskScore 0-100, riskLevel, ...)
LoanFeatures(id, userId unique FK, AMT_INCOME_TOTAL, AMT_CREDIT, DAYS_BIRTH, DAYS_EMPLOYED,
             AMT_ANNUITY, OCCUPATION_TYPE, CNT_CHILDREN, CREDIT_INCOME_PERCENT, ...)
BorrowerFeatures(id, userId unique FK, amtIncomeTotal, amtCredit, daysBirth, daysEmployed, ...)
LoanAccount(id, userId FK, loanId, principalAmount, outstandingBalance, monthlyEmi, status, ...)
```

### Loan (1 model)
```
LoanApplication(id, userId FK, requestedAmount, tenureMonths, purpose, calculatedEmi,
                status enum, riskScore 0-100, riskLevel enum, reviewedBy FK, reviewedAt, ...)
```

---

## STATE MANAGEMENT (Frontend)

**Three-layer state (non-negotiable):**

| Data | Owner | Trigger |
|---|---|---|
| **Server data** (users, KYC, loans, docs) | TanStack Query | API response, invalidation |
| **Cross-cutting UI** (auth, theme, modals) | Redux Toolkit | User actions, auth changes |
| **Ephemeral** (form values, filters, local toggles) | useState/useReducer | Component lifecycle |

**Anti-patterns:**
- ❌ Direct `axios` calls from component → Always use TanStack Query hook
- ❌ Server data in Redux → TanStack Query owns it
- ❌ Prop drilling 5+ levels → Extract Redux slice or context
- ❌ `useEffect` for data fetching → TanStack Query handles it

---

## CORE PRINCIPLES & GUARDRAILS

### 1. Boundary Enforcement
- **FastAPI:** Extraction only. No DB writes. No decisions. Stateless.
- **Node:** Everything else. All business logic, all verification, all persistence.
- Violation = architecture failure.

### 2. Verification Philosophy
- OCR/AI extracts and compares. Never approves/rejects.
- Every mismatch is flagged, never silently resolved.
- Human (ADMIN/REVIEWER) always makes final call. Audit-logged.
- Raw data always retained for audit trail.

### 3. Document Handling
- Multiple proof types per income type (salaried ≠ self-employed ≠ student).
- Text-layer documents skip OCR entirely (speed).
- OCR always async, never blocks upload response.
- Timeout-capped (< 20s hard cap).

### 4. Code Organization
- **Search → Reuse → Extend → Create.** Check existing service/component before writing new.
- Feature domains are isolated (`features/{domain}/`), never cross-import.
- Boilerplate leftovers (`timesheetService.ts`, `pages/`) are migration debt — flag for removal on touch.
- No hardcoded URLs (all in `services/endpoints/index.ts`).
- No hardcoded permission strings (use `authorize(role)` middleware).

### 5. Frontend Consolidation
- **Canonical:** `src/features/{domain}/`
- **Legacy:** `src/pages/` (duplicate, do not extend)
- **Dead:** `src/helper/`, `timesheetService.ts`, `withApiCall.tsx`, boilerplate

### 6. ML/Risk Scoring
- **Current:** Rule-based (6 factors in `riskService.ts`).
- **Features:** 7 core + 6 derived (Home Credit-aligned), stored in `LoanFeatures`/`BorrowerFeatures`.
- **Deferred:** XGBoost/CatBoost. Infrastructure ready, not implemented.

### 7. Role Model
- **String-based:** `USER`, `ADMIN`, `REVIEWER` (not enums, not bitmask).
- Check via `authorize('ADMIN')` or `req.user.role === 'ADMIN'`.
- **Not used:** The uploaded boilerplate's `M`/`SM`/`A` constants pattern — that's old project, ignore.

### 8. File Management
- Uploaded files stored at `/uploads/{domain}/{userId}/{type}/{timestamp}_{filename}`.
- Static-served via Express.
- Versioning tracked via `DocumentVersion` model.
- Soft-delete (mark `isDeleted: true`), never hard-delete (audit trail).

### 9. Error Handling
- Services throw `AppError(message, statusCode, details)`.
- Controllers catch, format via `middleware/errorHandler.ts`.
- User-facing via `apiResponse.error(message, code)`.
- Log via pino, never console.log.

### 10. Testing & Validation
- Backend: Zod schemas in every route (validated at middleware layer).
- Frontend: RHF + Zod resolvers (same schemas, independently defined per side).
- End-to-end: 5 mock personas (salaried, self-employed, student, unemployed, high-risk).

---

## QUICK LAUNCH CHECKLIST

Before starting any feature:

- [ ] Identify the domain (kyc/loan/portfolio/document/auth/etc.)
- [ ] Check `services/{domain}Service.ts` + `controllers/{domain}Controller.ts` → extend, don't duplicate
- [ ] Check `features/{domain}/` in frontend → extend it
- [ ] New model? → Add to Prisma, migrate, regenerate
- [ ] File extraction? → Check `backend-fastapi/app/extraction/` first
- [ ] Verification/flagging? → Check `extractionVerificationService.ts`, `ManualReviewQueue`
- [ ] Frontend route? → Use `ProtectedRoute` or `RoleProtectedRoute` guard
- [ ] New endpoint? → Define Zod schema in `{domain}Schemas.ts`, middleware validates it
- [ ] API URL? → Add to `services/endpoints/index.ts` (single source of truth, never hardcode)
- [ ] Audit-log this action? → Call `auditService.log()` from controller
- [ ] File upload? → Use `middleware/upload.ts` (Multer configured, size-limited)

---

**Last updated:** 2026-07-26 (from 37k-line repomix)  
**Regenerate only on structural/architectural change.**