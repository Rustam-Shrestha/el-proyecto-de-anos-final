# Document Management System Documentation

## 📋 Overview

The document management system handles KYC document uploads, versioning, and archival. It supports:

- **Multi-file uploads** (citizenship, passport, selfies, etc.)
- **File validation** (MIME type, size limits)
- **Version tracking** (document replacement creates versions)
- **Soft deletion** (files moved to archive, never hard-deleted)
- **Access control** (users can only access their own documents)
- **Audit logging** (all operations logged)

---

## 🗄️ Database Schema

### Document Table

```sql
CREATE TABLE documents (
  id            UUID PRIMARY KEY,
  userId        UUID FOREIGN KEY → users.id,
  kycId         UUID FOREIGN KEY → kyc_applications.id,
  type          VARCHAR (enum: CITIZENSHIP_FRONT, CITIZENSHIP_BACK, PASSPORT, SELFIE, OTHER),
  filePath      VARCHAR (relative path to file),
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
  filePath   VARCHAR (path to old version),
  version    INT,
  createdAt  TIMESTAMP DEFAULT NOW()
);
```

---

## 📁 File Storage Structure

```
uploads/
└── kyc/
    ├── documents/           ← Citizenship, passport, etc.
    │   └── {userId}_{type}_{timestamp}.{ext}
    ├── selfies/             ← Selfie photos only
    │   └── {userId}_{type}_{timestamp}.{ext}
    └── archive/             ← Soft-deleted files
        └── {documentId}_v{version}_{timestamp}.{ext}
```

### Filename Convention

```
{userId}_{documentType}_{timestamp}.{ext}

Examples:
- 550e8400-e29b-41d4-a716-446655440000_CITIZENSHIP_FRONT_1716000000000.jpg
- 550e8400-e29b-41d4-a716-446655440000_PASSPORT_1716000000001.pdf
- 550e8400-e29b-41d4-a716-446655440000_SELFIE_1716000000002.png
```

---

## 📚 API Endpoints

### Upload Document

**POST** `/api/v1/documents/upload`

```http
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

Form Data:
  file: <binary file data>
  kycId: "kyc-uuid"
  type: "CITIZENSHIP_FRONT"

Response: 201
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "id": "doc-uuid",
    "userId": "user-uuid",
    "kycId": "kyc-uuid",
    "type": "CITIZENSHIP_FRONT",
    "filePath": "kyc/documents/user_CITIZENSHIP_FRONT_1716000000000.jpg",
    "mimeType": "image/jpeg",
    "sizeBytes": 2048576,
    "isDeleted": false,
    "version": 1,
    "createdAt": "2026-05-20T10:30:00Z"
  }
}
```

**Rules:**
- Max file size: 10 MB
- Allowed types: JPEG, PNG, WebP, PDF
- One document per type per KYC application
- Files stored with generated filename (not original)

---

### Get Document Metadata

**GET** `/api/v1/documents/:id`

```http
Authorization: Bearer <accessToken>

Response: 200
{
  "success": true,
  "message": "Document metadata retrieved",
  "data": {
    "id": "doc-uuid",
    "userId": "user-uuid",
    "type": "CITIZENSHIP_FRONT",
    "filePath": "kyc/documents/...",
    "version": 1,
    "createdAt": "2026-05-20T10:30:00Z"
  }
}
```

---

### Get Document Versions

**GET** `/api/v1/documents/:id/versions`

```http
Authorization: Bearer <accessToken>

Response: 200
{
  "success": true,
  "message": "Document versions retrieved",
  "data": [
    {
      "id": "version-uuid",
      "documentId": "doc-uuid",
      "filePath": "kyc/documents/user_CITIZENSHIP_FRONT_1716000000000.jpg",
      "version": 1,
      "createdAt": "2026-05-20T10:30:00Z"
    },
    {
      "id": "version-uuid-2",
      "documentId": "doc-uuid",
      "filePath": "kyc/documents/user_CITIZENSHIP_FRONT_1716000000100.jpg",
      "version": 2,
      "createdAt": "2026-05-20T10:40:00Z"
    }
  ]
}
```

**Note:** Ordered by version DESC (newest first)

---

### Delete Document (Soft)

**DELETE** `/api/v1/documents/:id`

```http
Authorization: Bearer <accessToken>

Response: 200
{
  "success": true,
  "message": "Document deleted successfully",
  "data": {
    "id": "doc-uuid",
    "isDeleted": true,
    "filePath": "kyc/documents/..."
  }
}
```

**What happens:**
1. Document marked as deleted in DB
2. File moved to `archive/` folder
3. Audit log created: DELETE_FILE
4. Cannot download or modify deleted documents

---

### Replace Document

**POST** `/api/v1/documents/:id/replace`

```http
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

Form Data:
  file: <binary file data>
  type: "CITIZENSHIP_FRONT"  (optional, overrides if provided)

Response: 200
{
  "success": true,
  "message": "Document replaced with new version",
  "data": {
    "id": "doc-uuid",
    "version": 2,
    "filePath": "kyc/documents/user_CITIZENSHIP_FRONT_1716000000100.jpg",
    "createdAt": "2026-05-20T10:40:00Z"
  }
}
```

