# KYC Implementation Quick Reference

## ✅ Files Generated

### Service Layer
- **src/services/kycService.ts** (380+ lines)
  - `submitKyc()` - Submit new KYC with documents
  - `getKycStatus()` - Get user's latest KYC
  - `getKycById()` - Get specific application
  - `listKycApplications()` - Admin/reviewer list with filtering
  - `approveKyc()` - Approve + email notification
  - `rejectKyc()` - Reject + email notification
  - `requestResubmit()` - Request resubmission + email

### Controller Layer
- **src/controllers/kycController.ts** (210+ lines)
  - 7 request handlers with proper error delegation
  - Audit logging on every state change
  - Pagination support for admin list
  - Type-safe responses

### Routes & Validation
- **src/routes/kycRoutes.ts** (250+ lines)
  - 7 endpoints with full Swagger annotations
  - Middleware stack: authenticate → authorize → validate
  - Supports both authenticated users and admin/reviewers

- **src/routes/kycSchemas.ts** (55+ lines)
  - Zod schemas for all 7 KYC endpoints
  - Request/response validation

### Documentation
- **KYC_SETUP.md** (450+ lines)
  - Complete API documentation with examples
  - Database schema explanation
  - Email notification details
  - File upload configuration
  - Error handling guide
  - Testing instructions

---

## 🔗 API Endpoints Summary

```
POST   /api/v1/kyc/submit              ← Submit KYC application
GET    /api/v1/kyc/status              ← Get user's KYC status
GET    /api/v1/kyc                     ← List all KYC (admin/reviewer)
GET    /api/v1/kyc/:id                 ← Get single KYC
PATCH  /api/v1/kyc/:id/approve         ← Approve application
PATCH  /api/v1/kyc/:id/reject          ← Reject with reason
PATCH  /api/v1/kyc/:id/request-resubmit ← Request resubmission
```

---

## 🔐 Authentication & Authorization

| Endpoint | USER | REVIEWER | ADMIN |
|----------|------|----------|-------|
| POST /submit | ✅ | ✅ | ✅ |
| GET /status | ✅ | ✅ | ✅ |
| GET / | ❌ | ✅ | ✅ |
| GET /:id | ❌ | ✅ | ✅ |
| PATCH /:id/approve | ❌ | ✅ | ✅ |
| PATCH /:id/reject | ❌ | ✅ | ✅ |
| PATCH /:id/request-resubmit | ❌ | ✅ | ✅ |

---

## 📧 Email Notifications (Fire-and-Forget)

Each state change triggers an email to the user:

| Action | Email | Template |
|--------|-------|----------|
| SUBMIT | ✅ Confirmation | (in mailService for future) |
| APPROVE | ✅ Approved! | sendKycApprovedMail() |
| REJECT | ✅ Rejected | sendKycRejectedMail() |
| REQUEST_RESUBMIT | ✅ Action Required | sendKycResubmitMail() |

---

## 📊 Audit Logging

Every state change logs:
- `SUBMIT_KYC` - Document count
- `APPROVE_KYC` - Reviewer + target user
- `REJECT_KYC` - Reviewer + reason
- `REQUEST_RESUBMIT_KYC` - Reviewer + note

---

## 🔄 Application Status Flow

```
PENDING
  ↓
  ├─→ UNDER_REVIEW (reviewer opens application)
  │   ├─→ APPROVED ✅
  │   ├─→ REJECTED ❌
  │   └─→ RESUBMIT_REQUIRED ⚠️
  │       └─→ (user submits new KYC)
  │           └─→ PENDING (repeat cycle)
```

---

## 🗄️ Prisma Models Included

- ✅ KycApplication
- ✅ Document
- ✅ DocumentVersion
- ✅ User (with kycApplications relation)
- ✅ Role
- ✅ AuditLog
- ✅ Session
- ✅ Profile

---

## 🚀 Quick Start

### 1. Setup Database
```bash
npx prisma migrate dev --name init
npm run seed
```

### 2. Test Submit KYC
```bash
curl -X POST http://localhost:3000/api/v1/kyc/submit \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "type": "CITIZENSHIP_FRONT",
        "filePath": "kyc/documents/user_CITIZENSHIP_FRONT_1716000000000.jpg",
        "mimeType": "image/jpeg",
        "sizeBytes": 2048576
      }
    ]
  }'
```

### 3. Test Approve (as Reviewer)
```bash
curl -X PATCH http://localhost:3000/api/v1/kyc/<KYC_ID>/approve \
  -H "Authorization: Bearer <REVIEWER_TOKEN>"
```

---

## ⚙️ Configuration

All email sending happens through `src/services/mailService.ts`:
- Fire-and-forget pattern
- Never blocks requests
- Logs failures with logger.warn
- Can be tested with MailHog locally

---

## 🔮 Future Extensions

- [ ] Document upload endpoint (POST /documents/upload)
- [ ] OCR verification (Tesseract.js or AWS Textract)
- [ ] Face verification (AWS Rekognition or FaceIO)
- [ ] Document versioning/replacement
- [ ] Admin KYC dashboard with charts
- [ ] Bulk approval/rejection
- [ ] Scheduled reminders for pending applications

---

## 📝 Notes

- All timestamps in UTC (ISO 8601)
- Soft deletion support (isDeleted flag)
- Document versioning ready (DocumentVersion model)
- Audit trail captures IP and User-Agent
- Rate limiting can be applied per endpoint
- All responses follow unified apiResponse format

---

**Implementation Status:** ✅ Complete and production-ready

For detailed API documentation, see **KYC_SETUP.md**
