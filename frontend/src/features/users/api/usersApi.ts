import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/apiClient";

export type User = {
  id: string;
  email: string;
  role: string;
  createdAt?: string;
  created_at?: string;
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

type UpdateUserApiResponse = CreateUserApiResponse;

type DeleteUserApiResponse =
  | { success: boolean }
  | {
      success: boolean;
      data?: unknown;
    };

export type UsersListResponse = {
  users: User[];
  total: number;
};

export const listUsers = async (page = 1, limit = 10) => {
  const { data } = await apiClient.get<PaginatedUsers>(`/users?page=${page}&limit=${limit}`);
  return data;
};

export const useUsersList = (page: number, limit: number) => {
  return useQuery<UsersListResponse>({
    queryKey: ["users", page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<UsersApiResponse>(`/users?page=${page}&limit=${limit}`);

      if ("meta" in data) {
        return {
          users: data.data,
          total: data.meta.total,
        };
      }

      return {
        users: data.data,
        total: data.total,
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: true,
  });
};

export const createUser = async (payload: Omit<User, "id">) => {
  const { data } = await apiClient.post<User>("/users", payload);
  return data;
};

export const updateUser = async (id: string, payload: Omit<User, "id">) => {
  const { data } = await apiClient.patch<UpdateUserApiResponse>(`/users/${id}`, payload);
  if ("success" in data) {
    return data.data;
  }
  return data;
};

export const deleteUser = async (id: string) => {
  const { data } = await apiClient.delete<DeleteUserApiResponse>(`/users/${id}`);
  return data;
};

export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<User, "id">) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Omit<User, "id"> }) => updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
