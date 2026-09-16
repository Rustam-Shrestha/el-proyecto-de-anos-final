import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/lib/apiClient';

export interface TenantDto { id: number; slug: string; name: string; status: string; companyType?: string; subscriptionTier?: string; maxUsers: number; maxLoans: number; usageUsers: number; usageLoans: number; createdAt: string; latestMetric?: { totalUsers?: number; totalLoans?: number } | null }
export interface MetricsDto { totalTenants: number; activeTenants: number; totalUsers: number; totalLoans: number }
export interface TimeSeriesPoint { metricDate: string; totalUsers: number; totalLoans: number; totalRevenue: number }

export const useSupercontrollerMetrics = () =>
  useQuery({ queryKey: ['supercontroller','metrics'], queryFn: async () => (await apiClient.get('/supercontroller/dashboard/metrics')).data.data as MetricsDto, staleTime: 30000 });

export const useSupercontrollerTenants = (page = 1, limit = 20) =>
  useQuery({ queryKey: ['supercontroller','tenants', page, limit], queryFn: async () => (await apiClient.get('/supercontroller/tenants', { params: { page, limit } })).data as { data: TenantDto[]; pagination: { total: number; totalPages: number } }, staleTime: 30000 });

export const useTenantOverview = (tenantId: number | null) =>
  useQuery({ enabled: !!tenantId, queryKey: ['supercontroller','tenantOverview', tenantId], queryFn: async () => (await apiClient.get(`/supercontroller/tenants/${tenantId}`)).data.data as { tenant: TenantDto; features: Record<string, boolean>; metrics: unknown[]; usagePercentage: { users: number; loans: number }; live: { users: number; loans: number } } });

export const useTenantFeatures = (tenantId: number | null) =>
  useQuery({ enabled: !!tenantId, queryKey: ['supercontroller','features', tenantId], queryFn: async () => (await apiClient.get(`/supercontroller/tenants/${tenantId}/features`)).data.data as Array<{ featureName: string; isEnabled: boolean }> });

export const useSupercontrollerTimeSeries = (days = 30) =>
  useQuery({ queryKey: ['supercontroller','timeseries', days], queryFn: async () => (await apiClient.get('/supercontroller/timeseries', { params: { days } })).data.data as TimeSeriesPoint[], staleTime: 30000 });

export const useTenantTimeSeries = (tenantId: number | null, days = 30) =>
  useQuery({ enabled: !!tenantId, queryKey: ['supercontroller','tenantTimeseries', tenantId, days], queryFn: async () => (await apiClient.get(`/supercontroller/tenants/${tenantId}/timeseries`, { params: { days } })).data.data as TimeSeriesPoint[] });

export const useCreateTenant = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (payload: { slug: string; name: string; companyType?: string; subscriptionTier?: string }) => (await apiClient.post('/supercontroller/tenants', payload)).data.data, onSuccess: () => qc.invalidateQueries({ queryKey: ['supercontroller','tenants'] }) });
};

export const useUpdateTenantStatus = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async ({ id, status }: { id: number; status: 'active'|'suspended'|'deleted' }) => (await apiClient.patch(`/supercontroller/tenants/${id}/status`, { status })).data.data, onSuccess: () => qc.invalidateQueries({ queryKey: ['supercontroller'] }) });
};

export const useToggleFeature = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async ({ tenantId, featureName, isEnabled }: { tenantId: number; featureName: string; isEnabled: boolean }) => (await apiClient.post(`/supercontroller/tenants/${tenantId}/features/${featureName}/toggle`, { isEnabled })).data.data, onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['supercontroller','features', vars.tenantId] }); qc.invalidateQueries({ queryKey: ['supercontroller','tenantOverview', vars.tenantId] }); } });
};

export const useSupercontrollerAuditLogs = (page = 1, limit = 20) =>
  useQuery({ queryKey: ['supercontroller','audit', page, limit], queryFn: async () => (await apiClient.get('/supercontroller/audit-logs', { params: { page, limit } })).data as { data: Array<{ id: number; action: string; targetType: string; targetId: string; createdAt: string }>; pagination: { total: number } } });
