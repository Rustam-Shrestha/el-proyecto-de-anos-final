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

**Date**: May 26, 2026  
**Version**: 1.1  
**Maintained By**: Development Team

## Changelog
- 2026-05-26: Updated to reflect current repository layout and dependencies present in the workspace. Added companion skill describing structure for Copilot consumption.

---

**Note**: This file is the single source of truth for code patterns. When GitHub Copilot generates code, it should always refer to this guide to maintain consistency, prevent breaking changes, and ensure sustainable, modular development.

---

## Current Repository Snapshot

**Last reviewed**: 2026-05-30

This appendix reflects the current code that is actively used in the workspace. It is intended to be the fast reference for future edits, especially when the codebase contains older components, legacy compatibility layers, or partially migrated folders.

### Workspace Layout

```text
d:\p3\el-proyecto-de-anos-final/
├── backend-fastapi/
├── backend-node/
├── frontend/
├── docs/
├── infra/
├── tests/
└── .github/
```

### Current Operating Notes

- Frontend requests should target `VITE_API_BASE_URL=http://localhost:4000/api/v1` for the default local setup used by the workspace and Docker compose.
- `backend-node` still advertises `PORT=3000` in its local `.env`, so direct Node runs and container runs may differ unless the environment is aligned.
- The app still contains legacy components and context bridges, but new work should prefer the Redux + feature + shared layout paths documented below.

---

## Frontend Current Architecture

### Entry and Boot Flow

The active frontend is a React 18 + TypeScript + Vite application. The boot sequence is:

1. `src/main.tsx` renders the app through `Suspense`.
2. `src/providers/AppProviders.tsx` wraps the tree in Redux and TanStack Query providers.
3. `src/app/router.tsx` defines route-level lazy loading and protected route gates.
4. `src/styles/global.css` and `src/assets/styles/global.css` provide shared CSS variables and global dark-mode fallbacks.

### Frontend Folder Structure

```text
frontend/src/
├── app/
├── assets/
│   ├── data/
│   └── styles/
├── auth/
├── components/
├── config/
├── context/
├── features/
├── helper/
├── hooks/
├── pages/
├── providers/
├── services/
├── shared/
├── store/
├── styles/
└── types/
```

### Frontend Layering Rules

- `src/features/*` contains domain-specific pages, API wrappers, components, and feature-level hooks.
- `src/shared/*` contains reusable app shell utilities, shared layout components, the API client, validation schemas, and theme helpers.
- `src/components/*` contains legacy ERP-style shell components and reusable common UI; prefer `src/shared/components/*` or feature-local components for new work unless the existing shell already owns the behavior.
- `src/store/*` is the global state layer. Use Redux for auth, UI, account, and global session flags.
- `src/services/*` is the old service layer and remains available for compatibility, but new feature work should prefer query hooks and the shared API client path.

### Routing Model

`src/app/router.tsx` is the source of truth for app routes. The live route groups are:

| Route | Purpose |
|---|---|
| `/` | Redirects to `/dashboard` |
| `/app/*` | Protected dashboard shell |
| `/dashboard/*` | Protected dashboard shell and feature pages |
| `/login` | Login page |
| `/register` | Register page |
| `/auth` | Redirects to `/login` |
| `*` | Not found page |

Current protected pages include:

- `/app/dashboard`
- `/app/users`
- `/app/kyc`
- `/app/user-access`
- `/dashboard/admin`
- `/dashboard/users`
- `/dashboard/kyc`
- `/dashboard/reports`
- `/dashboard/kyc-submit`
- `/dashboard/kyc-status`
- `/dashboard/profile`

### Theme System

Dark mode is currently controlled through Redux plus a document-level theme applicator.

- `src/store/slices/uiSlice.ts` stores `theme`, `darkMode`, and `themeColor`.
- `src/hooks/useUI.ts` exposes `toggleDarkMode`, `updateTheme`, and the theme modal actions.
- `src/shared/lib/theme.ts` applies CSS variables and the `dark` class to `document.documentElement` and `document.body`.
- `src/providers/AppProviders.tsx` bootstraps the current theme on load so the UI rehydrates consistently from Redux/localStorage.

