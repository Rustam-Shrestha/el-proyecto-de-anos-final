# Frontend Services & API Clients

> HTTP client layers, TanStack React Query hooks, and API definitions in `frontend/src/services`.

---

### `apiService` (`src/services/apiService.ts`)
- **Purpose**: Base Axios client with authorization headers, error normalization, and response unpacking.
- **Key Methods**:
  - `get<T>(url, config): Promise<T>`
  - `post<T>(url, data, config): Promise<T>`
  - `put<T>(url, data, config): Promise<T>`
  - `delete<T>(url, config): Promise<T>`

### `authService` (`src/services/authService.ts`)
- **Purpose**: API client for login, register, refresh token, and profile fetch.
- **Key Methods**:
  - `login(credentials)`
  - `register(data)`
  - `getCurrentUser()`
  - `logout()`

### `kycService` (`src/services/kycService.ts`)
- **Purpose**: Multipart upload client for KYC document files and reviewer status calls.
- **Key Methods**:
  - `submitKyc(formData)`
  - `getKycStatus()`
  - `getApplications(params)`
  - `reviewApplication(id, decision)`

### `portfolioService` (`src/services/portfolioService.ts`)
- **Purpose**: Fetch borrower accounts, bureau verifications, and credit metrics.
- **Key Methods**:
  - `getPortfolio(userId)`
  - `verifyBureau(userId)`
  - `getLoanAccounts(userId)`
