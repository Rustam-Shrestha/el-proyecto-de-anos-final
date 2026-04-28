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

type UsersApiResponse =
  | PaginatedUsers
  | {
      success: boolean;
      data: User[];
      meta: {
        page: number;
        limit: number;
        total: number;
      };
    };

type CreateUserApiResponse =
  | User
  | {
      success: boolean;
      data: User;
    };

export const listUsers = async (page = 1, limit = 10) => {
  const { data } = await apiClient.get<UsersApiResponse>(`/users?page=${page}&limit=${limit}`);

  if ("meta" in data) {
    return {
      data: data.data,
      page: data.meta.page,
      limit: data.meta.limit,
      total: data.meta.total
    } satisfies PaginatedUsers;
  }

  return data;
};

export const createUser = async (payload: Omit<User, "id">) => {
  const { data } = await apiClient.post<CreateUserApiResponse>("/users", payload);
  if ("success" in data) {
    return data.data;
  }
  return data;
};
