import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/apiClient";
import type { User, ApiResponse, PaginationMeta } from "@shared/types/common";

export type UsersListResponse = {
  users: User[];
  total: number;
};

export const userKeys = {
  all: ["users"] as const,
  list: (page: number, limit: number) => ["users", "list", page, limit] as const,
  detail: (id: string) => ["users", id] as const,
};

export const useUsersList = (page: number, limit: number, role?: string) => {
  return useQuery<UsersListResponse>({
    queryKey: [...userKeys.list(page, limit), role].filter(Boolean),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (role) params.set("role", role);

      const { data } = await apiClient.get<ApiResponse<User[]> & { meta: PaginationMeta }>(
        `/users?${params.toString()}`
      );

      return {
        users: data.data,
        total: data.meta.total,
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useGetUser = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
      return data.data;
    },
    enabled: Boolean(id) && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { email: string; password: string; role: string; fullName?: string }) => {
      const { data } = await apiClient.post<ApiResponse<User>>("/users", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<User> }) => {
      const { data } = await apiClient.patch<ApiResponse<User>>(`/users/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};

export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<ApiResponse<null>>(`/users/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Pick<User, "fullName" | "phone" | "address">> }) => {
      const { data } = await apiClient.patch<ApiResponse<User>>(`/users/${id}/profile`, payload);
      return data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};
