# KYC (Know Your Customer) System Documentation

## 📋 Overview

The KYC system manages user identity verification through document submission and review. It supports:

- **Document upload & storage** (citizenship, passport, selfies, etc.)
- **Application status tracking** (PENDING → APPROVED/REJECTED/RESUBMIT_REQUIRED)
- **Admin/Reviewer workflow** (list, review, approve, reject applications)
- **Email notifications** (submission confirmation, approval, rejection, resubmit requests)
- **Audit trail** (all state changes logged)

---

## 🔄 KYC Application Workflow

```
User submits documents
    ↓
Application created (status: PENDING)
    ↓
Email sent to user: "Application received"
    ↓
REVIEWER reviews documents
    ↓
    ├─→ APPROVE → sendKycApprovedMail → user has full access
    ├─→ REJECT → sendKycRejectedMail → must resubmit
    └─→ REQUEST_RESUBMIT → sendKycResubmitMail → fix issues and resubmit
```

---

## 🗄️ Database Schema

### KycApplication Table

```sql
CREATE TABLE kyc_applications (
  id              UUID PRIMARY KEY,
  userId          UUID FOREIGN KEY → users.id,
  status          VARCHAR (enum: PENDING, UNDER_REVIEW, APPROVED, REJECTED, RESUBMIT_REQUIRED),
  submittedAt     TIMESTAMP DEFAULT NOW(),
  reviewedAt      TIMESTAMP NULL,
  reviewerId      UUID NULL,
  rejectionReason VARCHAR(500) NULL,
  createdAt       TIMESTAMP DEFAULT NOW(),
  updatedAt       TIMESTAMP DEFAULT NOW()
);
```

### Document Table

```sql
CREATE TABLE documents (
  id            UUID PRIMARY KEY,
  userId        UUID FOREIGN KEY → users.id,
  kycId         UUID FOREIGN KEY → kyc_applications.id,
  type          VARCHAR (enum: CITIZENSHIP_FRONT, CITIZENSHIP_BACK, PASSPORT, SELFIE, OTHER),
  filePath      VARCHAR (e.g., kyc/documents/abc123_PASSPORT_1716000000000.pdf),
  mimeType      VARCHAR (e.g., image/jpeg),
  sizeBytes     INT,
  isDeleted     BOOLEAN DEFAULT FALSE,
  version       INT DEFAULT 1,
  createdAt     TIMESTAMP DEFAULT NOW()
);
```

### DocumentVersion Table

```sql
CREATE TABLE document_versions (
  id         UUID PRIMARY KEY,
  documentId UUID FOREIGN KEY → documents.id,
  filePath   VARCHAR,
  version    INT,
  createdAt  TIMESTAMP DEFAULT NOW()
);
```

---

## 📚 API Endpoints

### Submit KYC Application

**POST** `/api/v1/kyc/submit`

```http
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "documents": [
    {
      "type": "CITIZENSHIP_FRONT",
      "filePath": "kyc/documents/user123_CITIZENSHIP_FRONT_1716000000000.jpg",
      "mimeType": "image/jpeg",
      "sizeBytes": 2048576
    },
    {
      "type": "CITIZENSHIP_BACK",
      "filePath": "kyc/documents/user123_CITIZENSHIP_BACK_1716000000001.jpg",
      "mimeType": "image/jpeg",
      "sizeBytes": 2147483
    },
    {
      "type": "SELFIE",
      "filePath": "kyc/documents/user123_SELFIE_1716000000002.jpg",
      "mimeType": "image/jpeg",
      "sizeBytes": 3145728
    }
  ]
}

Response: 201
{
  "success": true,
  "message": "KYC application submitted successfully",
  "data": {
    "id": "kyc-uuid",
    "userId": "user-uuid",
    "status": "PENDING",
    "submittedAt": "2026-05-20T10:30:00Z",
    "reviewedAt": null,
    "reviewerId": null,
    "rejectionReason": null,
    "documents": [
      {
        "id": "doc-uuid",
        "type": "CITIZENSHIP_FRONT",
        "filePath": "kyc/documents/...",
        "mimeType": "image/jpeg",
        "sizeBytes": 2048576
      }
      // ... other documents
    ],
    "createdAt": "2026-05-20T10:30:00Z",
    "updatedAt": "2026-05-20T10:30:00Z"
  }
}
```

### Get KYC Status

**GET** `/api/v1/kyc/status`

```http
Authorization: Bearer <accessToken>

Response: 200
{
  "success": true,
  "message": "KYC status retrieved",
  "data": {
    "id": "kyc-uuid",
    "userId": "user-uuid",
    "status": "PENDING",
    "submittedAt": "2026-05-20T10:30:00Z",
    "documents": [ ... ]
  }
}
```

### List KYC Applications (Admin/Reviewer)

**GET** `/api/v1/kyc?page=1&limit=10&status=PENDING&search=john`