Theme rules:

- When `darkMode` is enabled, the app must update the `--bg-color`, `--surface-color`, `--surface-muted`, `--text-color`, `--border-color`, `--green-icon`, `--green-background`, and `--green-footer` CSS variables.
- Do not rely on the `dark` class alone; the live UI reads CSS variables for surface/background behavior.
- Keep theme persistence in `localStorage` keys `theme`, `darkMode`, and `selectedTheme`.

### Auth Flow

#### Login

- `src/features/auth/pages/LoginPage.tsx` re-exports the main auth screen from `src/auth/index.tsx`.
- `src/auth/index.tsx` restores the saved dark mode on mount and submits credentials through the shared API flow.
- Successful login stores access/refresh token data in `localStorage` and Redux and then navigates to `/app/dashboard`.

#### Register

- `src/features/auth/pages/RegisterPage.tsx` renders `src/features/auth/components/RegisterForm.tsx`.
- The register form posts through `src/features/auth/api/authApi.ts` to `/auth/register`.
- The API client base URL comes from `VITE_API_BASE_URL` and should already include the `/api/v1` prefix.
- The register form validates email, password strength, and confirm password before submitting. If validation fails, it now surfaces a toast instead of failing silently.

### Navigation and Discoverability

The active dashboard shell uses shared layout components rather than the older monolithic page shell.

- `src/shared/layouts/DashboardLayout.tsx` renders the top navbar and sidebar.
- `src/shared/components/Navbar.tsx` owns sidebar toggling and dark mode toggle for the dashboard shell.
- `src/shared/components/Sidebar.tsx` is the primary route navigator for `/dashboard/*` and `/app/*` pages.
- `src/pages/DashboardPage.tsx` now includes explicit quick links to the existing protected pages so the pages are reachable without hunting through route definitions.

### Shared UI and Utilities

Prefer these current shared primitives when adding UI:

- `src/shared/components/Button.tsx`
- `src/components/common/Button/index.tsx`
- `src/components/common/InputField/index.tsx`
- `src/shared/components/Modal.tsx`
- `src/shared/lib/apiClient.ts`
- `src/shared/lib/env.ts`
- `src/shared/lib/theme.ts`
- `src/shared/validation/authSchemas.ts`

### Current Frontend State Model

| Slice | Purpose | Key Fields |
|---|---|---|
| `auth` | Authentication and profile identity | `user`, `userData`, `accessToken`, `refreshToken`, `isAuthenticated`, `isLoading`, `error` |
| `ui` | Theme and shell UI state | `theme`, `darkMode`, `themeColor`, `isSidebarOpen`, `showProfileDropdown`, `showThemeModal`, `notifications` |
| `account` | Account/dashboard context | selection state, cached summary, modal flags, refetch toggle |

### Frontend Rules for Future Changes

- Use `useApiQuery`/`useApiMutation` for server state; avoid introducing new direct axios calls from feature pages.
- Keep route links visible in the shell when a page already exists in the router.
- Preserve the dark-mode CSS-variable contract when adding new components.
- Prefer feature-folder pages and components over adding logic to the legacy `src/components/*` shell unless that shell already owns the UI.

---

## Backend Current Architecture

### Node Backend Overview

`backend-node` is the primary auth/API backend. It is an Express + TypeScript service that currently uses Prisma in the business layer and keeps controllers thin.

### Backend Folder Structure

```text
backend-node/src/
├── app.ts
├── server.ts
├── config/
├── controllers/
├── db/
├── docs/
├── middleware/
├── models/
├── routes/
├── services/
├── types/
└── utils/
```

### Backend Execution Flow

The backend request pipeline is:

1. Route registration in `src/routes/*`.
2. Validation middleware from `src/middleware/requestValidation.ts` or route-specific schema helpers.
3. Authentication / authorization middleware when required.
4. Controller function in `src/controllers/*`.
5. Business logic in `src/services/*`.
6. Database access through Prisma or the configured persistence layer.
7. Normalized response through `src/utils/apiResponse.ts`.

