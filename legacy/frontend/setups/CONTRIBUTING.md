# Contributing to ProjectIII

## Project Overview

This is a full-stack PERN (PostgreSQL, Express, React, Node.js) + TypeScript monorepo application with:
- **Backend (Node)**: Express.js API with PostgreSQL, JWT auth, RBAC, and optional OAuth2
- **Backend (FastAPI)**: Python FastAPI service for KYC/OCR/face verification
- **Frontend**: React + Redux Toolkit + TanStack Query + Tailwind CSS
- **E2E Tests**: Playwright test suite
- **Infrastructure**: Docker support with Docker Toolbox compatibility scripts

## Getting Started

### Prerequisites
- Node.js >= 20.11.0
- npm >= 9.0
- PostgreSQL 16 (local or Docker)

### Installation

```bash
# Install root dependencies (npm workspaces)
npm install

# Start development servers (backend + frontend)
npm run dev

# Or run individually
npm run dev:backend   # Express on http://localhost:4000
npm run dev:frontend  # Vite on http://localhost:5173
```

### Environment Setup

1. **Backend (Node)**: Copy `backend-node/.env.example` to `backend-node/.env` and update values
2. **Backend (FastAPI)**: Copy `backend-fastapi/.env.example` to `backend-fastapi/.env` if needed
3. **Frontend**: Copy `frontend/.env.example` to `frontend/.env` if needed

## Project Structure

```
projectIII/
├── .github/workflows/      # CI/CD pipelines
├── backend-node/           # Express API
├── backend-fastapi/        # FastAPI KYC service
│   ├── app/                # FastAPI application package
│   │   ├── api/            # API routers
│   │   ├── config.py       # Pydantic settings
│   │   ├── db/             # SQLAlchemy async session
│   │   ├── models/         # ORM models
│   │   └── services/       # OCR/face verification services
│   ├── scripts/            # PowerShell helpers
│   ├── main.py             # FastAPI entry point
│   └── requirements.txt    # Python dependencies
├── frontend/              # React + Vite app
│   ├── src/
│   │   ├── api/          # API integration
│   │   ├── app/          # Core app setup (router, store)
│   │   ├── assets/       # Images, styles, data
│   │   ├── auth/         # Authentication
│   │   ├── components/   # Reusable components
│   │   ├── context/      # React Context
│   │   ├── features/     # Feature modules (auth, ui, users)
│   │   ├── helper/       # Utility functions
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components
│   │   ├── providers/    # Context providers
│   │   ├── services/     # API services
│   │   ├── shared/       # Shared utilities
│   │   ├── store/        # Redux store
│   │   ├── styles/       # Global styles
│   │   ├── types/        # TypeScript types
│   │   └── main.tsx      # Entry point
│   └── package.json
├── tests/e2e/             # Playwright E2E tests
├── infra/                 # Infrastructure scripts
│   └── scripts/          # Docker Toolbox helpers
├── .editorconfig          # Editor consistency
├── .gitignore             # Git ignore rules
├── .npmrc                 # NPM configuration
├── .prettierrc            # Code formatting config
├── .prettierignore        # Prettier ignore rules
├── docker-compose.toolbox.yml  # Development Docker setup
├── package.json           # Root workspace config
└── README.md              # Project documentation
```

## Development Workflow

### Code Style

- **EditorConfig**: Ensures consistent formatting across editors (see `.editorconfig`)
- **ESLint**: TypeScript/JavaScript linting in `backend-node` and `frontend`
- **Prettier**: Code formatting (auto-run via editor or manually with `npm run format`)

### Running Commands

Use npm workspace flags (`-w`) when running scripts:

```bash
# Backend (Node) only
npm run lint -w backend-node
npm run test -w backend-node
npm run build -w backend-node
npm run dev -w backend-node
npm run seed -w backend-node

# Frontend only
npm run lint -w frontend
npm run build -w frontend
npm run dev -w frontend

# All workspaces
npm run lint
npm run build
npm run test
```

### Creating Features

#### Backend (Node)
1. Create controller in `backend-node/src/controllers/`
2. Add business logic in `backend-node/src/services/`
3. Define routes in `backend-node/src/routes/`
4. Add TypeScript types in `backend-node/src/types/`
5. Write tests in `backend-node/tests/`

#### Frontend
1. Create feature module in `frontend/src/features/<feature>/`
2. Add API integration in `frontend/src/api/`
3. Create components in `frontend/src/components/`
4. Add custom hooks if needed in `frontend/src/hooks/`
5. Integrate with Redux store in `frontend/src/store/`

## Database

### Migrations
SQL migrations go in `backend-node/migrations/` with format `NNN_description.sql`.

### Seeding
Run database seed script:
```bash
npm run seed -w backend-node
```

## Testing

### Backend Tests (Jest)
```bash
npm run test -w backend-node          # Run tests
npm run test:watch -w backend-node    # Watch mode
```

### E2E Tests (Playwright)
```bash
npm run test -w tests/e2e
```

## Building for Production

```bash
# Build all workspaces
npm run build

# Build specific workspace
npm run build -w backend-node
npm run build -w frontend

# Start production server
npm start -w backend-node
```

## Docker

### Development (Docker Toolbox)
```bash
# Start services
./infra/scripts/toolbox-up.ps1

# Stop services
./infra/scripts/toolbox-down.ps1
```

### Production
Use `Dockerfile` in backend-node, backend-fastapi, and frontend directories. Build and push to your registry.

## Code Conventions

### TypeScript
- Strict mode enabled in `tsconfig.json`
- Use explicit types (avoid `any`)
- Define interfaces for API responses and requests

### React/Frontend
- Functional components with hooks
- Use Redux for global state
- Use React Query for server state
- Use TanStack Query for API calls
- Tailwind CSS for styling

### Backend/Express
- Use middleware for cross-cutting concerns
- Define request/response schemas with Zod
- Return consistent API response format
- Use JWT for auth, RBAC for authorization
- Log important events with Pino logger

## Git Workflow

1. Create a branch from `develop` for new features
2. Make focused, atomic commits with clear messages
3. Write meaningful commit messages:
   - `feat: add user dashboard`
   - `fix: resolve auth token expiry issue`
   - `refactor: improve error handling middleware`
   - `docs: update API documentation`
4. Create a Pull Request with detailed description
5. Ensure CI passes and code review is approved
6. Squash and merge to `develop`

## Common Issues & Solutions

### Port Already in Use
```bash
# Backend (4000) or Frontend (5173) port conflict
# Windows:
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify DATABASE_URL in `.env`
- Check DB credentials in `backend-node/.env.example`

### npm Workspace Issues
```bash
# Clean and reinstall
rm -r node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

## Performance Tips

- Use React DevTools and Redux DevTools for debugging
- Monitor bundle size with Vite's build report
- Use React Query for efficient data fetching
- Implement code splitting in frontend routes
- Use database indexes for frequently queried fields

## Security Considerations

- Rotate JWT secrets in production
- Use HTTPS in production
- Sanitize user inputs (Zod validation)
- Implement rate limiting on API endpoints
- Use CORS properly (allowed origins in `backend-node/.env`)
- Keep dependencies updated regularly

## Deployment

- Ensure all environment variables are set in production
- Run migrations before deploying
- Build both backend and frontend
- Use CI/CD pipeline (GitHub Actions ready)
- Monitor logs and errors post-deployment

## Questions or Issues?

Open an issue in GitHub or contact the development team.

Happy coding! 🚀
