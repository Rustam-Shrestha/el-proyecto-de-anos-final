export interface AuthUser {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'REVIEWER';
  isVerified: boolean;
  createdAt: string;
  avatar?: string | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
}
