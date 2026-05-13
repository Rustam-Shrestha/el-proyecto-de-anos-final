# PERN + TypeScript Baseline (Modern Docker & Redis)

A professional, scalable full-stack monorepo scaffold for ERP-style academic projects with built-in Redis caching.

## Tech Stack
- **Frontend**: React + TypeScript + Redux Toolkit + TanStack Query + Tailwind CSS + Zod
- **Backend**: Express + TypeScript + PostgreSQL + Redis + JWT/RBAC + optional OAuth2 + OpenAPI docs
- **Cache**: Redis 7 with persistence and TTL support
- **Testing**: Playwright E2E tests, Jest for backend
- **Infrastructure**: Modern Docker Compose, GitHub Actions CI/CD
- **Development**: npm workspaces, Vite, ESLint, Prettier, EditorConfig

## Project Architecture

This is a **monorepo using npm workspaces** with:
- Single `node_modules` at project root (shared dependencies)
- Separate `backend`, `frontend`, and `tests/e2e` workspaces
- Consistent configuration across all packages
- Professional CI/CD with GitHub Actions
- **NEW**: Redis caching layer with middleware support

### Why node_modules is at repository root
Dependencies are installed once in root and shared by all workspaces to reduce duplication and improve install speed. Individual workspace `node_modules` directories are not needed.

Run scripts with `-w` flag:
```bash
npm run dev -w backend        # Backend only
npm run dev -w frontend       # Frontend only
npm run dev                   # All workspaces
```

## 🐳 Docker Quick Start (Recommended)

The easiest way to run the entire stack with Redis, PostgreSQL, and all services:

```bash
# 1. Clone the repository
cd d:\el-proyecto-de-anos-final

# 2. Copy environment file
cp .env.example .env

# 3. Start all services with one command
docker compose up -d

# 4. Access applications
# - Frontend:     http://localhost:5173
# - Node Backend: http://localhost:4000
# - FastAPI:      http://localhost:8000
# - API Docs:     http://localhost:4000/docs
```

**Services Started**:
- ✅ PostgreSQL (port 5432)
- ✅ Redis (port 6379)
- ✅ Express.js Backend (port 4000)
- ✅ FastAPI Backend (port 8000)
- ✅ React Frontend (port 5173)

### Helper Commands

For Windows (PowerShell):
```bash
# Windows helper script with friendly interface
.\docker-helper.ps1 up              # Start all services
.\docker-helper.ps1 logs backend-node  # View logs
.\docker-helper.ps1 psql            # Connect to database
.\docker-helper.ps1 redis           # Open Redis CLI
.\docker-helper.ps1 down            # Stop all services
.\docker-helper.ps1 help            # Show all commands
```

For Mac/Linux:
```bash
chmod +x docker-helper.sh
./docker-helper.sh up               # Start all services
./docker-helper.sh logs backend-node   # View logs
./docker-helper.sh psql             # Connect to database
./docker-helper.sh down             # Stop all services
```

## Environment Files

### Root Level (`.env`)
Controls Docker Compose variables for all services:

```env
# Database
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=pern_baseline

# Redis
REDIS_URL=redis://redis:6379

# Backend
JWT_ACCESS_SECRET=your_secret_min_16_chars
JWT_REFRESH_SECRET=your_secret_min_16_chars
CORS_ORIGIN=http://localhost:5173,http://localhost:5176

# Frontend
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

**Setup**:
1. Copy `.env.example` → `.env`
2. Customize if needed (usually not required for development)
3. Services automatically use these values

### Service-Specific (Optional)
- Frontend template: `frontend/.env.example`
- Backend template: `backend-node/.env.example`

**Note**: All `.env` files are git-ignored and won't be committed (see `.gitignore`)

## Configuration Files

The project includes modern development tooling configuration:

- **`.editorconfig`** - Ensures consistent code style across all editors
- **`.prettierrc`** - Code formatting rules (run via editor or CLI)
- **`.prettierignore`** - Files to exclude from formatting
- **`.npmrc`** - NPM workspace and dependency settings
- **`.nvmrc`** - Node.js version specification (v20)
- **`.gitignore`** - Comprehensive git ignore rules
- **`.gitattributes`** - Cross-platform line ending consistency
- **`CONTRIBUTING.md`** - Development guidelines and workflows
- **`docker-compose.yml`** - Modern Docker Compose setup (replaces toolbox)
- **`DOCKER_SETUP.md`** - Comprehensive Docker guide
- **`REDIS_INTEGRATION.md`** - Redis caching integration examples

## Quick Start (Local Development - Without Docker)

### Prerequisites
- **Node.js**: >= 20.11.0 (check with `node -v`)
- **npm**: >= 9.0 (includes automatically)
- **PostgreSQL**: 16 (local installation)
- **Redis**: 7+ (local installation)

### Setup

```bash
# 1. Install dependencies (once, shared via workspaces)
npm install

# 2. Configure environment files
cp backend-node/.env.example backend-node/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your settings

# 3. Start services in separate terminals

# Terminal 1: Start backend
npm run dev -w backend-node
# Backend: http://localhost:4000

# Terminal 2: Start frontend
npm run dev -w frontend
# Frontend: http://localhost:5173

