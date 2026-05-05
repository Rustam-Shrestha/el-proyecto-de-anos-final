# GitHub Copilot Instructions

> **Purpose**: This file documents the project's architecture, coding patterns, and conventions. GitHub Copilot refers to this file to maintain consistency across the codebase and avoid breaking existing patterns.

---

## 📋 Project Overview

**Full-Stack Application**: Express.js Backend (backend-node) + FastAPI Backend (backend-fastapi) + React Frontend
- **Frontend**: React 18 + TypeScript + Vite + Redux Toolkit + TanStack Query + Tailwind CSS
- **Backend (Node)**: Express.js + TypeScript + PostgreSQL + JWT Auth + RBAC
- **Backend (FastAPI)**: Python + FastAPI + SQLAlchemy (async)
- **Architecture**: Modular, feature-based, fully typed, test-driven

---

## 🔧 Backend Architecture (Express.js + TypeScript) - backend-node

### Folder Structure & Path Aliases

```
backend-node/src/
├── app.ts                  # Express app configuration
├── server.ts               # Server entry point
├── config/                 # Environment & logging config
│   ├── env.ts             # Zod-validated environment variables
│   └── logger.ts          # Pino logger setup
├── controllers/            # HTTP request handlers
│   ├── authController.ts
│   ├── userController.ts
│   └── healthController.ts
├── services/              # Business logic layer
│   ├── authService.ts
│   ├── userService.ts
│   ├── tokenService.ts
│   └── auditService.ts
├── models/                # TypeScript type definitions
│   └── userModel.ts
├── routes/                # Route definitions & schemas
│   ├── index.ts          # Router aggregation
│   ├── authRoutes.ts
│   ├── userRoutes.ts
│   ├── healthRoutes.ts
│   └── schemas.ts        # Zod validation schemas
├── middleware/            # Cross-cutting concerns
│   ├── auth.ts           # JWT authentication
│   ├── rbac.ts           # Role-based access control
│   ├── requestValidation.ts  # Zod validation middleware
│   ├── errorHandler.ts   # Error handling
│   ├── notFound.ts       # 404 handler
│   └── oauth2.ts         # OAuth strategy setup (optional)
├── db/                    # Database layer
│   ├── pool.ts           # Connection pool
│   └── init.ts           # Database initialization
├── docs/                  # API documentation
│   └── openapi.ts        # Swagger/OpenAPI spec
├── types/                 # Global TypeScript definitions
│   └── express.d.ts      # Express request augmentation
└── utils/                 # Utility functions
    ├── apiResponse.ts    # Response formatting
    └── pagination.ts     # Pagination helpers
```

**Path Aliases** (defined in `tsconfig.json`):
```typescript
"@config/*": ["./src/config/*"],
"@controllers/*": ["./src/controllers/*"],
"@services/*": ["./src/services/*"],
"@routes/*": ["./src/routes/*"],
"@middleware/*": ["./src/middleware/*"],
"@models/*": ["./src/models/*"],
"@db/*": ["./src/db/*"],
"@types/*": ["./src/types/*"],
"@utils/*": ["./src/utils/*"]
```

**Always use path aliases in imports** — never use relative paths:
```typescript
// ✅ Good
import { loginUser } from "@services/authService";
import { logger } from "@config/logger";
import { requireAuth } from "@middleware/auth";

// ❌ Bad
import { loginUser } from "../../services/authService";
import logger from "../config/logger";
```

---

### Controller-Service-Model Pattern

**Controllers** → Request Handling → Response
```typescript
// @controllers/userController.ts
export const listUsersController = async (req: Request, res: Response) => {
  const { page, limit, offset } = parsePagination(req);
  const { users, total } = await listUsers(limit, offset);

  return res.json({
    success: true,
    data: users,
    meta: { page, limit, total }
  });
};
```

