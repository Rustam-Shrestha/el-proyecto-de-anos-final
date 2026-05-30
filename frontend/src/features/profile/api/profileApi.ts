import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/apiClient";
import { resolveAvatarUrl } from "@shared/lib/avatar";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
};

export type ProfileUser = {
  id: string;
  email: string;
  role: string;
  isVerified?: boolean;
  name?: string;
  fullName?: string;
  phone?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ProfileUpdateInput = {
  fullName: string;
  phone?: string;
};

export const useUpdateProfileMutation = () => {
  return useMutation({
    mutationFn: async (payload: ProfileUpdateInput) => {
      const { data } = await apiClient.patch<ApiResponse<ProfileUser>>("/users/me", payload);
      return data.data;
    },
  });
};

export const useUploadAvatarMutation = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);

      const { data } = await apiClient.patch<ApiResponse<ProfileUser>>("/users/me/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return data.data;
    },
  });
};

export const useDeleteAvatarMutation = () => {
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.delete<ApiResponse<ProfileUser>>("/users/me/avatar");
      return data.data;
    },
  });
};

export { resolveAvatarUrl };