### Backend Route Model

`backend-node/src/routes/index.ts` is the route aggregator and keeps the `/api/v1` prefixing strategy centralized.

Current route families include:

- `authRoutes` for login, register, logout, refresh, and verification workflows.
- `userRoutes` for user management and profile-related operations.
- `kycRoutes` for KYC submission and review.
- `documentRoutes` for uploads, retrieval, replacement, and deletion.
- `adminRoutes` for dashboard and admin reporting surfaces.

### Backend Controller / Service Rules

- Controllers must stay thin: extract request data, call the service, emit the response, and forward errors.
- Services own the business rules, persistence, and external side effects.
- Route-level validation belongs close to the route, not embedded in controllers.
- RBAC checks should live in middleware or dedicated guard helpers, not inline in controllers.

### Backend Auth Contract

Auth is currently implemented as a standard email/password flow:

- `POST /api/v1/auth/register` creates a user and returns token payloads.
- `POST /api/v1/auth/login` authenticates and returns token payloads.
- The frontend expects `accessToken`, `refreshToken`, and `user` in the response envelope.
- The backend response is wrapped in the repository’s API response format.

### Backend Validation Rules

Use route schemas to validate request payloads before hitting the controller:

- Zod or equivalent schema validation should happen at the route layer.
- Register and login inputs should validate email and password constraints.
- For sensitive operations, reject malformed requests before they reach the service layer.

### Backend Environment and Ports

Known current settings:

- `backend-node/.env.example` and `backend-node/.env` use `PORT=3000` for direct local runs.
- `docker-compose.toolbox.yml` maps `backend-node` to `4000:4000` and the frontend container to `VITE_API_BASE_URL=http://localhost:4000/api/v1`.
- If editing frontend API code, keep the base URL consistent with the chosen runtime path.

### FastAPI Backend Overview

`backend-fastapi` remains a parallel backend service for KYC/identity flows.

```text
backend-fastapi/
├── main.py
├── app/
│   ├── config.py
│   ├── api/v1/
│   ├── db/
│   ├── models/
│   └── services/
├── scripts/
└── requirements.txt
```

FastAPI rules:

- Import through the `app` package root.
- Keep Pydantic settings centralized in `app/config.py`.
- Keep async SQLAlchemy logic inside the DB/service layers.

---

## Updated Development Checklist

When touching the current repository, follow this order:

1. Identify the route or page owner.
2. Check whether the behavior lives in `src/shared`, `src/features`, or the legacy shell.
3. Verify state ownership in Redux before adding local state.
4. Keep theme changes inside the shared theme helper and `uiSlice`.
5. Keep auth requests aligned with `apiClient` and `VITE_API_BASE_URL`.
6. Keep backend controllers thin and push business logic into services.
7. Add visible navigation if a route exists but is not discoverable from the shell.

## Changelog Addendum

- 2026-05-30: Added a current-state appendix for frontend and backend architecture, including theme system, auth flow, route discoverability, environment/port notes, and the current controller-service-validation split.
- 2026-06-20: Full project context reconstruction. Added Route Inventory, API Inventory, Feature Map, Environment Variables table, Technical Debt section, Database model relationships, and cross-references to specialized docs under `/docs/`.

---

# Appendix C — Complete Route Inventory

## Frontend Routes

See full details in `docs/frontend/ROUTE_INVENTORY.md`.

### Public Routes
| Path | Component | Purpose |
|---|---|---|
| `/` | Navigate → `/dashboard` | Root redirect |
| `/login` | LoginPage | Login form |
| `/register` | RegisterPage | Registration form |
| `/auth` | Navigate → `/login` | Auth redirect |
| `*` | NotFoundPage | 404 catch-all |

### Protected Routes (`/app/*`)
| Path | Component | Roles | Purpose |
|---|---|---|---|
| `/app/dashboard` | DashboardPage | user, admin | Main dashboard |
| `/app/users` | UsersPage | admin | User management |
| `/app/kyc` | KYCPage | admin | KYC admin panel |
| `/app/access-denied` | AccessDeniedPage | auth | Access denied |
| `/app/user-access` | UserAccessPage | admin | User access control |

