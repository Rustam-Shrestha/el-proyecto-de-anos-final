import { apiClient } from "@shared/lib/apiClient";
import { LoginInput, RegisterInput } from "@shared/validation/authSchemas";

type AuthUser = {
  id: string;
  email: string;
  role: string;
  isVerified?: boolean;
};

type AuthData = {
  accessToken?: string;
  refreshToken?: string;
  user: AuthUser;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
};

export const loginRequest = async (payload: LoginInput) => {
  const { data } = await apiClient.post<ApiResponse<AuthData>>("/auth/login", payload);
  return data.data;
};

type RegisterResponse = ApiResponse<AuthData>;

export const registerRequest = async (payload: RegisterInput) => {
  const { confirmPassword: _confirmPassword, ...body } = payload;
  const { data } = await apiClient.post<RegisterResponse>("/auth/register", body);
  return data.data;
};
