export interface User {
  id: string;
  email: string;
  fullName?: string;
  phone?: string | null;
  address?: string | null;
  role: 'USER' | 'ADMIN' | 'REVIEWER';
  isVerified: boolean;
  avatar?: string | null;
  createdAt: string;
}

export interface UserResponse {
  success: boolean;
  message?: string;
  data: User;
}

export interface PaginatedUsers {
  success: boolean;
  data: User[];
  meta: { page: number; limit: number; total: number; pages: number };
}
