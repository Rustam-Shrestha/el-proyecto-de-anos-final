# Authentication System Setup Guide

## 📋 Overview

This document covers the complete authentication system for FinGuard backend, including:

- **User Registration & Email Verification**
- **Login/Logout with JWT tokens**
- **Token Refresh (rotation-based)**
- **Password Reset Flow**
- **Change Password**
- **Role-Based Access Control (RBAC)**
- **Audit Logging**

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update:

```bash
cp .env.example .env
```

**Required variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` - Random 32+ char string
- `JWT_REFRESH_SECRET` - Random 32+ char string
- `FRONTEND_URL` - Frontend URL for email links

Generate JWT secrets:
```bash
openssl rand -base64 32  # Run twice, once for each secret
```

### 3. Setup Database

```bash
# Install Prisma CLI globally
npm install -g prisma

# Create migration (first time)
npx prisma migrate dev --name init

# Seed database with roles + admin user
npm run seed
```

### 4. Start Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`  
API docs: `http://localhost:3000/docs`

---

## 📚 API Endpoints

### Auth Routes (`/api/v1/auth`)

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response: 201
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "USER",
      "isVerified": false
    }
  }
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response: 200
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": { ... }
  }
}
```

#### Verify Email
```http
POST /api/v1/auth/verify-email
Content-Type: application/json

{
  "token": "eyJhbGc..."  # From email link
}

Response: 200
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### Forgot Password
```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response: 200
{
  "success": true,
  "message": "If the email exists, a password reset link has been sent"
}
```

#### Reset Password
```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "eyJhbGc...",  # From email link
  "password": "NewSecurePass123"
}

Response: 200
{
  "success": true,
  "message": "Password reset successfully. Please login with your new password."
}
```

#### Change Password (Authenticated)
```http
POST /api/v1/auth/change-password
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass456"
}

Response: 200
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

Response: 200
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": { ... }
  }
}
```

#### Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer <accessToken>

Response: 200
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### User Routes (`/api/v1/users`)

#### Get Profile (Authenticated)
```http
GET /api/v1/users/me
Authorization: Bearer <accessToken>

Response: 200
{
  "success": true,
  "message": "Profile retrieved",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER",
    "isVerified": true,
    "createdAt": "2026-05-20T...",
    "updatedAt": "2026-05-20T..."
  }
}
```

#### Update Profile (Authenticated)
```http
PATCH /api/v1/users/me
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "email": "newemail@example.com",  # Optional
  "fullName": "John Doe",           # Optional
  "phone": "+1234567890",           # Optional
  "address": "123 Main St"          # Optional
}

Response: 200
```

#### List Users (Admin Only)
```http
GET /api/v1/users?page=1&limit=10&search=john
Authorization: Bearer <adminToken>

Response: 200
{
  "success": true,
  "message": "Users listed successfully",
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### Get User (Admin Only)
```http
GET /api/v1/users/:id
Authorization: Bearer <adminToken>

Response: 200
{
  "success": true,
  "message": "User retrieved",
  "data": { ... }
}
```

#### Change User Role (Admin Only)
```http
PATCH /api/v1/users/:id/role
Authorization: Bearer <adminToken>
Content-Type: application/json

{
  "role": "REVIEWER"  # USER, REVIEWER, or ADMIN
}

Response: 200
```

#### Delete User (Admin Only)
```http
DELETE /api/v1/users/:id
Authorization: Bearer <adminToken>

Response: 200
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## 🔐 Default Admin Account

After seeding, login with:
```
Email: admin@finguard.local
Password: Admin@123456
```

⚠️ **IMPORTANT:** Change this password immediately in production!

---

## 🛡️ Authentication Flow

### Token-Based Authentication

1. **Register/Login** → Get `accessToken` + `refreshToken`
2. **API Requests** → Send `Authorization: Bearer <accessToken>`
3. **Token Expires** → Use `refreshToken` to get new pair
4. **Token Refresh** → Old session revoked, new session created
5. **Logout** → All sessions revoked

### Password Reset Flow

1. User requests `POST /forgot-password`
2. Email with reset token sent (24h expiry)
3. User clicks link, gets token in query param
4. User submits new password with token
5. All sessions revoked (force re-login)

### Email Verification

1. On registration, verification email sent (24h token)
2. User clicks link to verify
3. `isVerified` flag set to true
4. User can access all features

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY,
  email           VARCHAR(255) UNIQUE NOT NULL,
  passwordHash    VARCHAR(255) NOT NULL,
  roleId          UUID FOREIGN KEY,
  isVerified      BOOLEAN DEFAULT FALSE,
  isDeleted       BOOLEAN DEFAULT FALSE,
  createdAt       TIMESTAMP DEFAULT NOW(),
  updatedAt       TIMESTAMP DEFAULT NOW()
);
```

### Sessions Table (Refresh Tokens)
```sql
CREATE TABLE sessions (
  id              UUID PRIMARY KEY,
  userId          UUID FOREIGN KEY,
  refreshTokenHash VARCHAR(255) NOT NULL,
  isRevoked       BOOLEAN DEFAULT FALSE,
  expiresAt       TIMESTAMP,
  createdAt       TIMESTAMP DEFAULT NOW()
);
```

### Audit Logs
```sql
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY,
  userId          UUID FOREIGN KEY NULL,
  action          VARCHAR(100),
  metadata        JSON,
  ip              VARCHAR(45),
  userAgent       VARCHAR(255),
  createdAt       TIMESTAMP DEFAULT NOW()
);
```

---

## 🔄 Token Refresh & Rotation

**Why rotation?** Security best practice to limit token exposure.

**Flow:**
1. Client gets `accessToken` (15m) + `refreshToken` (7d)
2. When access token expires, client sends `refreshToken`
3. Server verifies token, creates **new session**, revokes **old session**
4. Client gets new `accessToken` + `refreshToken` pair
5. Old refresh token is now invalid

**Logout** revokes all sessions immediately.

---

## 📧 Email Configuration

### Development Setup

Use **MailHog** for testing emails locally:

```bash
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

Then view emails at: `http://localhost:8025`

Update `.env`:
```
SMTP_HOST=localhost
SMTP_PORT=1025
```

### Production Setup

Update `.env` with real SMTP credentials:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 🚨 Error Handling

### Common Errors

| Status | Message | Action |
|--------|---------|--------|
| 400 | Validation error | Check request body format |
| 401 | Invalid email or password | Verify credentials |
| 401 | Invalid or expired token | Refresh token or re-login |
| 409 | Email already registered | Use different email |
| 403 | Insufficient permissions | Use admin account |

### Error Response Format

```json
{
  "success": false,
  "message": "User-friendly error message",
  "statusCode": 400,
  "details": { ... }  // Only in development
}
```

---

## 🧪 Testing

### Run Tests

```bash
npm run test
npm run test:watch
```

### Test Coverage

- Auth endpoints (register, login, refresh)
- User CRUD operations
- RBAC enforcement
- Email verification
- Password reset
- Audit logging

---

## 📋 Checklist for Deployment

- [ ] Change admin password
- [ ] Set `NODE_ENV=production`
- [ ] Generate strong JWT secrets
- [ ] Configure real SMTP
- [ ] Enable HTTPS
- [ ] Set secure CORS origins
- [ ] Review audit logs
- [ ] Setup database backups
- [ ] Enable rate limiting
- [ ] Monitor error logs

---

## 🔗 Related Documentation

- [Express.js Docs](https://expressjs.com/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [JWT.io](https://jwt.io/)
- [OWASP Authentication Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Last Updated:** May 20, 2026  
**Maintainer:** FinGuard Development Team
