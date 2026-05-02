import { apiClient } from "@shared/lib/apiClient";

export type User = {
  id: string;
  email: string;
  role: string;
};

export type PaginatedUsers = {
  data: User[];
  page: number;
  limit: number;
  total: number;
};

export const listUsers = async (page = 1, limit = 10) => {
  const { data } = await apiClient.get<PaginatedUsers>(`/users?page=${page}&limit=${limit}`);
  return data;
};

export const createUser = async (payload: Omit<User, "id">) => {
  const { data } = await apiClient.post<User>("/users", payload);
  return data;
};