**Services** → Business Logic
```typescript
// @services/userService.ts
export const listUsers = async (limit: number, offset: number) => {
  const dataResult = await pool.query(
    `SELECT u.id, u.email, r.name AS role FROM users u
     JOIN roles r ON r.id = u.role_id
     ORDER BY u.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const countResult = await pool.query("SELECT COUNT(*)::int AS total FROM users");
  
  return {
    users: dataResult.rows,
    total: countResult.rows[0].total
  };
};
```

**Models** → Type Definitions (No Database ORM)
```typescript
// @models/userModel.ts
export type UserRecord = {
  id: string;
  email: string;
  password_hash: string;
  role_name: string;
  created_at: Date;
};
```

**Pattern Summary**:
- Controller calls service
- Service handles business logic & database queries
- Models define TypeScript types (no class constructors)
- Database directly returns rows — no ORM

---

### Route Organization

```typescript
// @routes/index.ts (Router aggregation)
export const apiRouter = Router();
apiRouter.get("/", healthController);
apiRouter.use("/auth", authRoutes);
apiRouter.use("/users", userRoutes);
apiRouter.use("/", healthRoutes);

// @routes/authRoutes.ts (Feature routes)
export const authRoutes = Router();
authRoutes.post("/login", validateRequest(loginSchema), loginController);

// @routes/schemas.ts (Centralized validation)
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  })
});
```

**Rules**:
- All routes go through `/api/v1` prefix
- Routes are organized by feature (auth, users, etc.)
- Validation schemas are in `routes/schemas.ts`
- Controllers are thin — delegate logic to services

---

### Middleware Pattern

**Authentication Middleware**:
```typescript
// @middleware/auth.ts
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Missing token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      sub: string;
      email: string;
      role: string;
    };
    req.user = { id: decoded.sub, email: decoded.email, role: decoded.role };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};
```

**RBAC Middleware** (Role-Based Access Control):
```typescript
// @middleware/rbac.ts
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    return next();
  };
};
```

**Validation Middleware** (Zod):
```typescript
// @middleware/requestValidation.ts
export const validateRequest = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: result.error.flatten()
      });
    }
    next();
  };
};
```

**Apply Middleware**:
```typescript
// In route handlers
authRoutes.post("/login", 
  validateRequest(loginSchema),  // Validate first
  loginController               // Then handle
);

// For protected routes
userRoutes.get("/", 
  requireAuth,                    // Authenticate
  requireRole(["admin"]),         // Authorize
  listUsersController
);
```

---

### API Response Format

**All responses follow this structure**:

```typescript
// Success Response (200)
{
  success: true,
  data: { ... }
  meta?: { page, limit, total }  // For paginated responses
}

// Error Response (400, 401, 403, 500)
{
  success: false,
  message: "User-friendly error message",
  errors?: { field: ["validation error"] }  // For validation errors
}
```

**In Controllers**:
```typescript
// Success
return res.json({ success: true, data: user });

// Created
return res.status(201).json({ success: true, data: user });

// Error
return res.status(400).json({ success: false, message: "Email already exists" });
```

---

### Database Layer (No ORM)

**Connection Pool**:
```typescript
// @db/pool.ts
import { Pool } from "pg";
import { env } from "@config/env";

export const pool = new Pool({
  connectionString: env.DATABASE_URL
});
```

**Usage in Services**:
```typescript
// Direct SQL queries with parameterized statements
const result = await pool.query(
  "SELECT * FROM users WHERE email = $1",
  [email]
);
const user = result.rows[0];

// Insert with RETURNING
const result = await pool.query(
  "INSERT INTO users (id, email, role_id) VALUES ($1, $2, $3) RETURNING id, email",
  [userId, email, roleId]
);
```

**Rules**:
- Always use parameterized queries (`$1`, `$2`, etc.)
- Never concatenate user input into SQL
- Use `RETURNING` clause to get inserted data
- Transactions should use `pool.query()` with `BEGIN`/`COMMIT`/`ROLLBACK`

---

### Environment & Configuration

```typescript
// @config/env.ts (Zod-validated)
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z.string().transform(Number),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),
  // ... other variables
});

export const env = envSchema.parse(process.env);
```

---

### Logging

```typescript
// @config/logger.ts (Pino)
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info"
});

// Usage in services
logger.info({ userId }, "User created");
logger.error({ err }, "Database error");
```

---

### Testing (Jest + Supertest)

```typescript
// tests/auth.test.ts
import request from "supertest";
import { app } from "../src/app";

