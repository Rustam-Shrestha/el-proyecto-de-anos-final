# Admin Dashboard & Statistics API Documentation

## 📋 Overview

The admin API provides comprehensive dashboards and statistics endpoints for system administrators. All endpoints are protected with ADMIN-only RBAC and require authentication via JWT Bearer token.

---

## 🔐 Access Control

All admin endpoints require:
- **Authentication:** Valid JWT Bearer token
- **Authorization:** ADMIN role only
- **Middleware Stack:** `authenticate → authorize('ADMIN') → validate → handler`

**Unauthorized Response (403):**
```json
{
  "success": false,
  "message": "Insufficient permissions for this action",
  "statusCode": 403
}
```

---

## 📊 Endpoints

### 1. Dashboard Overview

**GET** `/api/v1/admin/dashboard`

Returns comprehensive dashboard statistics including user counts, KYC status breakdown, document statistics, and recent activity.

**Request:**
```http
GET /api/v1/admin/dashboard HTTP/1.1
Authorization: Bearer <ADMIN_TOKEN>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Dashboard data retrieved",
  "data": {
    "stats": {
      "users": {
        "total": 1250,
        "active": 432,
        "verified": 1100,
        "unverified": 150,
        "percentage": {
          "verified": 88
        }
      },
      "kyc": {
        "total": 980,
        "pending": 120,
        "approved": 750,
        "rejected": 110,
        "percentage": {
          "approved": 77,
          "pending": 12,
          "rejected": 11
        }
      },
      "documents": {
        "total": 5432
      }
    },
    "recentActivity": {
      "auditLogs": [
        {
          "id": "uuid",
          "userId": "user-uuid",
          "userEmail": "user@example.com",
          "action": "LOGIN",
          "createdAt": "2026-05-20T10:30:00Z",
          "metadata": {}
        },
        "... 9 more recent audit logs"
      ],
      "kycApplications": [
        {
          "id": "kyc-uuid",
          "userId": "user-uuid",
          "userEmail": "user@example.com",
          "status": "APPROVED",
          "submittedAt": "2026-05-20T09:00:00Z",
          "reviewedAt": "2026-05-20T10:00:00Z"
        },
        "... 4 more recent KYC applications"
      ]
    }
  }
}
```

**What it shows:**
- Total user count with verification percentage
- Active sessions count
- KYC application breakdown by status
- Document upload statistics
- Last 10 audit log entries
- Last 5 KYC applications

---

### 2. Users with KYC Status

**GET** `/api/v1/admin/users-kyc`

List all users with their current KYC application status. Supports pagination and filtering.

**Request:**
```http
GET /api/v1/admin/users-kyc?page=1&limit=10&status=APPROVED&search=john HTTP/1.1
Authorization: Bearer <ADMIN_TOKEN>
```

**Query Parameters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| page | integer | Page number (default: 1) | 1 |
| limit | integer | Results per page (default: 10, max: 100) | 20 |
| status | string | Filter by KYC status: PENDING, UNDER_REVIEW, APPROVED, REJECTED, RESUBMIT_REQUIRED, NONE | APPROVED |
| search | string | Search by email or full name (max 255 chars) | john@example.com |

**Response (200):**
```json
{
  "success": true,
  "message": "Users with KYC status retrieved",
  "data": [
    {
      "id": "user-uuid",
      "email": "john@example.com",
      "role": "USER",
      "fullName": "John Doe",
      "phone": "+1234567890",
      "isVerified": true,
      "createdAt": "2026-05-01T08:00:00Z",
      "kyc": {
        "id": "kyc-uuid",
        "status": "APPROVED",
        "submittedAt": "2026-05-10T10:00:00Z",
        "reviewedAt": "2026-05-10T12:00:00Z",
        "rejectionReason": null
      }
    },
    {
      "id": "user-uuid-2",
      "email": "jane@example.com",
      "role": "USER",
      "fullName": "Jane Smith",
      "phone": null,
      "isVerified": false,
      "createdAt": "2026-05-05T09:30:00Z",
      "kyc": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1250,
    "pages": 125
  }
}
```

**Use Cases:**
- Find users with pending KYC applications
- Track user registration and verification status
- Locate specific users by email or name

---

### 3. Audit Logs

**GET** `/api/v1/admin/audit`

Retrieve audit logs with filtering and pagination for compliance and security monitoring.

