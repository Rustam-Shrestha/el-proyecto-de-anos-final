import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/apiClient";

export type AdminDashboardStats = {
  stats: {
    users: {
      total: number;
      active: number;
      verified: number;
      unverified: number;
      percentage: {
        verified?: number;
      };
    };
    kyc: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      percentage: {
        approved?: number;
        pending?: number;
        rejected?: number;
      };
    };
  };
  recentActivity?: {
    auditLogs: Array<{
      id: string;
      userId: string | null;
      userEmail?: string | null;
      action: string;
      createdAt: string;
    }>;
    kycApplications: Array<{
      id: string;
      userId: string;
      userEmail?: string | null;
      status: string;
      submittedAt: string;
      reviewedAt?: string | null;
    }>;
  };
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
};

export const adminDashboardQueryKey = ["admin", "dashboard"] as const;

export const useAdminDashboardQuery = () => {
  return useQuery({
    queryKey: adminDashboardQueryKey,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<AdminDashboardStats>>("/admin/dashboard");
      return data.data;
    },
    staleTime: 60 * 1000,
  });
};