describe("POST /api/v1/auth/login", () => {
  it("should return token on valid credentials", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "user@example.com", password: "Test123!" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("token");
  });

  it("should return 401 on invalid credentials", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "wrong@example.com", password: "wrong" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
```

---

## 🐍 Backend-fastapi Architecture (FastAPI + Python)

### Folder Structure

```
backend-fastapi/
├── main.py                 # FastAPI entry point
├── app/
│   ├── config.py            # Pydantic settings
│   ├── api/
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── endpoints/
│   │           └── kyc.py
│   ├── db/
│   │   └── __init__.py       # SQLAlchemy async engine/session
│   ├── models/
│   │   ├── base.py
│   │   ├── document.py
│   │   ├── face_verification.py
│   │   ├── kyc.py
│   │   ├── ocr_result.py
│   │   └── user.py
│   └── services/
│       ├── identity_service.py
│       └── ocr_service.py
├── scripts/
│   ├── install_uvicorn.ps1
│   └── run_backend.ps1
└── requirements.txt
```

### Import Rules

- Always import with the `app` package root (e.g., `from app.models import User`).
- Do not use `backend.*` imports anywhere in FastAPI code.

### Config & Uploads

- Settings live in `app/config.py` and default to `UPLOAD_DIR = "uploads/kyc"`.
- When running via `scripts/run_backend.ps1`, the working directory is `backend-fastapi`.

## ⚛️ Frontend Architecture (React + TypeScript + Vite)

### Folder Structure

```
frontend/src/
├── main.tsx                # React entry point
├── vite-env.d.ts          # Vite type definitions
├── app/                   # Core app setup
│   ├── router.tsx         # React Router config
│   ├── store.ts           # Redux store setup
│   └── queryClient.ts     # TanStack Query config
├── features/              # Feature-based modules (SCALABLE)
│   ├── auth/              # Authentication feature
│   │   ├── api/           # API calls
│   │   ├── pages/         # Page components
│   │   ├── store/         # Redux slices (if needed)
│   │   └── hooks/         # Feature-specific hooks
│   ├── users/             # User management feature
│   │   ├── api/           # User API service
│   │   ├── pages/         # User pages
│   │   ├── hooks/         # useUsers hook
│   │   └── components/    # User-specific components
│   └── ui/                # UI state management
│       └── store/         # UI Redux slice
├── components/            # Reusable components (NOT feature-specific)
│   ├── common/            # 25+ custom UI components
│   │   ├── Button/
│   │   ├── InputField/
│   │   ├── SelectField/
│   │   ├── Modal.tsx
│   │   ├── TableView/
│   │   ├── DesktopNav/
│   │   └── ... (other shared components)
│   ├── header.tsx         # Layout header
│   ├── footer.tsx         # Layout footer
│   ├── page.tsx           # Page layout wrapper
│   ├── user.tsx           # User profile component
│   └── index.ts           # Component exports
├── shared/                # Shared utilities
│   ├── components/        # Shared layout/modal components
│   │   ├── auth/
│   │   ├── layout/
│   │   └── Modal/
│   ├── lib/               # Utility libraries
│   │   ├── apiClient.ts   # Axios instance
│   │   └── env.ts         # Environment config
│   └── validation/        # Zod validation schemas
│       └── authSchemas.ts
├── services/              # API & business logic
│   ├── apiService.ts      # Legacy API service (deprecated)
│   ├── withApiCall.tsx    # HOC pattern (deprecated)
│   └── endpoints/         # API endpoint configs
├── store/                 # Redux Toolkit store
│   ├── index.ts           # Store config
│   └── slices/            # Redux slices
│       ├── authSlice.ts
│       ├── uiSlice.ts
│       └── accountSlice.ts
├── context/               # React Context (DEPRECATED - use Redux instead)
│   ├── index.tsx          # ModalContext (migration bridge)
│   └── ThemeContext.tsx   # (deprecated)
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts         # Auth state from Redux
│   ├── useUI.ts           # UI state from Redux
│   ├── useApiQuery.ts     # TanStack Query wrapper
│   ├── useFormValidation.ts
│   ├── useDebounce.tsx
│   └── reduxHooks.ts      # Redux hook wrappers
├── pages/                 # Full page components
│   ├── DashboardPage.tsx
│   ├── AccessDeniedPage.tsx
│   └── NotFoundPage.tsx
├── helper/                # Utility functions
│   ├── numberFormatters.ts
│   ├── timesheetFormatters.ts
│   ├── exportToExcel.tsx
│   └── addressFields.tsx
├── providers/             # App providers
│   └── AppProviders.tsx   # Redux + QueryClient wrapper
├── assets/                # Static files
│   ├── data/              # Icons, constants
│   └── styles/            # Global styles
├── styles/                # Global CSS
│   └── global.css
└── types/                 # TypeScript definitions
    └── index.ts
```

---

### Feature-Based Architecture (Why & How)

**Feature folders keep related code together**:
```
features/users/
├── api/usersApi.ts          # API calls (list, create, update, delete)
├── pages/UsersPage.tsx      # Main page
├── pages/UserDetailPage.tsx # Detail page
├── hooks/useUsers.ts        # Custom hook for data fetching
├── components/UserCard.tsx  # User-specific component
└── store/                   # (if needed) Feature-specific Redux slices
```

**Benefits**:
- Adding a feature = create a folder in `features/`
- All code for that feature is self-contained
- Easy to delete or move features
- Reduces merge conflicts
- Clear responsibility boundaries

**When adding a new feature**:
1. Create `features/<feature>/` folder
2. Add `api/` for API calls
3. Add `pages/` for page components
4. Add `hooks/` for custom hooks (useFeature)
5. Add Redux slices if needed (complex state)
6. Use `shared/components/` for truly global UI

---

### Redux State Management (Redux Toolkit)

**Store Setup**:
```typescript
// app/store.ts
import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "@features/auth/store/authSlice";
import { uiReducer } from "@features/ui/store/uiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**Redux Slice Pattern**:
```typescript
// features/auth/store/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type AuthState = {
  accessToken: string | null;
  user: { id: string; email: string; role: string } | null;
};

const initialState: AuthState = {
  accessToken: null,
  user: null
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<AuthState>) => {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      localStorage.setItem("accessToken", action.payload.accessToken);
    },
    logout: (state) => {
      state.accessToken = null;
      state.user = null;
      localStorage.removeItem("accessToken");
    }
  }
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
```

**Using Selectors**:
```typescript
// Always use selectors, not direct state access
export const selectUser = (state: RootState) => state.auth.user;
export const selectAccessToken = (state: RootState) => state.auth.accessToken;

// In components
const user = useSelector(selectUser);
```

**Dispatch Actions**:
```typescript
import { useDispatch } from "react-redux";
import { loginSuccess } from "@features/auth/store/authSlice";

const dispatch = useDispatch();
dispatch(loginSuccess({ accessToken: "...", user: { ... } }));
```

---

### Custom Hooks for Redux State

**useAuth Hook** (Global state from Redux):
```typescript
// hooks/useAuth.ts
import { useSelector, useDispatch } from "react-redux";
import { selectUser, logout } from "@features/auth/store/authSlice";

export const useAuth = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const handleLogout = () => {
    dispatch(logout());
  };

  return { user, logout: handleLogout };
};
```

**useUI Hook** (Global UI state):
```typescript
// hooks/useUI.ts
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectThemeColor, setThemeColor } from "@features/ui/store/uiSlice";

export const useUI = () => {
  const dispatch = useDispatch();
  const themeColor = useSelector(selectThemeColor);

  const updateTheme = useCallback((color: string) => {
    dispatch(setThemeColor(color));
    localStorage.setItem("selectedTheme", color);
  }, [dispatch]);

  return { themeColor, updateTheme };
};
```

**Usage in Components**:
```typescript
const MyComponent = () => {
  const { user, logout } = useAuth();
  const { themeColor, updateTheme } = useUI();

  return (
    <div style={{ color: themeColor }}>
      <p>Welcome, {user?.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

---

### TanStack Query (React Query) for Server State

**useApiQuery Hook** (GET requests with caching):
```typescript
// hooks/useApiQuery.ts
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/apiClient";

export const useApiQuery = (queryKey, url, options = {}) => {
  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: async () => {
      const response = await apiClient.get(url);
      // Unwrap { data: { ... } } wrapper
      return response?.data?.data ?? response?.data;
    },
    staleTime: 30 * 1000,  // Cache for 30 seconds
    ...options
  });
};