### Protected Routes (`/dashboard/*`)
| Path | Component | Roles | Purpose |
|---|---|---|---|
| `/dashboard` | DashboardPage | user, admin | Main dashboard |
| `/dashboard/admin` | AdminDashboardPage | admin | Admin stats |
| `/dashboard/users` | UsersPage | admin | User management |
| `/dashboard/kyc` | KYCListPage | admin, reviewer | KYC list |
| `/dashboard/kyc-submit` | UserKYCPage | user, admin | Submit KYC |
| `/dashboard/kyc-status` | KYCStatusPage | user, admin | KYC status |
| `/dashboard/reports` | Placeholder | admin | **NOT IMPLEMENTED** |
| `/dashboard/loans` | LoanOfficerDashboardPage | admin, reviewer | Loan review |
| `/dashboard/loans/apply` | LoanApplicationPage | user, admin | Apply loan |
| `/dashboard/loans/status` | LoanStatusPage | user, admin | Loan status |
| `/dashboard/profile` | ProfilePage | user, admin | Profile edit |

## Backend API Routes

See full details in `docs/backend-node/ROUTE_INVENTORY.md` and `docs/backend-node/API_INVENTORY.md`.

### Route Families
| Prefix | Routes | Auth |
|---|---|---|
| `/api/v1/auth` | login, register, logout, refresh, verify-email, forgot-password, reset-password, change-password | Mixed |
| `/api/v1/users` | me, CRUD, avatar, role management | Auth+Admin |
| `/api/v1/kyc` | submit, status, list, approve, reject, resubmit | Auth+Roles |
| `/api/v1/kyc/documents` | upload, get, verify, replace, delete | Auth+Roles |
| `/api/v1/loan` | apply, list, get, review | Auth+Roles |
| `/api/v1/employment` | save, get | Auth |
| `/api/v1/admin` | dashboard, users-kyc, audit, stats | Admin |
| `/api/v1/health` | health check | Public |

---

# Appendix D — Feature Map

See full details in `docs/frontend/FEATURE_MAP.md`.

| Feature | Frontend Location | Backend APIs | DB Models |
|---|---|---|---|
| Auth | `features/auth/` | `POST /auth/*`, `GET /users/me` | User, Session, Role |
| Dashboard | `features/dashboard/`, `pages/DashboardPage.tsx` | `GET /admin/dashboard`, `GET /admin/stats` | User, KYC, Loan aggregates |
| KYC | `features/kyc/` | `POST/GET/PATCH /kyc/*`, FastAPI `/kyc/*` | KycApplication, Document, OCRResult, FaceVerification |
| Loans | `features/loans/` | `POST/GET/PATCH /loan/*` | LoanApplication, EmploymentInfo, BorrowerFeatures |
| Users | `features/users/` | `GET/PATCH/DELETE /users/*` | User, Profile, Role |
| Profile | `features/profile/` | `GET/PATCH /users/me*` | User, Profile |
| Admin | `features/admin/` | `GET /admin/*` | All models |
| UI | `features/ui/`, `store/slices/uiSlice.ts` | None | Redux only |

---

# Appendix E — Database Model Relationships

## Prisma Models (auth schema)

```
Role (id, name)
  └── User (id, email, passwordHash, isVerified, isDeleted, roleId)
        ├── Profile (userId, fullName, phone, address, dateOfBirth, avatarUrl)
        ├── Session (userId, refreshTokenHash, isRevoked, expiresAt)
        ├── AuditLog (userId, action, metadata, ip, userAgent)
        ├── KycApplication (userId, status, submittedAt, reviewedAt, reviewerId, rejectionReason)
        │     └── Document (userId, kycId, documentType, filePath, ocrStatus, verificationStatus, isDeleted, version)
        │           └── DocumentVersion (documentId, filePath, version)
        ├── EmploymentInfo (userId, jobTitle, employmentStartDate, declaredAnnualIncome, tenureMonths)
        ├── BorrowerFeatures (userId, amtIncomeTotal, amtCredit, debtToIncomeRatio, ...)
        └── LoanApplication (userId, requestedAmount, tenureMonths, purpose, calculatedEmi, status, riskScore, riskLevel, reviewedBy)
```

