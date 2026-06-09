import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthService } from '../services/authService';
import { AuthUser, LoginRequest } from '../types/auth';

export const useAuth = () => {
  const navigate = useNavigate();
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
      setUser(res.data.user as any);
      return res.data;
    } catch (err: any) {
      setError(err?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await service.register(payload);
      setUser(res.data.user as any);
      return res.data;
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await service.logout();
      setUser(null);
      navigate('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  return { user, setUser, loading, error, login, register, logout };
};

export default useAuth;