// Usage
const { data, isLoading, error, refetch } = useApiQuery(
  ['users', page],
  `/api/v1/users?page=${page}`,
  { enabled: !!page }
);
```

**useApiMutation Hook** (POST, PUT, DELETE):
```typescript
// hooks/useApiQuery.ts
export const useApiMutation = (defaultUrl, defaultMethod = "post", options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (callConfig = {}) => {
      const { url = defaultUrl, method = defaultMethod, payload } = callConfig;
      const response = await apiClient[method](url, payload);
      return response?.data?.data ?? response?.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries to refetch
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
        });
      }
      options.onSuccess?.(data, variables);
    },
    ...options
  });
};

// Usage
const { mutate, isPending } = useApiMutation('/users', 'post', {
  invalidateKeys: [['users']]
});

mutate({ payload: { email: "...", role: "..." } });
```

---

### API Service Layer

**apiClient Setup** (Axios):
```typescript
// shared/lib/apiClient.ts
import axios from "axios";
import { env } from "@shared/lib/env";

export const apiClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" }
});

// Add token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 (unauthorized)
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);
```

**Feature API Service**:
```typescript
// features/users/api/usersApi.ts
import { apiClient } from "@shared/lib/apiClient";

export type User = {
  id: string;
  email: string;
  role: string;
};

