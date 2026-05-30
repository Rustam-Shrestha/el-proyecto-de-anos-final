# Shared Conventions

API response envelope (TypeScript):
```ts
export type ApiResponse<T> = {
	success: boolean;
	data?: T;
	meta?: { page?: number; limit?: number; total?: number };
	message?: string;
}
```

Pagination helper (parsePagination):
```ts
export const parsePagination = (q: any) => ({ page: Number(q.page || 1), limit: Number(q.limit || 20) });
```

Validation rules:
- Node: Zod at route boundary
- FastAPI: Pydantic models

Naming conventions:
- Files: camelCase.ts
- Folders: camelCase
- Components: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE

TypeScript rules:
- `--strict` enabled; prefer explicit types over `any`.

Error handling:
- Backend: log with `pino` and return sanitized messages to clients.
- Frontend: use error boundaries and TanStack Query error states.

Env validation:
- Use Zod in `@config/env.ts` and Pydantic in FastAPI `app/config.py`.

Security & middleware (app.ts):
- `helmet()`, `cors({ origin: allowedOrigins })`, `express.json()`

Monorepo / Docker notes:
- `docker-compose.toolbox.yml` maps `backend-node` to port `4000`.
- Frontend local env: `VITE_API_BASE_URL=http://localhost:4000/api/v1`.

