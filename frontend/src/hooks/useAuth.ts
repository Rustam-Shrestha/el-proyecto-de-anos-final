import { useState, useEffect } from 'react';
import { useAuthService } from '../services/authService';
import type { AuthUser, LoginRequest } from '../types/auth';

export const useAuth = () => {
  const service = useAuthService();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // attempt to load user from /users/me if token present - best-effort
    (async () => {
      try {
        setLoading(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (payload: LoginRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await service.login(payload);
      const user = (res as any).user || (res as any).data?.user || res;
      setUser(user as AuthUser);
      return res;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await service.register(payload as any);
      const user = (res as any).user || (res as any).data?.user || res;
      setUser(user as AuthUser);
      return res;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await service.logout();
    } catch {
      // still clear local state even if API fails
    } finally {
      setUser(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("userData");
      localStorage.removeItem("clientDetails");
      setLoading(false);
    }
  };

  return { user, setUser, loading, error, login, register, logout, userData: user };
};

export default useAuth;

