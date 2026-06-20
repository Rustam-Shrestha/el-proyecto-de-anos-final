import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { env } from "@shared/lib/env";

export const apiClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

const getStoredAccessToken = () => {
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) {
    return accessToken;
  }
  try {
    const userAuth = JSON.parse(localStorage.getItem("userAuth") ?? "null");
    return userAuth?.access?.token ?? userAuth?.accessToken ?? userAuth?.token ?? null;
  } catch {
    return null;
  }
};

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