export const listUsers = async (page = 1, limit = 10) => {
  const { data } = await apiClient.get(`/users?page=${page}&limit=${limit}`);
  return data.data;  // Unwrap { data: { ... } }
};

export const createUser = async (payload: Omit<User, "id">) => {
  const { data } = await apiClient.post("/users", payload);
  return data.data;
};

export const updateUser = async (id: string, payload: Partial<User>) => {
  const { data } = await apiClient.put(`/users/${id}`, payload);
  return data.data;
};

export const deleteUser = async (id: string) => {
  await apiClient.delete(`/users/${id}`);
};
```

**Use API in Components** (with useApiQuery hook):
```typescript
const UsersPage = () => {
  const [page, setPage] = useState(1);
  
  const { data, isLoading, error } = useApiQuery(
    ['users', page],
    `/api/v1/users?page=${page}`
  );

  const { mutate: createUser } = useApiMutation('/users', 'post', {
    invalidateKeys: [['users']]
  });

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data?.map(user => <UserCard key={user.id} user={user} />)}
      <button onClick={() => createUser({ payload: {...} })}>
        Add User
      </button>
    </div>
  );
};
```

---

### React Component Patterns

**Functional Components with Hooks**:
```typescript
// features/users/pages/UsersPage.tsx
import { memo, useState } from "react";
import { useApiQuery } from "@hooks/useApiQuery";
import { UserList } from "../components/UserList";

const UsersPage = memo(() => {
  const [filters, setFilters] = useState({ search: "", role: "" });
  const { data, isLoading } = useApiQuery(
    ['users', filters],
    `/users?search=${filters.search}&role=${filters.role}`
  );

  return (
    <div>
      <h1>Users</h1>
      <UserList users={data} loading={isLoading} />
    </div>
  );
});

UsersPage.displayName = "UsersPage";
export default UsersPage;
```

**Rules**:
- Use `memo()` for components that receive props (avoid unnecessary re-renders)
- Set `displayName` on memoized components (for debugging)
- Use custom hooks to fetch data (not HOCs)
- Keep components small and focused
- Use Tailwind CSS for styling (no inline styles)

---

### Component Organization

**Reusable Components** (in `components/common/`):
```typescript
// components/common/Button/Button.tsx
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  isLoading,
  ...props
}: ButtonProps) => {
  const baseClass = "font-medium rounded transition-colors";
  const variantClass = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "bg-gray-300 text-gray-800 hover:bg-gray-400",
    danger: "bg-red-500 text-white hover:bg-red-600"
  }[variant];
  const sizeClass = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  }[size];

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? "Loading..." : children}
    </button>
  );
};
```

**Feature-Specific Components** (in `features/<feature>/components/`):
```typescript
// features/users/components/UserCard.tsx
import { User } from "../api/usersApi";
import { Button } from "@components/common/Button/Button";

interface UserCardProps {
  user: User;
  onDelete?: (id: string) => void;
}

