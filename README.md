# PERN + TypeScript Baseline (Docker Toolbox Compatible)

A professional, scalable full-stack monorepo scaffold for ERP-style academic projects.

## Tech Stack
- **Frontend**: React + TypeScript + Redux Toolkit + TanStack Query + Tailwind CSS + Zod
- **Backend**: Express + TypeScript + PostgreSQL + JWT/RBAC + optional OAuth2 + OpenAPI docs
- **Testing**: Playwright E2E tests, Jest for backend
- **Infrastructure**: Docker Toolbox support, GitHub Actions CI/CD
- **Development**: npm workspaces, Vite, ESLint, Prettier, EditorConfig

## Project Architecture

This is a **monorepo using npm workspaces** with:
- Single `node_modules` at project root (shared dependencies)
- Separate `backend`, `frontend`, and `tests/e2e` workspaces
- Consistent configuration across all packages
- Professional CI/CD with GitHub Actions

### Why node_modules is at repository root
Dependencies are installed once in root and shared by all workspaces to reduce duplication and improve install speed. Individual workspace `node_modules` directories are not needed.

Run scripts with `-w` flag:
```bash
npm run dev -w backend        # Backend only
npm run dev -w frontend       # Frontend only
npm run dev                   # All workspaces
```

## Environment files
- Frontend template: `frontend/.env.example`
- Backend template: `backend/.env.example`

**Setup**:
1. Copy `frontend/.env.example` → `frontend/.env`
2. Copy `backend/.env.example` → `backend/.env`
3. Update values as needed (DB credentials, JWT secrets, etc.)

**Note**: `.env` files are git-ignored and won't be committed (see `.gitignore`)

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

## Quick Start (Local Development)

### Prerequisites
- **Node.js**: >= 20.11.0 (check with `node -v`)
- **npm**: >= 9.0 (includes automatically)
- **PostgreSQL**: 16 (local or Docker)

### Setup

```bash
# 1. Install dependencies (once, shared via workspaces)
npm install

# 2. Configure environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your settings

# 3. Start development servers
npm run dev
# Backend:  http://localhost:4000
# Frontend: http://localhost:5173
# API Docs: http://localhost:4000/docs
```

## Docker Toolbox Start
1. Ensure Docker Toolbox VM is running
2. Run: `powershell -ExecutionPolicy Bypass -File infra/scripts/toolbox-up.ps1`
3. Stop: `powershell -ExecutionPolicy Bypass -File infra/scripts/toolbox-down.ps1`

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
#   e l - p r o y e c t o - d e - a n o s - f i n a l  
 