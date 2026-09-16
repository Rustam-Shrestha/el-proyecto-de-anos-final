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

export const createApiClient = (tenantSlug?: string) => {
  const inst = axios.create({
    baseURL: env.VITE_API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      ...(tenantSlug ? { "X-Tenant": tenantSlug } : {}),
    },
  });
  inst.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
    const t = getStoredAccessToken();
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
    if (cfg.data instanceof FormData) { delete (cfg.headers as Record<string, unknown>)["Content-Type"]; delete (cfg.headers as Record<string, unknown>)["content-type"]; }
    const ts = tenantSlug || localStorage.getItem("tenantSlug") || "default";
    if (ts) cfg.headers["X-Tenant"] = ts;
    return cfg;
  });
  inst.interceptors.response.use((r) => r, async (e) => { if (e.response?.status === 401) { localStorage.clear(); window.location.href = "/login"; } return Promise.reject(e); });
  return inst;
};

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // tenant header
  const tenantSlug = localStorage.getItem("tenantSlug") || new URLSearchParams(window.location.search).get("tenant") || "default";
  if (tenantSlug) config.headers["X-Tenant"] = tenantSlug;

  // When sending FormData (multipart), clear the default application/json Content-Type
  // so the browser can set the correct multipart boundary.
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
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
