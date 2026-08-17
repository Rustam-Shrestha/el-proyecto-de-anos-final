import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/apiClient";
import type { ApiResponse } from "@shared/types/common";

export type NotificationType =
  | "KYC_SUBMITTED"
  | "KYC_APPROVED"
  | "KYC_REJECTED"
  | "KYC_PENDING_REVIEW"
  | "PORTFOLIO_SUBMITTED"
  | "PORTFOLIO_APPROVED"
  | "PORTFOLIO_REJECTED"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_FLAGGED"
  | "DOCUMENT_VERIFIED"
  | "LOAN_APPLICATION_SUBMITTED"
  | "LOAN_APPROVED"
  | "LOAN_REJECTED"
  | "LOAN_UNDER_REVIEW"
  | "LOAN_DISBURSED"
  | "LOAN_REPAYMENT_DUE"
  | "LOAN_REPAYMENT_OVERDUE"
  | "LOAN_REPAYMENT_REMINDER"
  | "SYSTEM_ALERT"
  | "ADMIN_ACTION_REQUIRED"
  | "DOCUMENT_EXPIRING_SOON";

export type NotificationStatus = "UNREAD" | "READ" | "ARCHIVED";

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  description?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  actionUrl?: string | null;
  status: NotificationStatus;
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  readAt?: string | null;
  archivedAt?: string | null;
};

export type NotificationsResponse = {
  notifications: Notification[];
  unreadCount: number;
  total: number;
};

export const notificationKeys = {
  all: ["notifications"] as const,
  list: () => ["notifications", "list"] as const,
  unread: () => ["notifications", "unread"] as const,
};

export const useNotifications = (status?: NotificationStatus) => {
  return useQuery({
    queryKey: [...notificationKeys.list(), status ?? "ALL"],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<NotificationsResponse>>(
        "/notifications",
        { params: { limit: 50, ...(status ? { status } : {}) } }
      );
      return data.data;
    },
    staleTime: 30 * 1000,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data } = await apiClient.patch(`/notifications/${notificationId}/read`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.patch("/notifications/read-all");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data } = await apiClient.delete(`/notifications/${notificationId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};