export const UserCard = ({ user, onDelete }: UserCardProps) => {
  return (
    <div className="border rounded p-4">
      <h3>{user.email}</h3>
      <p className="text-sm text-gray-500">{user.role}</p>
      {onDelete && (
        <Button variant="danger" size="sm" onClick={() => onDelete(user.id)}>
          Delete
        </Button>
      )}
    </div>
  );
};
```

---

### Styling with Tailwind CSS

**Rules**:
- Use Tailwind utility classes (no custom CSS unless necessary)
- Define colors in `tailwind.config.cjs`
- Use CSS variables for theme colors
- Mobile-first responsive design (use `sm:`, `md:`, `lg:` breakpoints)

```typescript
// Example component
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <div key={item.id} className="bg-white rounded shadow hover:shadow-lg transition-shadow p-4">
      <h3 className="font-bold text-lg mb-2">{item.title}</h3>
      <p className="text-gray-600">{item.description}</p>
    </div>
  ))}
</div>
```

---

## 🔄 State Management Strategy

### Redux (Global State)
- User authentication (`accessToken`, `user`)
- UI state (theme, modals, dark mode)
- Account/client context

### TanStack Query (Server State)
- API data (users, budgets, reports)
- Pagination and filtering
- Automatic caching and refetching

### Local State (useState)
- Component-specific UI (dropdowns, expanded rows, form inputs)
- Temporary form data

**Rules**:
```typescript
// ❌ Don't store server data in Redux
const [users, setUsers] = useState([]);  // Bad — use TanStack Query instead

// ✅ Use TanStack Query for server state
const { data: users } = useApiQuery(['users'], '/users');

// ✅ Use Redux for auth and UI
const { user } = useAuth();
const { themeColor } = useUI();

// ✅ Use useState for local component state
const [isOpen, setIsOpen] = useState(false);
```

---

## ✅ Code Quality & Conventions

### TypeScript Strict Mode

All files must have explicit types:
```typescript
// ❌ Bad
const user = data.user;  // user is 'any'
const items = [];        // items is 'never[]'

// ✅ Good
const user: User = data.user;
const items: Item[] = [];
```

### Error Handling

**Backend**:
```typescript
try {
  const result = await pool.query(query, params);
  return result.rows;
} catch (error) {
  logger.error({ err: error }, "Database query failed");
  throw new Error("Failed to fetch users");  // Don't expose DB errors to client
}
```

**Frontend**:
```typescript
const { data, error, isLoading } = useApiQuery(...);

if (error) {
  return <ErrorMessage message={error.message} />;
}

if (isLoading) {
  return <LoadingSpinner />;
}
```

### Naming Conventions

| Item | Pattern | Example |
|------|---------|---------|
| **Files** | camelCase | `userService.ts`, `authSlice.ts` |
| **Folders** | camelCase | `services/`, `features/auth/` |
| **Components** | PascalCase | `UserCard.tsx`, `DesktopNav.tsx` |
| **Functions** | camelCase | `listUsers()`, `formatDate()` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_USERS`, `DEFAULT_TIMEOUT` |
| **Types/Interfaces** | PascalCase | `User`, `AuthState`, `UserRecord` |
| **Redux Slices** | camelCase + `Slice` suffix | `authSlice.ts`, `uiSlice.ts` |
| **Redux Actions** | camelCase | `loginSuccess`, `closeModal` |
| **Query Keys** | Array of strings | `['users', page, limit]`, `['user', id]` |

---

## 🚫 Common Patterns to AVOID

### ❌ Backend Patterns to Avoid

1. **Mixing concerns** (controllers doing business logic)
   ```typescript
   // Bad
   app.get("/users", async (req, res) => {
     const result = await pool.query("SELECT * FROM users");
     const processed = result.rows.map(u => ({ ...u, fullName: `${u.first} ${u.last}` }));
     return res.json(processed);
   });
   
   // Good
   // Controller → Service (business logic) → Database
   ```

2. **Inconsistent error responses**
   ```typescript
   // Bad
   res.send("Error");
   res.status(500).send({ err: error });
   res.json({ error: "Failed" });
   
   // Good
   res.status(500).json({ success: false, message: "Internal server error" });
   ```

3. **Relative imports instead of path aliases**
   ```typescript
   // Bad
   import { logger } from "../../../../config/logger";
   
   // Good
   import { logger } from "@config/logger";
   ```

4. **Class-based models** (ORM-like patterns)
   ```typescript
   // Bad
   class User {
     id: string;
     email: string;
     constructor(data) { ... }
   }
   
   // Good
   type User = { id: string; email: string; };
   ```

---

### ❌ Frontend Patterns to Avoid