**Request:**
```http
GET /api/v1/admin/audit?page=1&limit=20&action=LOGIN&startDate=2026-05-01T00:00:00Z&endDate=2026-05-20T23:59:59Z HTTP/1.1
Authorization: Bearer <ADMIN_TOKEN>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number (default: 1) |
| limit | integer | Results per page (default: 10, max: 100) |
| action | string | Filter by action (LOGIN, REGISTER, UPLOAD, etc.) |
| userId | uuid | Filter by user ID |
| startDate | ISO 8601 | Filter from date |
| endDate | ISO 8601 | Filter to date |

**Response (200):**
```json
{
  "success": true,
  "message": "Audit logs retrieved",
  "data": [
    {
      "id": "log-uuid",
      "userId": "user-uuid",
      "userEmail": "user@example.com",
      "action": "LOGIN",
      "metadata": {
        "email": "user@example.com"
      },
      "ip": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2026-05-20T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 15432,
    "pages": 772
  }
}
```

**Auditable Actions:**
- REGISTER, LOGIN, LOGOUT, REFRESH_TOKEN
- VERIFY_EMAIL, RESET_PASSWORD, CHANGE_PASSWORD
- UPDATE_PROFILE, CHANGE_USER_ROLE, DELETE_USER
- SUBMIT_KYC, APPROVE_KYC, REJECT_KYC, REQUEST_RESUBMIT_KYC
- UPLOAD, DELETE_FILE

---

### 4. KYC Statistics

**GET** `/api/v1/admin/stats/kyc`

Detailed KYC application statistics with status breakdown and recent applications.

**Request:**
```http
GET /api/v1/admin/stats/kyc HTTP/1.1
Authorization: Bearer <ADMIN_TOKEN>
```

**Response (200):**
```json
{
  "success": true,
  "message": "KYC statistics retrieved",
  "data": {
    "breakdown": {
      "PENDING": 120,
      "UNDER_REVIEW": 45,
      "APPROVED": 750,
      "REJECTED": 110,
      "RESUBMIT_REQUIRED": 30
    },
    "total": 1055,
    "averageReviewTime": null,
    "recentApplications": [
      {
        "id": "kyc-uuid",
        "status": "APPROVED",
        "userEmail": "user@example.com",
        "submittedAt": "2026-05-20T08:00:00Z",
        "reviewedAt": "2026-05-20T10:30:00Z",
        "daysToReview": 0
      }
    ]
  }
}
```

**Insights:**
- Approval rate percentage
- Pending applications count
- Average time to review
- Recent application trends

---

### 5. Document Statistics

**GET** `/api/v1/admin/stats/documents`

Document upload statistics by type and file format.

**Request:**
```http
GET /api/v1/admin/stats/documents HTTP/1.1
Authorization: Bearer <ADMIN_TOKEN>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Document statistics retrieved",
  "data": {
    "total": 5432,
    "totalSizeBytes": 2147483648,
    "totalSizeMB": 2048,
    "byType": {
      "CITIZENSHIP_FRONT": 1200,
      "CITIZENSHIP_BACK": 1150,
      "PASSPORT": 950,
      "SELFIE": 1800,
      "OTHER": 332
    },
    "byMimeType": {
      "image/jpeg": 4500,
      "image/png": 600,
      "image/webp": 200,
      "application/pdf": 132
    }
  }
}
```

**Insights:**
- Total storage used (MB)
- Document distribution by type
- File format breakdown
- Storage optimization opportunities

---

### 6. System Statistics

**GET** `/api/v1/admin/stats/system`

Real-time system and activity statistics.

**Request:**
```http
GET /api/v1/admin/stats/system HTTP/1.1
Authorization: Bearer <ADMIN_TOKEN>
```

**Response (200):**
```json
{
  "success": true,
  "message": "System statistics retrieved",
  "data": {
    "activity": {
      "registrationsLast24h": 45,
      "registrationsLast7d": 312,
      "registrationsLast30d": 1250,
      "loginsLast24h": 3421,
      "kycSubmissionsLast24h": 82,
      "uploadsLast24h": 156
    },
    "system": {
      "activeSessionsCount": 287,
      "timestamp": "2026-05-20T10:35:00Z"
    }
  }
}
```

**Metrics:**
- Registration rate (24h, 7d, 30d)
- Login activity
- KYC submission frequency
- File upload volume
- Active concurrent sessions

---

## 🔑 Sample Admin Requests

### Get Dashboard
```bash
curl -X GET http://localhost:3000/api/v1/admin/dashboard \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Find Users with Pending KYC
```bash
curl -X GET "http://localhost:3000/api/v1/admin/users-kyc?status=PENDING&limit=50" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Search Audit Logs by Action
```bash
curl -X GET "http://localhost:3000/api/v1/admin/audit?action=UPLOAD&limit=100" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Get Activity in Last 24 Hours
```bash
curl -X GET http://localhost:3000/api/v1/admin/stats/system \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

## 📈 Dashboard Implementation Details

### Controller: `src/controllers/adminController.ts`

**Methods:**
- `getDashboard()` - Dashboard overview with counts and recent activity
- `getUsersWithKycStatus()` - Paginated user list with KYC status
- `getAuditLogs()` - Filtered audit log retrieval
- `getKycStats()` - KYC application statistics
- `getDocumentStats()` - Document upload statistics
- `getSystemStats()` - System and activity statistics

### Routes: `src/routes/adminRoutes.ts`

**Stack:** `authenticate → authorize('ADMIN') → validate → handler`

All endpoints use:
- Zod validation for query parameters
- Prisma queries for data retrieval
- Paginated responses with metadata
- Comprehensive error handling
- Winston logging for debugging

---

## 🎯 Common Use Cases

### 1. Monitor KYC Processing
```typescript
// Check pending applications
GET /api/v1/admin/users-kyc?status=PENDING