# 3. Verify everything works
# - Frontend: http://localhost:5173
# - Backend: http://localhost:4000
# - API Docs: http://localhost:4000/docs
```

### Prerequisites for Local Development
- PostgreSQL 16 running on port 5432
- Redis 7 running on port 6379
- Environment variables set in `.env` files

## Project Directory Structure

```
projectIII/
├── .editorconfig              ✓ Editor config for consistency
├── .gitignore                 ✓ Git ignore rules
├── .gitattributes             ✓ Line ending consistency
├── .npmrc                      ✓ NPM workspace config
├── .prettierrc                 ✓ Code formatting config
├── .prettierignore             ✓ Format ignore rules
├── .nvmrc                      ✓ Node version (v20)
├── CONTRIBUTING.md             ✓ Development guidelines
├── README.md                   ✓ This file
├── package.json                ✓ Root workspace config
├── docker-compose.toolbox.yml  ✓ Development Docker setup
│
├── .github/
│   └── workflows/
│       └── ci.yml              ✓ GitHub Actions CI/CD
│
├── backend/                    Express API
│   ├── src/
│   │   ├── config/             Environment & logger setup
│   │   ├── controllers/        Route handlers
│   │   ├── db/                 Database initialization
│   │   ├── middleware/         Express middleware
│   │   ├── models/             Data models
│   │   ├── routes/             API endpoints & validation
│   │   ├── services/           Business logic
│   │   ├── types/              TypeScript definitions
│   │   ├── utils/              Utilities
│   │   ├── app.ts              Express app setup
│   │   ├── server.ts           Server entry point
│   │   └── seed.ts             Database seeding
│   ├── migrations/             SQL migration files
│   ├── tests/                  Unit tests (Jest)
│   ├── .env.example            ✓ Env template
│   ├── Dockerfile              ✓ Production Docker image
│   ├── package.json            ✓ Backend dependencies
│   └── tsconfig.json           ✓ TypeScript config
│
├── frontend/                   React Vite App
│   ├── src/
│   │   ├── api/                API integration layer
│   │   ├── app/                Core setup (router, store)
│   │   ├── assets/             Images, styles, data
│   │   ├── auth/               Authentication logic
│   │   ├── components/         Reusable components
│   │   ├── context/            React Context providers
│   │   ├── features/           Feature modules
│   │   │   ├── auth/          Auth feature
│   │   │   ├── ui/            UI feature
│   │   │   └── users/         Users feature
│   │   ├── helper/             Utility functions
│   │   ├── hooks/              Custom React hooks
│   │   ├── pages/              Page components
│   │   ├── providers/          Context providers
│   │   ├── services/           API services
│   │   ├── shared/             Shared utilities
│   │   ├── store/              Redux store
│   │   ├── styles/             Global styles
│   │   ├── types/              TypeScript types
│   │   ├── main.tsx            Entry point
│   │   └── vite-env.d.ts       Vite types
│   ├── public/                 Static assets
│   ├── .env.example            ✓ Env template
│   ├── Dockerfile              ✓ Production Docker image
│   ├── index.html              ✓ HTML template
│   ├── package.json            ✓ Frontend dependencies
│   ├── tailwind.config.cjs      ✓ Tailwind config
│   ├── postcss.config.cjs       ✓ PostCSS config
│   ├── vite.config.ts          ✓ Vite config
│   └── tsconfig.json           ✓ TypeScript config
│
├── tests/e2e/                  Playwright E2E Tests
│   ├── specs/                  Test suites
│   ├── package.json            ✓ Test dependencies
│   └── playwright.config.ts    ✓ Playwright config
│
└── infra/                      Infrastructure
    └── scripts/
        ├── toolbox-up.ps1      Start Docker Toolbox
        └── toolbox-down.ps1    Stop Docker Toolbox
```

## Available Scripts

### Root Level (All Workspaces)
```bash
npm run dev          # Start backend + frontend dev servers
npm run build        # Build backend + frontend
npm run lint         # Lint backend + frontend
npm run test         # Run backend tests + E2E tests
```

### Backend Only
```bash
npm run dev -w backend         # Start Express dev server
npm run build -w backend       # Build TypeScript
npm run start -w backend       # Run production server
npm run lint -w backend        # Run ESLint
npm run test -w backend        # Run Jest tests
npm run test:watch -w backend  # Jest watch mode
npm run seed -w backend        # Seed database
```

### Frontend Only
```bash
npm run dev -w frontend        # Start Vite dev server
npm run build -w frontend      # Build for production
npm run preview -w frontend    # Preview production build
npm run lint -w frontend       # Run ESLint
```

## Development Workflow

For detailed development guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md)

Note: source files under frontend/src/legacy are retained as reference only and are not the main app shell.

## CI/CD
Workflow file: .github/workflows/ci.yml

Included jobs:
- frontend build
- backend build
- backend tests (Jest + Supertest)

## Future FastAPI Integration
- Backend has FASTAPI_URL env and route placeholder:
  - GET /api/v1/integrations/fastapi/ping
- Add a FastAPI service later and call it from backend services.

Read module-specific docs:
- frontend/README.md
- backend/README.md
- tests/README.md
#   e l - p r o y e c t o - d e - a n o s - f i n a l 
 
 