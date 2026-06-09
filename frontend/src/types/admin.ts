export interface DashboardStats {
  users: Record<string, number>;
  kyc: Record<string, number>;
  documents: Record<string, number>;
  recentActivity?: any[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: { page: number; limit: number; total: number; pages: number };
}
