import { useState, useCallback } from 'react';
import { useUserService } from '../services/userService';
import { User } from '../types/user';

export const useUser = () => {
  const service = useUserService();
  const [data, setData] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = useCallback(async () => {
    setLoading(true);
    try {
      const res = await service.getMe();
      setData(res.data);
      return res.data;
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Failed to fetch user');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const updateMe = useCallback(async (payload: Partial<User>) => {
    setLoading(true);
    try {
      const res = await service.updateMe(payload);
      setData(res.data);
      return res.data;
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Failed to update');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const uploadAvatar = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const res = await service.uploadAvatar(file);
      setData(res.data);
      return res.data;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const deleteAvatar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await service.deleteAvatar();
      setData(res.data);
      return res.data;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const listUsers = useCallback(async (params?: Record<string, unknown>) => {
    setLoading(true);
    try {
      const res = await service.listUsers(params);
      return res;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const getUser = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await service.getUser(id);
      return res.data;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const changeRole = useCallback(async (id: string, role: User['role']) => {
    setLoading(true);
    try {
      return await service.changeRole(id, role);
    } finally {
      setLoading(false);
    }
  }, [service]);

  const deleteUser = useCallback(async (id: string) => {
    setLoading(true);
    try {
      return await service.deleteUser(id);
    } finally {
      setLoading(false);
    }
  }, [service]);

  return { data, loading, error, fetchMe, updateMe, uploadAvatar, deleteAvatar, listUsers, getUser, changeRole, deleteUser };
};

export default useUser;
