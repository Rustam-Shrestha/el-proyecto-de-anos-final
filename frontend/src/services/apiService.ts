// @ts-nocheck
import axios from "axios";
import { env } from "@shared/lib/env";

const BASE_URL = env.VITE_API_BASE_URL;

// Create Axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
});

const getStoredAccessToken = () => {
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) {
    return accessToken;
  }

  try {
    const userAuth = JSON.parse(localStorage.getItem("userAuth"));
    return userAuth?.access?.token ?? userAuth?.accessToken ?? userAuth?.token ?? null;
  } catch {
    return null;
  }
};

// Request interceptor to add token
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = getStoredAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (_error) => Promise.reject(_error)
);

// Response interceptor to handle unauthorized errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized! Redirecting to login...");
      localStorage.clear();
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

// API service
const apiService = {
  get: (url, config = {}) => apiClient.get(url, config),
  post: (url, data, config = {}) => apiClient.post(url, data, config),
  put: (url, data, config = {}) => apiClient.put(url, data, config),
  patch: (url, data, config = {}) => apiClient.patch(url, data, config),
  delete: (url, config = {}) => apiClient.delete(url, config),
};

export { apiService };
