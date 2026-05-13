# Project Architecture (Separated Services)

This project has been refactored into a **two-service microservices architecture**:

## Services Overview

### 1. backend-node (Express.js API Gateway)
- **Location**: `/backend-node`
- **Tech Stack**: Node.js, Express, TypeScript, PostgreSQL
- **Port**: 4000
- **Responsibilities**:
  - HTTP API gateway for frontend
  - Authentication (JWT, OAuth)
  - User management
  - Business logic
  - Database operations (migrations, queries)
  - Proxying multipart requests to FastAPI

### 2. backend-fastapi (Python ML Service)
- **Location**: `/backend-fastapi`
- **Tech Stack**: Python, FastAPI, PostgreSQL
- **Port**: 8000
- **Responsibilities**:
  - KYC (Know Your Customer) processing
  - OCR (Optical Character Recognition)
  - Face verification
  - Document analysis

### 3. frontend (React UI)
- **Location**: `/frontend`
- **Tech Stack**: React 18, TypeScript, Vite, Redux Toolkit, TanStack Query
- **Port**: 5173
- **Responsibilities**:
  - User interface
  - State management
  - API client

### 4. postgres (PostgreSQL Database)
- **Port**: 5432
- **Shared Database**: Both `backend-node` and `backend-fastapi` use the same PostgreSQL instance

## Database Schema

The unified PostgreSQL database includes:

**Core Tables (managed by backend-node)**:
- `users` - User accounts with authentication
- `roles` - User roles (admin, staff, etc.)
- `sessions` - Active user sessions
- `audit_logs` - Event audit trail

**KYC Tables (managed by backend-fastapi)**:
- `kyc_applications` - KYC submission records
- `documents` - Uploaded documents
- `ocr_results` - OCR processing results
- `face_verifications` - Face verification records

**Migrations**:
- `backend-node/migrations/001_init.sql` - Core schema
- `backend-node/migrations/kyc/001_create_kyc_tables.sql` - KYC schema

## Running the Services

### Development (Docker Compose)
```bash
docker-compose -f docker-compose.toolbox.yml up
```

This starts:
- PostgreSQL on `localhost:5432`
- backend-node on `localhost:4000`
- backend-fastapi on `localhost:8080`
- frontend on `localhost:5173`

### Development (Local - Manual)
#### Start PostgreSQL
```bash
# Using Docker
docker run --name pern_postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16-alpine

# Or using native PostgreSQL
psql -U postgres
```

#### Start backend-node
```bash
cd backend-node
npm install
npm run dev
```

#### Start backend-fastapi
```bash
cd backend-fastapi
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### Start frontend
```bash
cd frontend
npm install
npm run dev
```

## API Routes

### backend-node (Express)
```
GET  /api/v1/health              - Health check
POST /api/v1/auth/login          - User login
POST /api/v1/auth/logout         - User logout
GET  /api/v1/users               - List users (admin)
POST /api/v1/users               - Create user (admin)
GET  /api/v1/users/:id           - Get user detail
PUT  /api/v1/users/:id           - Update user
DELETE /api/v1/users/:id         - Delete user
POST /api/v1/kyc/upload          - Proxy KYC upload to FastAPI
```

### backend-fastapi (FastAPI)
```
POST /api/v1/kyc/upload          - Upload and process KYC document
POST /api/v1/kyc/verify-face     - Face verification
GET  /api/v1/kyc/status/:id      - Get KYC processing status
```

## Request Flow: KYC Document Upload

```
Frontend (React)
    ↓ POST /api/v1/kyc/upload (multipart)
backend-node (Express)
    ↓ Read file, proxy to FastAPI
backend-fastapi (FastAPI)
    ↓ Process document (OCR, face verification)
    ↓ Store results in PostgreSQL
    ↓ Return status
backend-node (Express)
    ↓ Return response to client
Frontend (React)
```

## Environment Configuration

### backend-node (.env)
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pern_baseline
JWT_ACCESS_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_secret_key
FASTAPI_URL=http://localhost:8080       # Local development
CORS_ORIGIN=http://localhost:5173,http://localhost:5176
```

Docker Compose sets `FASTAPI_URL=http://backend-fastapi:8080` (service name).

### backend-fastapi (.env)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pern_baseline
```

## File Structure

```
projectIII/
├── backend-node/                    # Express.js API Gateway
│   ├── src/
│   │   ├── controllers/             # Request handlers
│   │   ├── services/                # Business logic
│   │   ├── routes/                  # Route definitions
│   │   │   └── kycRoutes.ts        # KYC proxy to FastAPI
│   │   ├── middleware/              # Auth, validation, error handling
│   │   └── db/                      # Database pool
│   ├── migrations/                  # Database schemas
│   │   ├── 001_init.sql            # Core tables
│   │   └── kyc/
│   │       └── 001_create_kyc_tables.sql
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── backend-fastapi/                 # FastAPI ML Microservice
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── kyc.py          # KYC endpoints
│   │   │       ├── ocr.py          # OCR processing
│   │   │       └── face_verify.py  # Face verification
│   │   ├── models/                  # ORM models
│   │   ├── db/                      # Database connection
│   │   └── services/                # Business logic
│   ├── main.py                      # FastAPI app
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                        # React UI
│   ├── src/
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.toolbox.yml       # Multi-service orchestration
└── package.json                     # Monorepo root
```

## Common Tasks

### Database Migrations
```bash
# Add new migration (in backend-node)
cd backend-node
# Create SQL file in migrations/
# Run migrations (Docker handles automatic migration on startup)
```

### Adding a New Feature

**Backend-node (API Gateway)**:
1. Create route in `backend-node/src/routes/`
2. Create controller in `backend-node/src/controllers/`
3. Create service in `backend-node/src/services/`
4. Add validation schema in route

**Backend-fastapi (ML Service)**:
1. Create endpoint in `backend-fastapi/app/api/v1/`
2. Add database model in `backend-fastapi/app/models/`
3. Implement service logic in `backend-fastapi/app/services/`
4. Call from backend-node via HTTP proxy

### Debugging

**backend-node**:
- Logs: `npm run dev` (stdout)
- Use Redux DevTools for frontend state
- VS Code debugging: Add breakpoints in TypeScript

**backend-fastapi**:
- Logs: `uvicorn main:app --reload --log-level debug`
- FastAPI docs: http://localhost:8080/docs
- OpenAPI schema: http://localhost:8080/openapi.json

**Database**:
```bash
psql -U postgres -d pern_baseline
```

## TypeScript Types

Both services are fully typed:
- **backend-node**: Express types, database record types
- **backend-fastapi**: Python type hints (Pydantic models)
- **frontend**: React component types, API response types

## Security Notes

1. **JWT Tokens**: Stored in localStorage (frontend) and validated on every request
2. **RBAC**: Role-based access control enforced in backend-node middleware
3. **Database**: Parameterized queries prevent SQL injection
4. **File Upload**: Multipart files streamed through multer with size limits
5. **CORS**: Only allow specified frontend origins

## Troubleshooting

### FastAPI Service Not Found
```
Error: FastAPI service unavailable at http://localhost:8080
```
**Solution**: Ensure backend-fastapi is running on port 8000.

### Database Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Ensure PostgreSQL is running on port 5432.

### Port Already in Use
```
Error: listen EADDRINUSE :::4000
```
**Solution**: Change PORT in .env or kill the process on that port.

## References

- [Express.js Docs](https://expressjs.com/)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [React Docs](https://react.dev/)
- [Docker Docs](https://docs.docker.com/)