1. **Storing server data in Redux**
   ```typescript
   // Bad
   const [users, setUsers] = useState([]);  // Or Redux
   useEffect(() => {
     fetch("/users").then(data => setUsers(data));
   }, []);
   
   // Good
   const { data: users } = useApiQuery(['users'], '/users');
   ```

2. **Prop drilling** (pass state through many components)
   ```typescript
   // Bad
   <Header userData={userData} setUserData={setUserData} theme={theme} setTheme={setTheme} />
   // → Header passes to UserProfile
   // → UserProfile passes to DropdownMenu
   // → etc.
   
   // Good
   // Use Redux hooks directly
   const { userData } = useAuth();
   const { theme } = useUI();
   ```

3. **Large monolithic components**
   ```typescript
   // Bad — 500+ lines in one file
   const Dashboard = () => { ... };
   
   // Good — split into smaller components
   // Dashboard → [Sidebar, Header, Content, Footer]
   ```

4. **Mixing business logic with UI**
   ```typescript
   // Bad
   const UserPage = () => {
     const [formData, setFormData] = useState({ email: "" });
     const handleSubmit = async () => {
       const isValid = formData.email.includes("@");
       const response = await fetch("/users", { body: formData });
       // ... more logic
     };
   };
   
   // Good
   // Use custom hooks for logic
   const useCreateUser = () => {
     return useMutation({
       mutationFn: (data) => apiClient.post("/users", data)
     });
   };
   
   const UserPage = () => {
     const { mutate: createUser } = useCreateUser();
     const { handleSubmit, register } = useForm();
     return <form onSubmit={handleSubmit(data => createUser(data))} />;
   };
   ```

5. **Context for frequently changing state**
   ```typescript
   // Bad
   const [modalOpen, setModalOpen] = useState(false);  // In Context — causes all consumers to re-render
   
   // Good
   // Use Redux for global state (batched updates)
   dispatch(openModal());
   ```

6. **Inline functions in JSX**
   ```typescript
   // Bad
   <button onClick={() => setCount(count + 1)}>+</button>
   
   // Good
   const handleIncrement = useCallback(() => setCount(c => c + 1), []);
   <button onClick={handleIncrement}>+</button>
   ```

---

## 📊 Database Patterns

### Schema (PostgreSQL)

```sql
-- Migrations go in backend-node/migrations/NNN_description.sql

-- Table: roles
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: audit_logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Query Patterns

**Always parameterize**:
```typescript
// ✅ Good
pool.query("SELECT * FROM users WHERE email = $1", [email]);
pool.query("INSERT INTO users (email) VALUES ($1) RETURNING *", [email]);

// ❌ Bad
pool.query(`SELECT * FROM users WHERE email = '${email}'`);  // SQL injection!
```

**Use RETURNING for inserts**:
```typescript
const result = await pool.query(
  "INSERT INTO users (id, email, role_id) VALUES ($1, $2, $3) RETURNING id, email, role_id",
  [userId, email, roleId]
);
const user = result.rows[0];
```

---

## 🧪 Testing Patterns

### Backend (Jest + Supertest)

```typescript
// tests/users.test.ts
import request from "supertest";
import { app } from "../src/app";

