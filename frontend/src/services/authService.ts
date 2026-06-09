import { useCallback } from 'react';
import useApi from '../hooks/useApi';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

export const useAuthService = () => {
  const api = useApi();

  const login = useCallback(async (payload: LoginRequest) => {
    const res = await api.post<AuthResponse>('/auth/login', payload);
    return res.data;
  }, [api]);

  const register = useCallback(async (payload: RegisterRequest) => {
    const res = await api.post<AuthResponse>('/auth/register', payload);
    return res.data;
  }, [api]);

  const logout = useCallback(async () => {
    const res = await api.post('/auth/logout');
    return res.data;
  }, [api]);

  const refresh = useCallback(async (payload: { refreshToken: string }) => {
    const res = await api.post<AuthResponse>('/auth/refresh', payload);
    return res.data;
  }, [api]);

  const verifyEmail = useCallback(async (payload: { token: string }) => {
    const res = await api.post('/auth/verify-email', payload);
    return res.data;
  }, [api]);

  const forgotPassword = useCallback(async (payload: { email: string }) => {
    const res = await api.post('/auth/forgot-password', payload);
    return res.data;
  }, [api]);

  const resetPassword = useCallback(async (payload: { token: string; password: string }) => {
    const res = await api.post('/auth/reset-password', payload);
    return res.data;
  }, [api]);

  const changePassword = useCallback(async (payload: { currentPassword: string; newPassword: string }) => {
    const res = await api.post('/auth/change-password', payload);
    return res.data;
  }, [api]);

  return {
    login,
    register,
    logout,
    refresh,
    verifyEmail,
    forgotPassword,
    resetPassword,
    changePassword,
  };
};
