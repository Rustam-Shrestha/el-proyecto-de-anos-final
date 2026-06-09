import useApi from '../hooks/useApi';

export const useAdminService = () => {
  const api = useApi();

  const getDashboard = async () => {
    const res = await api.get('/admin/dashboard');
    return res.data;
  };

  const getUsersKyc = async (params?: Record<string, unknown>) => {
    const res = await api.get('/admin/users-kyc', { params });
    return res.data;
  };

  const getAudit = async (params?: Record<string, unknown>) => {
    const res = await api.get('/admin/audit', { params });
    return res.data;
  };

  const getKycStats = async () => {
    const res = await api.get('/admin/stats/kyc');
    return res.data;
  };

  const getDocumentStats = async () => {
    const res = await api.get('/admin/stats/documents');
    return res.data;
  };

  const getSystemStats = async () => {
    const res = await api.get('/admin/stats/system');
    return res.data;
  };

  return { getDashboard, getUsersKyc, getAudit, getKycStats, getDocumentStats, getSystemStats };
};