describe("Users API", () => {
  let authToken: string;

  beforeAll(async () => {
    // Create test user and get token
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@example.com", password: "Test123!" });
    authToken = loginRes.body.data.token;
  });

  describe("GET /api/v1/users", () => {
    it("should return paginated users", async () => {
      const res = await request(app)
        .get("/api/v1/users?page=1&limit=10")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta).toHaveProperty("page");
      expect(res.body.meta).toHaveProperty("total");
    });

    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/v1/users");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/v1/users", () => {
    it("should create a user with admin role", async () => {
      const res = await request(app)
        .post("/api/v1/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ email: "newuser@example.com", role: "staff" });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.email).toBe("newuser@example.com");
    });

    it("should return 400 for invalid email", async () => {
      const res = await request(app)
        .post("/api/v1/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ email: "invalid-email", role: "staff" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
```

**Run Tests**:
```bash
npm run test -w backend-node
npm run test:watch -w backend-node
```

---

## 🔐 Security Best Practices

### Backend

1. **Always validate input** (Zod middleware)
2. **Use parameterized queries** (prevents SQL injection)
3. **Hash passwords** (bcryptjs)
4. **Use JWT with expiration** (short-lived access tokens)
5. **Implement RBAC** (requireRole middleware)
6. **Log security events** (user login, role changes)
7. **Use HTTPS** (in production)
8. **CORS policy** (restrict origins)

```typescript
// app.ts
app.use(cors({ origin: allowedOrigins }));
app.use(helmet());  // Security headers
app.use(express.json({ limit: "1mb" }));  // Prevent large payloads
```

### Frontend

1. **Store tokens securely** (localStorage for now, HTTPOnly cookies in production)
2. **Handle 401 responses** (redirect to login)
3. **Validate forms** (Zod schemas)
4. **Sanitize HTML** (if displaying user content)
5. **Use HTTPS** (always in production)

---

## 📦 Dependencies & Versions

### Backend (Node)
```json
{
  "express": "^4.18",
  "typescript": "^5.x",
  "pg": "^8.x",
  "jsonwebtoken": "^9.x",
  "zod": "^3.x",
  "pino": "^8.x",
  "bcryptjs": "^2.4",
  "jest": "^29.x",
  "supertest": "^6.x"
}
```

### Backend (FastAPI)
```json
{
  "fastapi": "^0.110",
  "uvicorn": "^0.29",
  "sqlalchemy": "^2.x",
  "pydantic-settings": "^2.x"
}
```

### Frontend
```json
{
  "react": "^18.x",
  "typescript": "^5.x",
  "@reduxjs/toolkit": "^1.9.x",
  "@tanstack/react-query": "^5.x",
  "axios": "^1.x",
  "zod": "^3.x",
  "tailwindcss": "^3.x",
  "vite": "^5.x"
}
```

---

## 🚀 Development Workflow

### Backend Development (Node)

```bash
# Start development server
npm run dev -w backend-node

# Run tests
npm run test -w backend-node

# Lint
npm run lint -w backend-node

# Build for production
npm run build -w backend-node
```

### Backend Development (FastAPI)

```bash
# Start FastAPI (PowerShell helper)
./backend-fastapi/scripts/run_backend.ps1 -Reload
```

### Frontend Development

```bash
# Start dev server (Vite)
npm run dev -w frontend

# Build for production
npm run build -w frontend

# Lint
npm run lint -w frontend
```

### Adding a New Feature

**Backend (Node)**:
1. Create migration in `backend-node/migrations/`
2. Add schema in `backend-node/src/routes/schemas.ts`
3. Create service in `backend-node/src/services/featureService.ts`
4. Create controller in `backend-node/src/controllers/featureController.ts`
5. Create route in `backend-node/src/routes/featureRoutes.ts`
6. Register route in `backend-node/src/routes/index.ts`
7. Write tests in `backend-node/tests/feature.test.ts`

**Frontend**:
1. Create feature folder `frontend/src/features/feature/`
2. Create API service in `features/feature/api/`
3. Create custom hook in `features/feature/hooks/`
4. Create page components in `features/feature/pages/`
5. Create feature-specific components in `features/feature/components/`
6. Add Redux slice if needed in `features/feature/store/`
7. Register route in `frontend/src/app/router.tsx`

---

## 🐛 Debugging

### Backend

```typescript
import { logger } from "@config/logger";

// Log at different levels
logger.info({ userId }, "User created");
logger.warn({ remaining: quota }, "Quota running low");
logger.error({ err: error }, "Database error");
logger.debug({ query }, "SQL executed");

// View logs
NODE_ENV=development npm run dev -w backend-node
```

### Frontend

```typescript
// Redux DevTools (installed automatically)
// Chrome Extension: Redux DevTools for debugging state changes

// React Query Devtools
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export const AppProviders = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
);
```

---

## 📚 References & Resources

- **Express.js**: https://expressjs.com/
- **React**: https://react.dev/
- **Redux Toolkit**: https://redux-toolkit.js.org/
- **TanStack Query**: https://tanstack.com/query/latest/
- **Zod**: https://zod.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **JWT**: https://jwt.io/

---

## 📝 Last Updated

**Date**: May 2, 2026  
**Version**: 1.0  
**Maintained By**: Development Team

---

**Note**: This file is the single source of truth for code patterns. When GitHub Copilot generates code, it should always refer to this guide to maintain consistency, prevent breaking changes, and ensure sustainable, modular development.
