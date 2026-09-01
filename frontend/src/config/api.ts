import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import store from "@store/index";
import { clearUserData, setUserData } from "@store/slices/authSlice";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
};

type RefreshPayload = {
  accessToken: string;
  refreshToken: string;
};

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const baseURL = (import.meta.env.VITE_API_URL as string | undefined) ||
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "http://localhost:3000/api/v1";

const api: AxiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState() as { auth?: { userData?: Record<string, unknown> } };
    const token = state.auth?.userData?.accessToken;

    if (typeof token === "string" && token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const state = store.getState() as { auth?: { userData?: Record<string, unknown> } };
      const refreshToken = state.auth?.userData?.refreshToken;

      if (typeof refreshToken !== "string" || !refreshToken) {
        throw new Error("Missing refresh token");
      }

      const refreshResponse = await axios.post<ApiEnvelope<RefreshPayload>>(
        `${baseURL}/auth/refresh`,
        { refreshToken },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      const nextAccessToken = refreshResponse.data?.data?.accessToken;
      const nextRefreshToken = refreshResponse.data?.data?.refreshToken;

      if (!nextAccessToken || !nextRefreshToken) {
        throw new Error("Invalid refresh response");
      }

      const latestState = store.getState() as { auth?: { userData?: Record<string, unknown> } };
      const currentUserData = latestState.auth?.userData ?? {};

      store.dispatch(
        setUserData({
          ...currentUserData,
          accessToken: nextAccessToken,
          refreshToken: nextRefreshToken
        })
      );

      localStorage.setItem("accessToken", nextAccessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      }

      return api(originalRequest);
    } catch (refreshError) {
      store.dispatch(clearUserData());
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userData");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    }
  }
);

export default api;