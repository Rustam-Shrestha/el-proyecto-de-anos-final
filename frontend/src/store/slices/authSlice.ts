import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type UserRecord = {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  permissions?: string[];
  isSuperUser?: boolean;
  image?: string;
  [key: string]: unknown;
} | null;

export type ClientDetails = {
  name: string;
  id: string;
};

export type AuthState = {
  user: UserRecord;
  userData: UserRecord;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  clientDetails: ClientDetails;
};

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) {
      return fallback;
    }
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
};

const readString = (key: string): string | null => {
  const value = localStorage.getItem(key);
  return value && value.trim() ? value : null;
};

const initialUser = readJson<UserRecord>("user", readJson<UserRecord>("userData", null));
const initialAccessToken = readString("accessToken");
const initialRefreshToken = readString("refreshToken");

const initialState: AuthState = {
  user: initialUser,
  userData: initialUser,
  accessToken: initialAccessToken,
  refreshToken: initialRefreshToken,
  isAuthenticated: Boolean(initialAccessToken),
  isLoading: false,
  error: null,
  clientDetails: readJson<ClientDetails>("clientDetails", { name: "", id: "" }),
};

const persistUser = (user: UserRecord) => {
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("userData", JSON.stringify(user));
  } else {
    localStorage.removeItem("user");
    localStorage.removeItem("userData");
  }
};

const persistTokens = (accessToken: string | null, refreshToken: string | null) => {
  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
  } else {
    localStorage.removeItem("accessToken");
  }

  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  } else {
    localStorage.removeItem("refreshToken");
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setUser: (state, action: PayloadAction<UserRecord>) => {
      state.user = action.payload;
      state.userData = action.payload;
      persistUser(action.payload);
    },
    setTokens: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      persistTokens(action.payload.accessToken, action.payload.refreshToken);
    },
    logout: (state) => {
      state.user = null;
      state.userData = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      state.clientDetails = { name: "", id: "" };
      persistUser(null);
      persistTokens(null, null);
      localStorage.removeItem("clientDetails");
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setUserData: (state, action: PayloadAction<UserRecord>) => {
      state.user = action.payload;
      state.userData = action.payload;
      persistUser(action.payload);
    },
    clearUserData: (state) => {
      state.user = null;
      state.userData = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      state.clientDetails = { name: "", id: "" };
      persistUser(null);
      persistTokens(null, null);
      localStorage.removeItem("clientDetails");
    },
    setClientDetails: (state, action: PayloadAction<ClientDetails>) => {
      state.clientDetails = action.payload;
      localStorage.setItem("clientDetails", JSON.stringify(action.payload));
    },
  },
});

export const {
  setLoading,
  setUser,
  setTokens,
  logout,
  setError,
  setUserData,
  clearUserData,
  setClientDetails,
} = authSlice.actions;

export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectUserData = (state: { auth: AuthState }) => state.auth.userData;
export const selectAccessToken = (state: { auth: AuthState }) => state.auth.accessToken;
export const selectRefreshToken = (state: { auth: AuthState }) => state.auth.refreshToken;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectError = (state: { auth: AuthState }) => state.auth.error;
export const selectClientDetails = (state: { auth: AuthState }) => state.auth.clientDetails;

export const selectPermissions = createSelector(
  [selectUserData],
  (userData) => userData?.permissions || []
);

export const selectIsSuperUser = (state: { auth: AuthState }) =>
  state.auth.userData?.isSuperUser || false;

export default authSlice.reducer;
