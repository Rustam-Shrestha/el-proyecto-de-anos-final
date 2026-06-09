import useApi from '../hooks/useApi';
import { KycApplication } from '../types/kyc';

export const useKycService = () => {
  const api = useApi();

  const submit = async (payload: FormData) => {
    const res = await api.post<{ success: boolean; data: KycApplication }>('/kyc/submit', payload);
    return res.data;
  };

  const getStatus = async () => {
    const res = await api.get<{ success: boolean; data: KycApplication }>('/kyc/status');
    return res.data;
  };

  const list = async (params?: Record<string, unknown>) => {
    const res = await api.get<{ success: boolean; data: KycApplication[]; meta?: Record<string, unknown> }>('/kyc', { params });
    return res.data;
  };

  const getById = async (id: string) => {
    const res = await api.get<{ success: boolean; data: KycApplication }>(`/kyc/${id}`);
    return res.data;
  };

  const approve = async (id: string) => {
    const res = await api.patch(`/kyc/${id}/approve`);
    return res.data;
  };

  const reject = async (id: string, payload: { rejectionReason: string }) => {
    const res = await api.patch(`/kyc/${id}/reject`, payload);
    return res.data;
  };

  const requestResubmit = async (id: string, payload: { resubmitNote: string }) => {
    const res = await api.patch(`/kyc/${id}/request-resubmit`, payload);
    return res.data;
  };

  return { submit, getStatus, list, getById, approve, reject, requestResubmit };
};