```http
Authorization: Bearer <adminToken>

Query Parameters:
  - page: integer (default: 1)
  - limit: integer (default: 10, max: 100)
  - status: enum (PENDING, UNDER_REVIEW, APPROVED, REJECTED, RESUBMIT_REQUIRED)
  - search: string (searches email and full name)

Response: 200
{
  "success": true,
  "message": "KYC applications listed successfully",
  "data": [
    {
      "id": "kyc-uuid",
      "status": "PENDING",
      "submittedAt": "2026-05-20T10:30:00Z",
      "user": {
        "id": "user-uuid",
        "email": "john@example.com",
        "profile": {
          "fullName": "John Doe"
        }
      },
      "documents": [ ... ]
    }
    // ... more applications
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

### Get Single KYC Application

**GET** `/api/v1/kyc/:id`

```http
Authorization: Bearer <adminToken>

Response: 200
{
  "success": true,
  "message": "KYC application retrieved",
  "data": { ... }
}
```

### Approve KYC Application

**PATCH** `/api/v1/kyc/:id/approve`

```http
Authorization: Bearer <reviewerToken>

Response: 200
{
  "success": true,
  "message": "KYC application approved",
  "data": {
    "id": "kyc-uuid",
    "status": "APPROVED",
    "reviewedAt": "2026-05-20T11:45:00Z",
    "reviewerId": "reviewer-uuid"
  }
}
```

**What happens:**
1. Status changed to APPROVED
2. reviewedAt timestamp set
3. reviewerId recorded
4. Email sent to user: "Your KYC has been approved!"
5. Audit log created: APPROVE_KYC

### Reject KYC Application

**PATCH** `/api/v1/kyc/:id/reject`

```http
Authorization: Bearer <reviewerToken>
Content-Type: application/json

{
  "rejectionReason": "Document quality is poor. Please submit clearer photos with good lighting."
}

Response: 200
{
  "success": true,
  "message": "KYC application rejected",
  "data": {
    "id": "kyc-uuid",
    "status": "REJECTED",
    "rejectionReason": "Document quality is poor...",
    "reviewedAt": "2026-05-20T11:45:00Z",
    "reviewerId": "reviewer-uuid"
  }
}
```

**What happens:**
1. Status changed to REJECTED
2. Rejection reason stored
3. reviewedAt timestamp set
4. Email sent: "Your KYC application was rejected"
5. Audit log created: REJECT_KYC

### Request KYC Resubmission

**PATCH** `/api/v1/kyc/:id/request-resubmit`

```http
Authorization: Bearer <reviewerToken>
Content-Type: application/json

{
  "note": "The selfie photo is too dark. Please provide a clear selfie with your face fully visible and good lighting."
}

Response: 200
{
  "success": true,
  "message": "Resubmission requested",
  "data": {
    "id": "kyc-uuid",
    "status": "RESUBMIT_REQUIRED",
    "rejectionReason": "The selfie photo is too dark...",
    "reviewedAt": "2026-05-20T11:45:00Z",
    "reviewerId": "reviewer-uuid"
  }
}
```

**What happens:**
1. Status changed to RESUBMIT_REQUIRED
2. Note stored in rejectionReason field
3. Email sent: "Your KYC needs more information"
4. Audit log created: REQUEST_RESUBMIT_KYC
5. User can submit new KYC application

---

## 📧 Email Notifications

### Approval Email
```
Subject: KYC Verification Approved
Body: Hi John,
      Your KYC application has been approved! You now have full access to all features.
      [Go to Dashboard]
```

### Rejection Email
```
Subject: KYC Verification Rejected
Body: Hi John,
      Your KYC application has been rejected.
      Reason: [rejection reason from reviewer]
      [Resubmit Application]
```

### Resubmit Request Email
```
Subject: Action Required: Resubmit KYC Application
Body: Hi John,
      Your KYC application requires resubmission. Please address the following:
      [Note from reviewer]
      [Resubmit KYC]
```

All emails are fire-and-forget (never block requests). If email fails, error is logged but request succeeds.

---

## 🔐 Access Control

| Endpoint | USER | REVIEWER | ADMIN |
|----------|------|----------|-------|
| POST /submit | ✅ | ✅ | ✅ |
| GET /status | ✅ | ✅ | ✅ |
| GET / (list) | ❌ | ✅ | ✅ |
| GET /:id | ❌ | ✅ | ✅ |
| PATCH /:id/approve | ❌ | ✅ | ✅ |
| PATCH /:id/reject | ❌ | ✅ | ✅ |
| PATCH /:id/request-resubmit | ❌ | ✅ | ✅ |

---

## 📊 Audit Logging

Every state change is logged to `audit_logs` table:

### Submit KYC
```json
{
  "action": "SUBMIT_KYC",
  "userId": "user-uuid",
  "metadata": {
    "kycId": "kyc-uuid",
    "documentCount": 3
  }
}
```

### Approve KYC
```json
{
  "action": "APPROVE_KYC",
  "userId": "reviewer-uuid",
  "metadata": {
    "kycId": "kyc-uuid",
    "targetUserId": "user-uuid"
  }
}
```

### Reject KYC
```json
{
  "action": "REJECT_KYC",
  "userId": "reviewer-uuid",
  "metadata": {
    "kycId": "kyc-uuid",
    "targetUserId": "user-uuid",
    "rejectionReason": "..."
  }
}
```

### Request Resubmit
```json
{
  "action": "REQUEST_RESUBMIT_KYC",
  "userId": "reviewer-uuid",
  "metadata": {
    "kycId": "kyc-uuid",
    "targetUserId": "user-uuid",
    "note": "..."
  }
}
```

---

## 📁 File Upload Configuration

### Directory Structure
```
uploads/
└── kyc/
    ├── documents/      ← citizenship, passport, documents
    ├── selfies/        ← selfie photos only
    └── archive/        ← soft-deleted files