// Get KYC statistics
GET /api/v1/admin/stats/kyc

// View recent approvals
GET /api/v1/admin/audit?action=APPROVE_KYC
```

### 2. User Management
```typescript
// Find user by email
GET /api/v1/admin/users-kyc?search=john@example.com

// Track user activity
GET /api/v1/admin/audit?userId=<USER_ID>

// Check verification status
GET /api/v1/admin/users-kyc?page=1
```

### 3. Compliance & Auditing
```typescript
// Audit logs in date range
GET /api/v1/admin/audit?startDate=2026-05-01T00:00:00Z&endDate=2026-05-31T23:59:59Z

// Track all role changes
GET /api/v1/admin/audit?action=CHANGE_USER_ROLE

// Monitor file uploads
GET /api/v1/admin/audit?action=UPLOAD
```

### 4. System Monitoring
```typescript
// Dashboard overview
GET /api/v1/admin/dashboard

// Activity metrics
GET /api/v1/admin/stats/system

// Storage usage
GET /api/v1/admin/stats/documents
```

---

## 🔍 Prisma Queries Used

### User Statistics
```prisma
User.count() - Total user count
User.count(where: { isVerified: true }) - Verified users
User.findMany(include: { kycApplications, profile, role }) - User details with relations
```

### KYC Statistics
```prisma
KycApplication.count(where: { status }) - Count by status
KycApplication.groupBy(by: ['status'], _count: { id }) - Status breakdown
KycApplication.findMany(include: { user }) - Recent applications
```

### Audit Logs
```prisma
AuditLog.findMany(where: { action, userId, createdAt }) - Filtered logs
AuditLog.count(where: { ... }) - Log count with filters
```

### Document Statistics
```prisma
Document.count(where: { isDeleted: false }) - Active documents
Document.groupBy(by: ['type', 'mimeType']) - Breakdown by type/format
Document.aggregate(_sum: { sizeBytes }) - Total storage used
```

---

## ✅ Error Handling

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Missing or invalid authorization header",
  "statusCode": 401
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions for this action",
  "statusCode": 403
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "statusCode": 400,
  "details": {
    "fieldErrors": { "limit": ["must be <= 100"] }
  }
}
```

### 500 Internal Error
```json
{
  "success": false,
  "message": "Failed to fetch dashboard data",
  "statusCode": 500
}
```

---

## 📋 Validation Rules

### Pagination
- `page`: Must be >= 1 (default: 1)
- `limit`: Must be 1-100 (default: 10)

### Filtering
- `action`: String, optional
- `userId`: Valid UUID, optional
- `startDate`: ISO 8601 datetime, optional
- `endDate`: ISO 8601 datetime, optional
- `status`: Enum (PENDING, UNDER_REVIEW, APPROVED, REJECTED, RESUBMIT_REQUIRED, NONE)
- `search`: String max 255 chars, optional

---

## 🚀 Integration with Frontend

Example React hook for admin dashboard:

```typescript
// hooks/useAdminDashboard.ts
import { useApiQuery } from '@hooks/useApiQuery';

export const useAdminDashboard = () => {
  return useApiQuery(
    ['admin', 'dashboard'],
    '/api/v1/admin/dashboard'
  );
};

// Usage in component
const AdminDashboard = () => {
  const { data, isLoading, error } = useAdminDashboard();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      <StatCard title="Total Users" value={data.stats.users.total} />
      <StatCard title="Pending KYC" value={data.stats.kyc.pending} />
      <RecentActivityTable logs={data.recentActivity.auditLogs} />
    </div>
  );
};
```

---

## 📚 Related Documentation

- See **MIDDLEWARE_VALIDATION_GUIDE.md** for middleware patterns
- See **AUDIT_SERVICE_COMPLETE.md** for audit logging details
- See **AUTH_SETUP.md** for authentication details
- See **KYC_SETUP.md** for KYC workflow details

---

**Implementation Status:** ✅ Complete and production-ready

All admin endpoints fully implemented with Prisma queries, pagination, filtering, and comprehensive error handling.