## FastAPI Models (public schema, async SQLAlchemy)

```
User (id, email, phone, name)
  └── KYCApplication (user_id, status, document_type, feature_vector, confidence_score)
        ├── Document (kyc_application_id, document_type, file_path, file_size, mime_type)
        ├── OCRResult (kyc_application_id, document_type, raw_text, structured_data, confidence_score, language_detected)
        └── FaceVerification (kyc_application_id, selfie_path, id_document_path, distance, is_match, model_used)
```

---

# Appendix F — Authentication System

## Flow
1. **Register**: User POSTs to `/auth/register` → password hashed with bcryptjs → user stored → JWT access+refresh tokens generated → verification email sent (fire-and-forget)
2. **Login**: User POSTs to `/auth/login` → password verified → JWT tokens generated → refresh token hashed and stored in sessions table → tokens returned
3. **Authenticated Requests**: Frontend attaches `Authorization: Bearer <accessToken>` → `auth.ts` middleware verifies JWT → sets `req.user = { id, email, role }`
4. **Token Refresh**: When access token expires → frontend calls `/auth/refresh` with refresh token → old session revoked → new token pair issued (rotation)
5. **Logout**: Revokes ALL sessions for the user

## Token Strategy
- **Access Token**: JWT HS256, short-lived (default `2h`, configurable via `JWT_ACCESS_TTL`)
- **Refresh Token**: JWT HS256, long-lived (default `7d`, configurable via `JWT_REFRESH_TTL`)
- **Verification Token**: JWT, 24h expiry, `type: 'verify_email'` claim
- **Password Reset Token**: JWT, 1h expiry, `type: 'password_reset'` claim

## RBAC Roles
| Role | Access |
|---|---|
| `USER` | Dashboard, own KYC, own loans, profile |
| `ADMIN` | All user routes, admin dashboard, KYC/Loan review, role management |
| `REVIEWER` | KYC list/review, Loan list/review |

## Frontend Auth Flow
1. Login form (`src/auth/index.tsx`) calls legacy `apiService.post(endpoints.login, ...)` 
2. On success: stores `accessToken`, `refreshToken`, `user` in `localStorage` and Redux
3. `ProtectedRoute` checks `isAuthenticated` from Redux → if missing, redirects to `/login`
4. On mount, `ProtectedRoute` fetches `GET /users/me` to hydrate user data if missing
5. `RoleProtectedRoute` checks `userData.role` against required roles
6. Axios interceptor adds `Bearer` token to all requests automatically
7. 401 interceptor in `apiService.ts` clears localStorage and redirects to `/login`

## Frontend API Client Dual Setup
- **Current**: `shared/lib/apiClient.ts` — axios with Bearer token interceptor (no 401 handling)
- **Legacy**: `services/apiService.ts` — axios with Bearer token + 401 redirect interceptor
- **Auth (login)**: Uses legacy `apiService` directly from `src/auth/index.tsx`

---

# Appendix G — Environment Variables

See `docs/ENVIRONMENT_VARIABLES.md` for the complete table.

Key variables:
- `VITE_API_BASE_URL` — Frontend → Backend URL (default `http://localhost:4000/api/v1`)
- `DATABASE_URL` — PostgreSQL connection (backend-node and backend-fastapi)
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — Token signing secrets
- `CORS_ORIGIN` — Allowed CORS origins for backend
- `PORT` — Backend Node port (4000 in Docker, 3000 in .env.example)

---

# Appendix H — Reusable Utilities

## Frontend