```

### Filename Convention
```
{userId}_{documentType}_{Date.now()}.{ext}

Examples:
- abc123_CITIZENSHIP_FRONT_1716000000000.jpg
- abc123_PASSPORT_1716000000001.pdf
- abc123_SELFIE_1716000000002.png
```

### File Validation
- Max size: 10 MB per file
- Allowed MIME types:
  - image/jpeg
  - image/png
  - image/webp
  - application/pdf

### Storage Rules
- Files stored in `file_path` field (relative path)
- Original filename NOT stored (security)
- Soft-deleted files moved to `archive/` subdirectory
- Version tracking for document replacements

---

## 🚨 Error Handling

### Common Errors

| Status | Message | Action |
|--------|---------|--------|
| 400 | Validation error | Check request body |
| 409 | Active KYC application already exists | Wait for current review |
| 403 | Insufficient permissions | Use admin/reviewer account |
| 404 | KYC application not found | Check ID format |

### Example Error Response

```json
{
  "success": false,
  "message": "You already have an active KYC application",
  "statusCode": 409
}
```

---

## 🔧 Implementation Details

### Service Layer (kycService)

**Methods:**
- `submitKyc(input)` - Create new KYC application with documents
- `getKycStatus(userId)` - Get user's latest KYC (any status)
- `getKycById(kycId)` - Get specific application
- `listKycApplications(limit, offset, status?, search?)` - Admin list with filtering
- `approveKyc(kycId, reviewerId)` - Approve + send email
- `rejectKyc(kycId, reviewerId, reason)` - Reject + send email
- `requestResubmit(kycId, reviewerId, note)` - Request resubmit + send email

**Features:**
- Prisma transactions for atomic operations
- Comprehensive error handling (AppError)
- Fire-and-forget email (never throws)
- Detailed audit metadata
- Type-safe responses

### Controller Layer (kycController)

**Handlers:**
- `submitKyc(req, res, next)` - Entry point for submission
- `getKycStatus(req, res, next)` - User's own status
- `listKycApplications(req, res, next)` - Admin list
- `getKycById(req, res, next)` - Admin detail view
- `approveKyc(req, res, next)` - Approval action
- `rejectKyc(req, res, next)` - Rejection action
- `requestKycResubmit(req, res, next)` - Resubmit request

**Middleware Stack:**
1. `authenticate` - Verify JWT token
2. `authorize('ADMIN', 'REVIEWER')` - Check role (for admin endpoints)
3. `validate(schema)` - Zod validation
4. Handler function
5. `auditService.log()` - Log action
6. `apiResponse.success()` - Formatted response

---

## 🧪 Testing the KYC System

### 1. User Submits KYC

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

### 2. Reviewer Lists Applications

```bash
curl -X GET 'http://localhost:3000/api/v1/kyc?page=1&limit=10&status=PENDING' \
  -H "Authorization: Bearer <REVIEWER_TOKEN>"
```

### 3. Reviewer Approves

```bash
curl -X PATCH http://localhost:3000/api/v1/kyc/<KYC_ID>/approve \
  -H "Authorization: Bearer <REVIEWER_TOKEN>"
```

### 4. Check Audit Logs

```bash
# Via database
SELECT * FROM audit_logs WHERE action = 'APPROVE_KYC';

# Via admin endpoint (to be implemented)
GET /api/v1/audit?action=APPROVE_KYC
```

---

## 🚀 Next Steps

1. ✅ KYC routes implemented
2. ⏳ Document upload endpoint (POST /documents/upload)
3. ⏳ Document version management
4. ⏳ Admin dashboard with KYC stats
5. ⏳ OCR integration (extension point)
6. ⏳ Face verification (extension point)

---

## 📞 Support & Questions

For issues or questions about the KYC system, refer to:
- FinGuard copilot-instructions.md
- AUTH_SETUP.md (for email/auth patterns)
- Prisma documentation: https://www.prisma.io/docs/

---

**Last Updated:** May 20, 2026  
**Maintainer:** FinGuard Development Team
