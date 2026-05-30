# Frontend (React + TypeScript + Vite)

Folder layout (full `src/`):
```
src/
├─ main.tsx
├─ app/
│  ├─ router.tsx
│  ├─ store.ts
│  └─ queryClient.ts
├─ features/
│  └─ auth/
│     ├─ api/
│     ├─ pages/
│     ├─ hooks/
│     └─ components/
├─ components/
├─ shared/
│  ├─ lib/
│  │  ├─ apiClient.ts
│  │  └─ env.ts
│  └─ components/
├─ store/
│  └─ slices/
└─ styles/
```

Layering rules:
- `features/` for domain code; `shared/` for primitives; `components/` for generic UI.

Feature folder anatomy (example `features/users/`):
```
features/users/
├─ api/usersApi.ts
├─ pages/UsersPage.tsx
├─ hooks/useUsers.ts
├─ components/UserCard.tsx
└─ store/
```

Redux slice example (authSlice):
```ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type AuthState = { user?: any; accessToken?: string; refreshToken?: string };

const initialState: AuthState = {};

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		loginSuccess(state, action: PayloadAction<any>) { return { ...state, ...action.payload }; },
		logout() { return {}; }
	}
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
```

`useAuth` hook (example):
```ts
import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess, logout } from '@store/slices/authSlice';

export const useAuth = () => {
	const dispatch = useDispatch();
	const user = useSelector((s: any) => s.auth.user);
	return { user, login: (payload) => dispatch(loginSuccess(payload)), logout: () => dispatch(logout()) };
}
```

TanStack Query helpers (simplified):
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/lib/apiClient';

export const useApiQuery = (key: any[], url: string, opts = {}) =>
	useQuery(key, async () => (await apiClient.get(url)).data, opts);

export const useApiMutation = (url: string, method = 'post', opts = {}) => {
	const qc = useQueryClient();
	return useMutation((payload: any) => apiClient[method](url, payload), { onSuccess: () => qc.invalidateQueries() , ...opts });
}
```

`apiClient` setup (axios + interceptors):
```ts
import axios from 'axios';
import { env } from '@shared/lib/env';
import { store } from '@app/store';
import { logout } from '@store/slices/authSlice';

export const apiClient = axios.create({ baseURL: env.VITE_API_BASE_URL, headers: { 'Content-Type': 'application/json' } });

apiClient.interceptors.request.use((config) => {
	const token = store.getState().auth.accessToken;
	if (token) config.headers!['Authorization'] = `Bearer ${token}`;
	return config;
});

apiClient.interceptors.response.use(resp => resp, err => {
	if (err.response?.status === 401) { store.dispatch(logout()); window.location.href = '/auth'; }
	return Promise.reject(err);
});
```

Feature API service (example `usersApi.ts`):
```ts
import { apiClient } from '@shared/lib/apiClient';

export const listUsers = async (page = 1, limit = 20) => {
	const res = await apiClient.get(`/users?page=${page}&limit=${limit}`);
	return res.data;
}
```

React rules:
- Use `memo()` for pure components and set `displayName`.
- Avoid inline functions in JSX props; prefer callbacks.

Tailwind rules:
- Use utility classes only; define colors in `tailwind.config.cjs`.
- Use CSS variables for theme tokens and apply via `:root` / `.dark`.

State ownership:
- Redux: auth, ui, account
- TanStack Query: server state (lists, details)
- useState: local ephemeral UI state

Routing model:
- `src/app/router.tsx` holds route definitions; keep it authoritative and import pages.

Theme system:
- `uiSlice` holds `darkMode` + `themeColor`.
- Apply theme via shared `applyThemeToDocument(themeColor, darkMode)` which sets CSS vars and `.dark` class.

Auth flow summary:
- login/register → response `{ accessToken, refreshToken, user }` → persist to `localStorage` and dispatch `loginSuccess` → navigate to `/app/dashboard`.

Shared primitives list: `apiClient`, `env`, `theme`, `Button`, `Modal`, `InputField`, `authSchemas`.

Anti-patterns (do not):
- store server data in Redux
- prop-drilling large objects

New feature checklist:
- create `features/<name>/` with `api/`, `hooks/`, `pages/`, `components/` and add slice if needed; register route in `router.tsx`.

Dev commands:
```
npm run dev -w frontend
npm run build -w frontend
npm run lint -w frontend
```

