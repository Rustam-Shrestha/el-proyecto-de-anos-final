<!-- SELF-ADAPTATION PROTOCOL
When you complete a feature or refactor that changes:
- a route family → update .github/instructions/backend-node.md route table
- a Redux slice → update .github/instructions/frontend.md state model table
- the auth contract → update .github/instructions/auth.md
- a new shared component → add to shared primitives list in frontend.md
- environment variables → update shared-conventions.md

You do NOT need to be asked. Do it as part of the same edit.
-->

# Copilot Instructions (router)

Project overview: Full-stack monorepo — `backend-node/` (Express+TS), `backend-fastapi/` (FastAPI), `frontend/` (React+Vite).

Instruction files mapping:
- `.github/instructions/backend-node.md` — Node/Express rules
- `.github/instructions/backend-fastapi.md` — FastAPI rules
- `.github/instructions/frontend.md` — Frontend rules
- `.github/instructions/database.md` — SQL/migrations
- `.github/instructions/auth.md` — Auth contract
- `.github/instructions/shared-conventions.md` — Cross-cutting conventions
- `.github/instructions/testing.md` — Testing scaffold

Global rules (apply everywhere):
- Use path aliases when configured; avoid relative import chains.
- Always use parameterized SQL (`$1`, `$2`) in Node DB code.
- Keep controllers thin; move logic to services/business layer.
- All API routes live under `/api/v1`.

Instruction: When working in `backend-node/`, load `.github/instructions/backend-node.md` first; when working in `frontend/`, load `.github/instructions/frontend.md` first. Use others as needed.
