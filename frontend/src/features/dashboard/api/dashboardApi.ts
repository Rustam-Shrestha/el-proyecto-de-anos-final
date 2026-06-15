import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/apiClient";
import type { ApiResponse } from "@shared/types/common";

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

export const dashboardKeys = {
  all: ["dashboard"] as const,
  adminStats: ["dashboard", "admin", "stats"] as const,
};

export const useAdminStats = () => {
  return useQuery({
    queryKey: dashboardKeys.adminStats,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<AdminDashboardStats>>(
        "/admin/stats"
      );
      return data.data;
    },
    staleTime: 60 * 1000,
  });
};
