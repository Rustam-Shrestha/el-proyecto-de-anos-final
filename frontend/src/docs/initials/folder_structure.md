# Complete Project Structure Documentation

A comprehensive guide to understanding the entire frontend, backend, and project structure.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Root Level Files](#root-level-files)
3. [Backend Structure & Explanation](#backend-structure--explanation)
4. [Frontend Structure & Explanation](#frontend-structure--explanation)
5. [Node Modules Overview](#node-modules-overview)
6. [Architecture Patterns](#architecture-patterns)

---

## Project Overview

This is a **Full-Stack Web Application** built with:
- **Backend**: Node.js/Express with TypeScript
- **Frontend**: React with TypeScript, Redux, and Tailwind CSS
- **Database**: PostgreSQL (or in-memory for testing)
- **Authentication**: JWT + OAuth2 support
- **API Documentation**: Swagger/OpenAPI

---

## Root Level Files

```
📁 Project Root
├── CONTRIBUTING.md          # Guidelines for contributing to the project
├── docker-compose.yml       # Docker setup for running the entire app
├── FRONTEND_CLEANUP.md      # Notes on frontend refactoring/cleanup tasks
├── package.json             # Root-level dependencies (if any)
├── README.md                # Main project documentation
├── frontend/                # React frontend application
├── backend/                 # Node.js/Express backend application
├── tests/                   # End-to-end tests
└── infra/                   # Infrastructure scripts
```

---

## BACKEND STRUCTURE & EXPLANATION

### Backend Root Directory
```
backend/
├── .env.example             # Example environment variables (copy to .env)
├── Dockerfile               # Instructions to create backend Docker image
├── README.md                # Backend documentation
├── eslint.config.js         # Code quality linting rules
├── jest.config.ts           # Test framework configuration
├── package.json             # Backend dependencies list
├── tsconfig.json            # TypeScript compiler configuration
├── tsconfig.test.json       # TypeScript config for tests
├── migrations/              # Database schema changes
├── src/                     # Source code (production code)
└── tests/                   # Test files (unit/integration tests)
```

---

### Backend `/src` Directory - Complete Breakdown

```
src/
├── app.ts                   # Express app configuration
├── server.ts                # Server startup & DB initialization
├── seed.ts                  # Database seeding script
├── config/                  # Configuration files
├── controllers/             # HTTP request handlers
├── routes/                  # API endpoint definitions
├── services/                # Business logic layer
├── middleware/              # Request processing middleware
├── models/                  # TypeScript type definitions
├── db/                      # Database connection & initialization
├── docs/                    # API documentation
├── types/                   # TypeScript type augmentation
└── utils/                   # Helper functions
```

---

### Backend Folder Details (For Beginners)

#### **`config/` - Configuration Management**
**What it does**: Stores all app settings and configuration.

| File | Purpose | Real-World Use |
|------|---------|-----------------|
| `env.ts` | Validates environment variables using Zod schema | Ensures config like DB_URL, JWT_SECRET are present before app starts |
| `logger.ts` | Sets up logging system (Pino logger) | Logs errors, info messages differently in dev vs production |

**Why you need it**: Instead of hardcoding settings, you read them from environment variables. This allows the same code to run in development, testing, and production with different configurations.

---

#### **`controllers/` - HTTP Request Handlers**
**What it does**: Receives HTTP requests and returns responses.

| File | Purpose | Real-World Scenario |
|------|---------|-----------------|
| `authController.ts` | Handles login/logout requests | User enters email/password → validates → returns JWT token |
| `userController.ts` | Handles user listing & creation | Admin clicks "Create User" → backend creates user in DB |
| `healthController.ts` | Checks if server is running | DevOps tool pings `/health` to verify service is up |

**Why you need it**: Controllers are like "landing pads" for requests. They decide what to do with incoming data.

**Architecture Flow**:
```
Request (email/password) 
  ↓
Controller (validateInput) 
  ↓
Service (checkCredentials, create JWT) 
  ↓
Database (query users table)
  ↓
Response (JWT token)
```

---

#### **`services/` - Business Logic Layer**
**What it does**: Contains the actual logic of your app (not DB, not HTTP).

| File | Purpose | Real-World Logic |
|------|---------|-----------------|
| `authService.ts` | Authentication logic (verify password, create tokens) | Checks if password matches, generates JWT token |
| `userService.ts` | User operations (create user, hash password) | Creates new user account, securely stores password |
| `tokenService.ts` | JWT token generation | Creates signed tokens that expire after 24 hours |
| `auditService.ts` | Logging user actions | Tracks who did what and when (admin deleted user X at 3PM) |

**Why separate from controllers?**: Services are reusable. You might need "create user" from an API endpoint AND a batch import script. Services keep code DRY (Don't Repeat Yourself).

---

#### **`middleware/` - Request Processing**
**What it does**: Processes requests BEFORE they reach controllers.

| File | Purpose | Real-World Use |
|------|---------|-----------------|
| `auth.ts` | Checks if user is logged in | Extracts JWT token from header, verifies it's valid |
| `rbac.ts` | Checks user permissions/roles | Only admins can delete users, staff can only view data |
| `requestValidation.ts` | Validates request format | Ensures email field is actually an email, password isn't empty |
| `errorHandler.ts` | Catches all errors | If something crashes, returns friendly error message instead of blank screen |
| `notFound.ts` | Handles 404 errors | If user hits `/api/unknown-endpoint`, returns 404 |
| `oauth2.ts` | OAuth2 authentication | Allows login via Google/GitHub accounts |

**Why middleware?**: Instead of checking permissions in EVERY controller method, middleware checks once upfront. Like a security guard at building entrance.

**Example Flow**:
```
Request → Auth middleware (verify JWT) 
        → RBAC middleware (check role) 
        → Validation middleware (validate data) 
        → Controller (business logic) 
        → Response
```

---

#### **`routes/` - API Endpoint Definitions**
**What it does**: Maps URLs to controller functions.

| File | Purpose | Real-World Example |
|------|---------|-----------------|
| `index.ts` | Main router, combines all routes | Registers `/api/v1/*` prefix for all endpoints |
| `authRoutes.ts` | Auth endpoints | `POST /api/v1/auth/login` |
| `userRoutes.ts` | User endpoints | `GET /api/v1/users`, `POST /api/v1/users` |
| `healthRoutes.ts` | Health check endpoints | `GET /api/v1/health` |
| `schemas.ts` | Request validation rules | Defines what fields are required for login, user creation |

**Why you need it**: Routes organize your API. Without routes, the server wouldn't know which function to call for each URL.

---

#### **`models/` - Data Type Definitions**
**What it does**: Defines the shape of your data (TypeScript types).

| File | Purpose | Example |
|------|---------|---------|
| `userModel.ts` | Defines what a User looks like | `User { id, email, password_hash, role, created_at }` |

**Why you need it**: TypeScript catches bugs BEFORE runtime. If you try to access `user.invalid_field`, TypeScript yells at you immediately.

---

#### **`db/` - Database Layer**
**What it does**: Manages database connections and initialization.

| File | Purpose | Real-World Use |
|------|---------|-----------------|
| `pool.ts` | Connection pooling | Maintains pool of DB connections for reuse (faster than creating new connection per request) |
| `init.ts` | Creates tables & inserts seed data | On first run, creates users/roles tables, adds default admin user |

**Why pool connections?**: Creating a DB connection is slow (~500ms). With pooling, connections are reused, making queries fast.

---

#### **`types/` - TypeScript Augmentation**
**What it does**: Extends TypeScript types for libraries.

| File | Purpose | Example |
|------|---------|---------|
| `express.d.ts` | Extends Express Request type | Adds `req.user` property with `id`, `email`, `role` |

**Why you need it**: Express doesn't know about your custom properties. This file tells TypeScript "yes, `req.user` exists".

---

#### **`docs/` - API Documentation**
**What it does**: Auto-generates Swagger/OpenAPI documentation.

| File | Purpose | Real-World Use |
|------|---------|-----------------|
| `openapi.ts` | Generates Swagger spec | Frontend developers see API docs at `/docs` endpoint, test endpoints interactively |

---

#### **`utils/` - Helper Functions**
**What it does**: Reusable utility functions used across the app.

| File | Purpose | Example |
|------|---------|---------|
| `apiResponse.ts` | Formats consistent API responses | `ok({users: []})` returns `{success: true, data: {users: []}}` |
| `pagination.ts` | Handles page/limit query params | `?page=2&limit=20` returns 20 items from page 2 |

**Why you need it**: Avoids repeating code. Instead of writing response formatting in 50 places, write once in `apiResponse.ts`.

---

### Backend `/migrations` Directory
```
migrations/
└── 001_init.sql    # Initial database schema (creates tables)
```

**Purpose**: Contains SQL scripts that create/modify database schema. Each migration is numbered (001, 002, etc.) for version control.

**Real-World Example**:
- Migration 001: Create users table
- Migration 002: Add "role" column to users table
- Migration 003: Create audit_logs table

---

### Backend `/tests` Directory
```
tests/
├── auth.test.ts       # Tests for authentication logic
├── users.test.ts      # Tests for user operations
└── setup-env.ts       # Test environment setup
```

**Purpose**: Unit and integration tests. Tests verify that your code works as expected BEFORE deploying.

**Real-World Example**: 
```typescript
test("login with valid credentials returns JWT", () => {
  const result = authService.login("user@example.com", "password123");
  expect(result.token).toBeDefined();
});
```

---

## FRONTEND STRUCTURE & EXPLANATION

### Frontend Root Directory
```
frontend/
├── .env.example             # Example environment variables
├── Dockerfile               # Docker configuration for frontend
├── README.md                # Frontend documentation
├── eslint.config.js         # Code quality/linting rules
├── index.html               # HTML entry point (loads React app)
├── package.json             # Dependencies list
├── postcss.config.cjs       # PostCSS configuration (CSS processing)
├── tailwind.config.cjs      # Tailwind CSS configuration
├── tsconfig.*.json          # TypeScript configurations
├── vite.config.ts           # Vite build tool configuration
├── src/                     # React source code
└── node_modules/            # Installed dependencies
```

---

### Frontend `/src` Directory - Complete Breakdown

```
src/
├── main.tsx                 # React entry point
├── vite-env.d.ts            # TypeScript definitions for Vite
├── app/                     # App core setup
├── assets/                  # Static files (images, icons, styles)
├── auth/                    # Authentication module
├── components/              # Reusable UI components
├── context/                 # React Context API state
├── features/                # Feature modules (auth, users, ui)
├── helper/                  # Utility helper functions
├── hooks/                   # Custom React hooks
├── pages/                   # Full-page components
├── providers/               # Root app providers
├── services/                # API services & integration
├── shared/                  # Shared code across features
├── store/                   # Redux state management
├── styles/                  # Global CSS
└── types/                   # TypeScript definitions
```

---

### Frontend Folder Details (For Beginners)

#### **`app/` - Application Core Setup**
**What it does**: Configures the React application.

| File | Purpose | Real-World Use |
|------|---------|-----------------|
| `queryClient.ts` | React Query configuration | Caches API responses for faster page loads |
| `router.tsx` | React Router setup | Defines which pages show at which URLs |
| `store.ts` | Redux store initialization | Sets up the state management system |

**Why you need it**: This is where you configure all the "systems" your app uses (APIs, routing, state).

---

#### **`assets/` - Static Files**
**What it does**: Stores images, icons, and global styles.

```
assets/
├── data/          # Large static data files (icon definitions)
└── styles/        # Global CSS files
```

**Why you need it**: Keep media files organized. Makes HTML cleaner: `<img src="/assets/logo.png" />`.

---

#### **`components/` - Reusable UI Components**
**What it does**: Contains all reusable UI pieces (buttons, inputs, tables).

| Subfolder | Components | Real-World Use |
|-----------|-----------|-----------------|
| (root) | `header.tsx`, `footer.tsx`, `page.tsx` | Page layout shells |
| `common/` | 24+ components: Button, InputField, SelectField, Modal, TableView | Reusable UI widgets used across multiple pages |

**Why separate?**: Instead of writing `<button>` HTML 100 times, write `<Button />` component once. Changes to Button styling automatically apply everywhere.

**Example**:
```typescript
// components/common/Button.tsx
export const Button = ({label, onClick}) => (
  <button onClick={onClick} className="bg-blue-500 text-white px-4 py-2 rounded">
    {label}
  </button>
);

// Can use in 50 places with same styling
<Button label="Save" onClick={handleSave} />
```

---

#### **`context/` - React Context API**
**What it does**: Global state using React Context (simpler alternative to Redux).

| File | Purpose | Real-World Use |
|------|---------|-----------------|
| `ThemeContext.tsx` | Dark/light theme toggle | User clicks "dark mode" → theme changes across entire app |

**Why you need it**: Some state (like theme) is used everywhere. Don't want to pass it through 10 component layers. Context makes it globally accessible.

---

#### **`features/` - Feature-Based Organization**
**What it does**: Self-contained modules for major features (Auth, Users, UI).

**Architecture Pattern**:
```
features/
├── auth/          # Everything related to authentication
│   ├── api/       # API calls (login, logout)
│   ├── pages/     # LoginPage component
│   ├── store/     # Redux auth state
│   └── ...
├── users/         # Everything related to user management
│   ├── api/       # API calls (get users, create user)
│   ├── pages/     # UsersPage, UserAccessPage
│   ├── hooks/     # useUsers custom hook
│   └── ...
└── ui/            # UI state management
    └── store/     # Redux UI state
```

**Why this pattern?**: Makes code maintainable. All auth code is together. All user code is together. Easy to find and modify.

**Real-World Scenario**:
```
Feature "Add User" requires changes:
  1. API endpoint → features/users/api/usersApi.ts
  2. Page UI → features/users/pages/UsersPage.tsx
  3. State → features/users/store/ or features/users/hooks/useUsers.ts
  
Everything is in ONE feature folder. Much easier than searching entire project.
```

---

#### **`helper/` - Utility Functions**
**What it does**: Formatting and utility functions for common operations.

| File | Purpose | Real-World Use |
|------|---------|-----------------|
| `numberFormatters.ts` | Format numbers (1000000 → 1,000,000) | Display prices, large numbers with commas |
| `timesheetFormatters.ts` | Format time/duration | Display "2 hours 30 minutes" readable way |
| `exportToExcel.tsx` | Export data to Excel | User clicks "Download as Excel" |
| `addressFields.tsx` | Handle address form fields | Multi-field address input (street, city, zip) |

**Why you need it**: Formatting logic is separate from UI. Makes it reusable and testable.

---

#### **`hooks/` - Custom React Hooks**
**What it does**: Reusable logic for common operations.

| Hook | Purpose | Real-World Use |
|------|---------|-----------------|
| `useAuth()` | Get current user, login, logout | Any page can use `const {user, login} = useAuth()` |
| `useApiQuery()` | Fetch data from API | Calls API, handles loading/error states automatically |
| `useFormValidation()` | Form validation logic | Validates form fields in real-time |
| `useDebounce()` | Debounce input changes | Search input: waits 300ms before searching |
| `useConfirmation()` | Show confirmation dialog | "Delete this user?" dialog before deletion |
| `useClickOutside()` | Detect clicks outside element | Close dropdown menu when clicking elsewhere |
| `useUI()` | Access UI state | Get/set global UI state (sidebar open/closed) |

**Why you need it**: Hooks are reusable logic. Don't repeat form validation code in 20 components.

**Example**:
```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState(null);
  
  const login = (email, password) => {
    // Login logic
  };
  
  return {user, login};
};

// Any component can use:
const MyComponent = () => {
  const {user} = useAuth();
  return <p>Hello {user.name}</p>;
};
```

---

#### **`pages/` - Full-Page Components**
**What it does**: Top-level page components (each URL gets one page).

| File | Purpose | URL Example |
|------|---------|-------------|
| `DashboardPage.tsx` | Main dashboard | `/dashboard` |
| `AccessDeniedPage.tsx` | Permission denied error | `/403` |
| `NotFoundPage.tsx` | Page not found error | `/404` or unknown URL |

**Why separate?**: Pages are composed of multiple components. Keeping them separate from reusable components keeps code organized.

---

#### **`providers/` - Root Application Providers**
**What it does**: Wraps entire React app with required providers.

**Example Provider Setup**:
```typescript
// providers/AppProviders.tsx
export const AppProviders = ({children}) => (
  <ReduxProvider>
    <RouterProvider>
      <ThemeProvider>
        <QueryClientProvider>
          {children}
        </QueryClientProvider>
      </ThemeProvider>
    </RouterProvider>
  </ReduxProvider>
);
```

**Why you need it**: React libraries (Redux, Router, Theme) need to wrap the entire app. This file organizes that.

---

#### **`services/` - API Integration**
**What it does**: Handles all communication with the backend.

| File | Purpose | Real-World Use |
|------|---------|-----------------|
| `apiService.ts` | Main HTTP client | Makes GET/POST/PUT/DELETE requests |
| `endpoints/index.ts` | API URLs (constants) | `const URL = "/api/v1/users"` instead of hardcoding |
| `queryClient.ts` | React Query instance | Manages API response caching |
| `timesheetService.ts` | Timesheet API operations | Fetch/update timesheet data |
| `periodicService.ts` | Scheduled operations | Run tasks on timer (refresh data every 5 min) |

**Why separate?**: If backend URL changes, change in ONE place. Services are like "translators" between React UI and backend API.

**Example**:
```typescript
// services/endpoints/index.ts
export const API_URLs = {
  LOGIN: '/api/v1/auth/login',
  USERS: '/api/v1/users',
  HEALTH: '/api/v1/health'
};

// services/apiService.ts
export const apiService = {
  login: (email, password) => 
    fetch(API_URLs.LOGIN, {method: 'POST', body: ...})
};
```

---

#### **`shared/` - Shared Code**
**What it does**: Code used across multiple features.

```
shared/
├── components/        # Shared UI components
│   ├── Modal/         # Reusable modal dialog
│   ├── auth/          # Admin protection component
│   └── layout/        # Layout wrappers
├── hooks/             # Shared custom hooks
├── lib/               # Utility libraries
│   └── apiClient.ts   # HTTP client configuration
└── validation/        # Form validation schemas
    └── authSchemas.ts # Auth validation rules
```

**Why you need it**: Some components/code are used by multiple features. Putting them in `shared/` makes it clear they're shared.

---

#### **`store/` - Redux State Management**
**What it does**: Centralized state management for the entire app.

```
store/
├── index.ts                    # Store configuration
└── slices/                     # Redux state slices
    ├── authSlice.ts            # Auth state (current user, login status)
    ├── accountSlice.ts         # Account info
    └── uiSlice.ts              # UI state (sidebar open/closed)
```

**Why you need it**: Instead of passing props through 50 components, keep state in Redux. Any component can access any state.

**Example**:
```typescript
// store/slices/authSlice.ts
const authSlice = createSlice({
  name: 'auth',
  initialState: {user: null, token: null},
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    }
  }
});

// Any component can access:
const MyComponent = () => {
  const user = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  return <p>Hello {user.name}</p>;
};
```

---

#### **`types/` - TypeScript Definitions**
**What it does**: TypeScript type definitions for the frontend.

| File | Purpose | Example |
|------|---------|---------|
| `legacy-modules.d.ts` | Type definitions for legacy/external modules | Tells TypeScript "this library exists even if types are missing" |

---

#### **`styles/` - Global CSS**
**What it does**: Global styling applied to entire app.

```
styles/
└── global.css    # Global CSS (colors, fonts, base styles)
```

**Used with**: Tailwind CSS for utility classes + global.css for base styles.

---

## NODE MODULES OVERVIEW

The `node_modules/` folder contains all installed dependencies. It's auto-generated and shouldn't be committed to git.

### Key Dependencies by Category

#### **Frontend Build & Development**
```
@vitejs/           → Vite build tool plugins
vite/              → Modern bundler (much faster than Webpack)
typescript/        → TypeScript compiler
eslint/            → Code quality linter
postcss/           → CSS processing
tailwindcss/       → Utility-first CSS framework
```

#### **React & State Management**
```
react/             → UI library
react-dom/         → React rendering for web
react-router/      → Client-side routing
react-router-dom/  → DOM-specific routing utilities
redux/             → State management
react-redux/       → React bindings for Redux
@reduxjs/          → Redux official utilities
@tanstack/         → TanStack libraries (React Query)
```

#### **Form Handling & Validation**
```
react-hook-form/   → Lightweight form state management
zod/               → TypeScript-first validation
@hookform/         → Form integration libraries
```

#### **HTTP Requests**
```
axios/             → HTTP client (makes API calls)
```

#### **Utilities**
```
chalk/             → Terminal colors/styling
@babel/            → JavaScript transpiler (older browser support)
```

**Note**: Most dependencies are peer dependencies for TypeScript, React, and tooling. You typically don't use them directly, but they're required by other packages.

---

## ARCHITECTURE PATTERNS

### Backend Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  HTTP REQUEST (Client)                   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              MIDDLEWARE LAYER (routes/)                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 1. Auth Middleware (verify JWT)                   │  │
│  │ 2. Validation Middleware (validate request)       │  │
│  │ 3. RBAC Middleware (check permissions)            │  │
│  │ 4. Error Handler (catch exceptions)               │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│             CONTROLLER LAYER (controllers/)             │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Parse request → Call service → Return response   │  │
│  │ (No business logic, just HTTP handling)           │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│             SERVICE LAYER (services/)                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Business logic:                                   │  │
│  │ • Verify password                                │  │
│  │ • Create JWT token                               │  │
│  │ • Hash passwords                                 │  │
│  │ • Log audit events                               │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│             DATABASE LAYER (db/)                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │ • Query users table                               │  │
│  │ • Insert audit logs                               │  │
│  │ • Manage transactions                             │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
                    PostgreSQL DB
```

### Frontend Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    INDEX.HTML                            │
│              (Static entry point)                        │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                  MAIN.TSX                                │
│         (React app initialization)                       │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│            PROVIDERS (AppProviders)                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Redux Provider                                   │   │
│  │ Router Provider                                  │   │
│  │ Theme Provider                                   │   │
│  │ React Query Provider                             │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                    PAGES                                 │
│  ├─ DashboardPage                                       │
│  ├─ LoginPage                                           │
│  └─ UsersPage                                           │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                  FEATURES                                │
│  ├─ auth/    (Auth-related logic & components)         │
│  ├─ users/   (User management logic & components)      │
│  └─ ui/      (UI state management)                      │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                COMPONENTS & HOOKS                        │
│  ├─ components/   (Reusable UI components)             │
│  ├─ hooks/        (Custom React hooks)                 │
│  ├─ services/     (API calls)                          │
│  └─ shared/       (Shared code)                        │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                 REDUX STORE                              │
│  ├─ authSlice     (Current user, login state)          │
│  ├─ accountSlice  (Account information)                │
│  └─ uiSlice       (UI state: sidebar, theme)           │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│              API SERVICE LAYER                           │
│  ├─ apiService.ts    (HTTP client)                     │
│  ├─ endpoints/       (API URLs)                        │
│  └─ queryClient.ts   (React Query caching)             │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
                  Backend API (/api/v1/*)
```

---

## Quick Reference Guide

### Common Development Tasks

#### Adding a New Backend API Endpoint
1. Create route in `routes/authRoutes.ts` (or appropriate file)
2. Add request validation schema in `routes/schemas.ts`
3. Create controller function in `controllers/authController.ts`
4. Create service function in `services/authService.ts`
5. Add business logic (database query, password hashing, etc.)
6. Test in `/docs` Swagger endpoint

#### Adding a New Frontend Feature
1. Create feature folder: `features/newFeature/`
2. Create API service: `features/newFeature/api/`
3. Create pages: `features/newFeature/pages/`
4. Create Redux slice if needed: `store/slices/newFeatureSlice.ts`
5. Create custom hooks if needed: `features/newFeature/hooks/`
6. Use in Pages → Components → Hooks pattern

#### Styling Component
1. Use Tailwind CSS classes (utility-first)
2. Example: `<button className="bg-blue-500 text-white px-4 py-2 rounded">`
3. For complex styles, create CSS in `styles/global.css`
4. Use CSS variables for consistency: `var(--primary-color)`

---

## Summary

| Layer | Purpose | Example |
|-------|---------|---------|
| **Frontend UI** | What users see and interact with | Buttons, forms, tables, pages |
| **Components** | Reusable UI pieces | `<Button>`, `<InputField>`, `<Modal>` |
| **Hooks** | Reusable logic | Auth, form validation, API queries |
| **Services** | API integration | HTTP requests, data fetching |
| **State** | Global app state | Redux store (auth, UI state) |
| **Routes** | URL mapping | `/dashboard` → DashboardPage |
| **Backend API** | Business logic & data | Process requests, query database |
| **Controllers** | Request handlers | Receive request, call service, return response |
| **Services** | Business logic | Auth logic, password hashing, validation |
| **Middleware** | Request processing | Auth, validation, error handling |
| **Database** | Data persistence | Store users, audit logs, etc. |

---

## Tips for Beginners

✅ **Do's**:
- Keep components small and reusable
- Use custom hooks for logic
- Use services for API calls
- Follow folder structure conventions
- Use TypeScript for type safety

❌ **Don'ts**:
- Don't put business logic in components
- Don't hardcode API URLs
- Don't repeat code (use services/hooks/utils)
- Don't call APIs directly in components (use custom hooks)
- Don't ignore TypeScript errors

---

**Last Updated**: April 30, 2026
