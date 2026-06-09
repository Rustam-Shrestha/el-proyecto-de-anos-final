import useApi from '../hooks/useApi';
import { User, PaginatedUsers } from '../types/user';

export const useUserService = () => {
  const api = useApi();

  const getMe = async () => {
    const res = await api.get<{ success: boolean; data: User }>('/users/me');
    return res.data;
  };

  const updateMe = async (payload: Partial<User>) => {
    const res = await api.patch<{ success: boolean; data: User }>('/users/me', payload);
    return res.data;
  };

  const uploadAvatar = async (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    const res = await api.patch<{ success: boolean; data: User }>('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  };

  const deleteAvatar = async () => {
    const res = await api.delete<{ success: boolean; data: User }>('/users/me/avatar');
    return res.data;
  };

  const listUsers = async (params?: { page?: number; limit?: number }) => {
    const res = await api.get<PaginatedUsers>('/users', { params });
    return res.data;
  };

  const getUser = async (id: string) => {
    const res = await api.get<{ success: boolean; data: User }>(`/users/${id}`);
    return res.data;
  };

  const changeRole = async (id: string, role: User['role']) => {
    const res = await api.patch(`/users/${id}/role`, { role });
    return res.data;
  };

  const deleteUser = async (id: string) => {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  };

  return { getMe, updateMe, uploadAvatar, deleteAvatar, listUsers, getUser, changeRole, deleteUser };
};