| Module | Path | Responsibility |
|---|---|---|
| `apiClient` | `shared/lib/apiClient.ts` | Axios instance, Bearer token injection |
| `env` | `shared/lib/env.ts` | Validates required env vars at startup |
| `theme` | `shared/lib/theme.ts` | Applies CSS variables for dark/light mode |
| `authSchemas` | `shared/validation/authSchemas.ts` | Zod schemas for login/register |
| `DashboardLayout` | `shared/layouts/DashboardLayout.tsx` | Main app shell with Navbar + Sidebar |
| `Navbar` | `shared/components/Navbar.tsx` | Top navigation bar with user menu |
| `Sidebar` | `shared/components/Sidebar.tsx` | Role-based navigation sidebar |
| `Modal` | `shared/components/Modal.tsx` | Reusable modal component |
| `Button` | `shared/components/Button.tsx` | Reusable button component |
| `SkeletonLoader` | `shared/components/SkeletonLoader.tsx` | Loading skeleton |
| `ProtectedRoute` | `app/ProtectedRoute.tsx` | Auth guard (checks token, fetches /users/me) |
| `RoleProtectedRoute` | `app/RoleProtectedRoute.tsx` | Role-based access guard |
| `useAppDispatch`/`useAppSelector` | `store/hooks.ts` | Typed Redux hooks |
| `useAuth` (Redux) | `store/hooks.ts` | Auth state + actions from Redux |
| `useUI` (Redux) | `store/hooks.ts` | UI state (sidebar, theme, notifications) |
| `useUI` (hooks/) | `hooks/useUI.ts` | Legacy hook for modal/theme (uses @ts-nocheck) |
| `useApiQuery`/`useApiMutation` | `hooks/useApiQuery.ts` | TanStack Query wrappers (uses @ts-nocheck) |
| `useDebounce` | `hooks/useDebounce.tsx` | Debounce hook |
| `useFormValidation` | `hooks/useFormValidation.ts` | Form validation hook |
| `resolveAvatarUrl` | `shared/lib/avatar.ts` | Avatar URL resolution |

## Backend (Node)

| Module | Path | Responsibility |
|---|---|---|
| `apiResponse` | `utils/apiResponse.ts` | Standardized response helpers (success, error, paginated) |
| `AppError` | `utils/AppError.ts` | Custom error class with statusCode + details |
| `pagination` | `utils/pagination.ts` | Pagination helper (skip, take, page, limit) |
| `logger` | `config/logger.ts` | Pino logger with pretty-print in dev |
| `env` | `config/env.ts` | Zod-validated environment variables |
| `prisma` | `config/database.ts` | Prisma client singleton with adapter-pg |
| `authenticate` | `middleware/auth.ts` | JWT authentication middleware |
| `authorize` | `middleware/rbac.ts` | Role-based authorization middleware |
| `validate` | `middleware/requestValidation.ts` | Zod validation middleware |
| `errorHandler` | `middleware/errorHandler.ts` | Global error handler |
| `uploadMiddleware` | `middleware/upload.ts` | Multer config for KYC uploads |
| `avatarUpload` | `middleware/avatarUpload.ts` | Multer config for avatar uploads |
| `tokenService` | `services/tokenService.ts` | JWT generation and verification |
| `mailService` | `services/mailService.ts` | Email sending (Nodemailer) |
| `auditService` | `services/auditService.ts` | Fire-and-forget audit logging |

---

# Appendix I — Technical Debt & Known Issues

See `docs/TECHNICAL_DEBT.md` for the complete catalog.

### Key Frontend Issues
- Dual architecture in migration (legacy vs current API clients, hooks, stores)
- Orphan pages outside feature folders (`src/auth/index.tsx`, `pages/DashboardPage.tsx`)
- Deprecated Context API files (`ThemeContext.tsx`, `ModalContext`)
- Duplicate auth and UI slices (feature-level duplicates of global store slices)
- `@ts-nocheck` in 4 source files
- Reports page is a placeholder only
- Both `/app/*` and `/dashboard/*` route trees exist with overlap

### Key Backend Issues
- Empty placeholder files (models, db, tests, some routes)
- Incomplete migration from raw pg to Prisma
- Missing RBAC on some KYC routes
- No rate limiting on auth endpoints
- No test coverage
- FastAPI bypasses main API gateway (called directly from frontend)

### Key Database Issues
- Prisma schema uses `@@schema("auth")` but migration SQL creates in `public`
- Missing composite indexes for common query patterns
- No soft delete on KYC applications (only on documents)