**What happens:**
1. Old file moved to `archive/` with version number
2. DocumentVersion record created for old version
3. Document record updated with new file + version incremented
4. Audit log created: UPLOAD (with action=REPLACE)

---

## 🔐 Access Control

Users can only:
- Upload documents for their own KYC applications
- View their own documents
- Delete their own documents
- Replace their own documents

Attempts to access others' documents return 403 Forbidden.

---

## 🔧 Multer Configuration

```typescript
// File upload middleware configuration
{
  storage: diskStorage({
    destination: (req, file, cb) => {
      // Determines: documents/ or selfies/ subfolder
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      // Format: {userId}_{documentType}_{timestamp}{ext}
      cb(null, filename);
    }
  }),
  fileFilter: (req, file, cb) => {
    // Allowed: image/jpeg, image/png, image/webp, application/pdf
    cb(null, file.mimetype allowed);
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  }
}
```

---

## 📊 Audit Logging

### Upload Action
```json
{
  "action": "UPLOAD",
  "userId": "user-uuid",
  "metadata": {
    "documentId": "doc-uuid",
    "kycId": "kyc-uuid",
    "type": "CITIZENSHIP_FRONT",
    "fileName": "550e8400_CITIZENSHIP_FRONT_1716000000000.jpg",
    "sizeBytes": 2048576
  }
}
```

### Replace Action
```json
{
  "action": "UPLOAD",
  "userId": "user-uuid",
  "metadata": {
    "documentId": "doc-uuid",
    "action": "REPLACE",
    "newVersion": 2,
    "fileName": "550e8400_CITIZENSHIP_FRONT_1716000000100.jpg",
    "sizeBytes": 2147483
  }
}
```

### Delete Action
```json
{
  "action": "DELETE_FILE",
  "userId": "user-uuid",
  "metadata": {
    "documentId": "doc-uuid",
    "type": "CITIZENSHIP_FRONT",
    "filePath": "kyc/documents/..."
  }
}
```

---

## 🚨 Error Handling

| Status | Message | Action |
|--------|---------|--------|
| 400 | No file provided | Provide file in form data |
| 400 | Document already deleted | Cannot replace deleted docs |
| 401 | Authentication required | Provide Bearer token |
| 403 | Forbidden - Document does not belong to you | Access your own docs only |
| 404 | Document not found | Check document ID |
| 409 | Document of this type already exists | Use replace endpoint |
| 413 | Payload too large | File exceeds 10 MB limit |

### Multer-specific Errors

Multer automatically rejects:
- **File type:** "File type not allowed" (only JPEG, PNG, WebP, PDF)
- **Size:** "File size exceeds 10 MB"
- **Missing file:** Handled by controller

---

## 🔄 Version Management

When you replace a document:

1. **Old version archived:**
   - File moved: `documents/...` → `archive/{id}_v{version}_{timestamp}.jpg`
   - DocumentVersion record created with old file path + version number

2. **New version created:**
   - Document.version incremented
   - Document.filePath updated to new file
   - Document.mimeType, sizeBytes updated

3. **History preserved:**
   - GET /:id/versions shows all previous versions
   - Can restore by uploading with same type (creates next version)

---

## 💾 Storage Management

### Disk Usage
- Each document counts against disk quota
- Versions are archived, not deleted
- Archive cleanup can be done separately (manual, scheduled, or admin endpoint)

### File Organization
- Active documents in `documents/` and `selfies/`
- Deleted documents in `archive/`
- Clear separation enables:
  - Easy restoration from archive
  - Scheduled cleanup of old versions
  - Compliance with data retention policies

---

## 🧪 Testing the Document System

### 1. Upload Document

```bash
curl -X POST http://localhost:3000/api/v1/documents/upload \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -F "file=@citizenship_front.jpg" \
  -F "kycId=<KYC_ID>" \
  -F "type=CITIZENSHIP_FRONT"
```

### 2. Get Document Metadata

```bash
curl http://localhost:3000/api/v1/documents/<DOC_ID> \
  -H "Authorization: Bearer <USER_TOKEN>"
```

### 3. Get Version History

```bash
curl http://localhost:3000/api/v1/documents/<DOC_ID>/versions \
  -H "Authorization: Bearer <USER_TOKEN>"
```

### 4. Replace Document

```bash
curl -X POST http://localhost:3000/api/v1/documents/<DOC_ID>/replace \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -F "file=@citizenship_front_updated.jpg"
```

### 5. Delete Document

```bash
curl -X DELETE http://localhost:3000/api/v1/documents/<DOC_ID> \
  -H "Authorization: Bearer <USER_TOKEN>"
```

---

## 📝 Notes

- **Never delete files completely** — soft delete to archive
- **User IDs in filenames** — enables quick identification
- **Timestamps in filenames** — ensures uniqueness
- **Relative paths stored** — portable across environments
- **Multer cleanup** — failed uploads automatically cleaned
- **Fire-and-forget archival** — file move failures don't block requests

---

## 🔮 Future Extensions

- [ ] Download document endpoint (with access control)
- [ ] Preview endpoint (image thumbnails)
- [ ] Bulk upload support
- [ ] Archive cleanup scheduling
- [ ] S3/cloud storage integration
- [ ] Virus scanning integration
- [ ] OCR integration
- [ ] Document encryption

---

**Last Updated:** May 20, 2026  
**Maintainer:** FinGuard Development Team
