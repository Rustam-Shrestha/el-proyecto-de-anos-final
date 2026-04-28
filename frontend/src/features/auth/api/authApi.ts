import { apiClient } from "@shared/lib/apiClient";
import { LoginInput } from "@shared/validation/authSchemas";

type LoginResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
};

export const loginRequest = async (payload: LoginInput) => {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
  return data;
};
