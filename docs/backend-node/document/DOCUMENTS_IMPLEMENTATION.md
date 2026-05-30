# Document Management Implementation Quick Reference

## ✅ Files Generated

### Service Layer
- **src/services/documentService.ts** (280+ lines)
  - `uploadDocument()` - Save new document with validation
  - `getDocument()` - Retrieve document metadata with access control
  - `getDocumentVersions()` - Get version history
  - `deleteDocument()` - Soft delete + move to archive
  - `replaceDocument()` - Create version + update with new file

### Controller Layer
- **src/controllers/documentController.ts** (200+ lines)
  - 5 request handlers with proper error delegation
  - File cleanup on error (fire-and-forget)
  - Audit logging on every operation
  - Relative path calculation for storage

### Middleware
- **src/middleware/upload.ts** (60+ lines)
  - Multer configuration with disk storage
  - File filter (MIME type validation)
  - Size limits (10 MB max)
  - Filename generation: `{userId}_{documentType}_{timestamp}.{ext}`

### Routes & Validation
- **src/routes/documentRoutes.ts** (250+ lines)
  - 5 endpoints with full Swagger annotations
  - Multer middleware integration
  - Middleware stack: authenticate → upload → validate

- **src/routes/documentSchemas.ts** (35+ lines)
  - Zod schemas for all 5 endpoints
  - UUID validation for params
  - Document type enum validation

### Documentation
- **DOCUMENTS_SETUP.md** (450+ lines)
  - Complete API documentation with examples
  - Database schema explanation
  - File storage organization
  - Version management details
  - Audit logging patterns
  - Testing instructions

---

## 🔗 API Endpoints Summary

```
POST   /api/v1/documents/upload          ← Upload new document
GET    /api/v1/documents/:id             ← Get document metadata
GET    /api/v1/documents/:id/versions    ← Get version history
DELETE /api/v1/documents/:id             ← Soft-delete document
POST   /api/v1/documents/:id/replace     ← Replace with new version
```

---

## 📁 File Storage

```
uploads/kyc/
├── documents/      ← Active documents
├── selfies/        ← Selfie photos
└── archive/        ← Soft-deleted files + old versions
```

**Filename format:** `{userId}_{documentType}_{timestamp}.{ext}`

---

## 🔐 Validation Rules

### File Upload
- Max size: **10 MB**
- Allowed MIME types: image/jpeg, image/png, image/webp, application/pdf
- Document type: CITIZENSHIP_FRONT, CITIZENSHIP_BACK, PASSPORT, SELFIE, OTHER
- One document per type per KYC application

### Access Control
- Users can only upload/view/delete their own documents
- Users can only replace their own documents
- 403 Forbidden on unauthorized access
- Soft-deleted documents cannot be replaced

---

## 📧 Audit Logging

All document operations logged:

| Operation | Action | Metadata |
|-----------|--------|----------|
| Upload | UPLOAD | documentId, kycId, type, fileName, sizeBytes |
| Replace | UPLOAD | documentId, action=REPLACE, newVersion |
| Delete | DELETE_FILE | documentId, type, filePath |

---

## 🔄 Document Lifecycle

```
UPLOAD
  ├─ New document created
  ├─ File saved: uploads/kyc/documents/{userId}_{type}_{ts}.jpg
  ├─ Audit: UPLOAD
  └─ Response: 201 Created

REPLACE
  ├─ Old file moved to archive
  ├─ DocumentVersion record created
  ├─ Document.version incremented
  ├─ New file saved with new timestamp
  ├─ Audit: UPLOAD (action=REPLACE, newVersion)
  └─ Response: 200 OK

DELETE
  ├─ File moved: documents/ → archive/
  ├─ Document.isDeleted = true
  ├─ Audit: DELETE_FILE
  └─ Response: 200 OK
```

---

## 🗄️ Prisma Models Used

- ✅ Document (with version tracking)
- ✅ DocumentVersion (maintains old versions)
- ✅ KycApplication (relationship)
- ✅ User (ownership validation)

---

## 🚀 Quick Start

### 1. Ensure Upload Directory Exists
```bash
mkdir -p uploads/kyc/{documents,selfies,archive}
```

### 2. Test Upload
```bash
curl -X POST http://localhost:3000/api/v1/documents/upload \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -F "file=@test.jpg" \
  -F "kycId=<KYC_ID>" \
  -F "type=CITIZENSHIP_FRONT"
```

### 3. Check Audit Logs
```bash
# Via database
SELECT * FROM audit_logs WHERE action = 'UPLOAD';
```

---

## ⚙️ Error Handling

| Status | Scenario |
|--------|----------|
| 201 | File uploaded successfully |
| 200 | Document retrieved/deleted/replaced |
| 400 | No file, deleted doc, validation error |
| 401 | Missing/invalid Bearer token |
| 403 | Forbidden (doc doesn't belong to user) |
| 404 | Document not found |
| 409 | Document type already exists (not deleted) |
| 413 | File size exceeds 10 MB |

---

## 🔮 Integration Points

- ✅ KYC submission includes document upload
- ✅ Document versioning supports document replacement
- ✅ Soft deletion preserves data for compliance
- ✅ Audit trail captures all operations
- ⏳ Download endpoint (future)
- ⏳ Preview/thumbnail endpoint (future)
- ⏳ OCR verification (future)
- ⏳ Cloud storage migration (future)

---

## 📝 Notes

- Files are always moved to archive on soft-delete (never hard-deleted)
- Failed uploads automatically cleaned up
- File move errors logged but don't block requests (fire-and-forget)
- Document type enums match KYC requirements
- User ID in filename enables quick ownership verification
- Timestamp in filename prevents collisions

---

**Implementation Status:** ✅ Complete and production-ready

For detailed API documentation, see **DOCUMENTS_SETUP.md**
