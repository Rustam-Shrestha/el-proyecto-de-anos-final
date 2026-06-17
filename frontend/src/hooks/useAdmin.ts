import { useState, useCallback } from 'react';
import { useAdminService } from '../services/adminService';
import { DashboardStats } from '../types/admin';

export const useAdmin = () => {
  const service = useAdminService();
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await service.getDashboard();
      setDashboard(res.data || res);
      return res.data || res;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const fetchUsersKyc = useCallback(async (params?: Record<string, unknown>) => {
    setLoading(true);
    try {
      const res = await service.getUsersKyc(params);
      return res;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const fetchAudit = useCallback(async (params?: Record<string, unknown>) => {
    setLoading(true);
    try {
      const res = await service.getAudit(params);
      return res;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const fetchKycStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await service.getKycStats();
      return res;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const fetchDocumentStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await service.getDocumentStats();
      return res;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const fetchSystemStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await service.getSystemStats();
      return res;
    } finally {
      setLoading(false);
    }
  }, [service]);

  return { dashboard, loading, error, fetchDashboard, fetchUsersKyc, fetchAudit, fetchKycStats, fetchDocumentStats, fetchSystemStats };
};

export default useAdmin;
