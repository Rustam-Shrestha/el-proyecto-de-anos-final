import { useState, useCallback } from 'react';
import { useKycService } from '../services/kycService';
import { KycApplication } from '../types/kyc';

export const useKyc = (id?: string) => {
  const service = useKycService();
  const [data, setData] = useState<KycApplication | null>(null);
  const [list, setList] = useState<KycApplication[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitKyc = useCallback(async (payload: FormData) => {
    setLoading(true);
    try {
      const res = await service.submit(payload);
      setData(res.data as KycApplication);
      return res.data;
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Submit failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await service.getStatus();
      setData(res.data as KycApplication);
      return res.data;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const fetchList = useCallback(async (params?: Record<string, unknown>) => {
    setLoading(true);
    try {
      const res = await service.list(params);
      setList(res.data as KycApplication[]);
      return res;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const fetchById = useCallback(async (fetchId?: string) => {
    setLoading(true);
    try {
      const res = await service.getById(fetchId || id || '');
      setData(res.data as KycApplication);
      return res.data;
    } finally {
      setLoading(false);
    }
  }, [service, id]);

  const approve = useCallback(async (kycId: string) => {
    setLoading(true);
    try {
      return await service.approve(kycId);
    } finally {
      setLoading(false);
    }
  }, [service]);

  const reject = useCallback(async (kycId: string, payload: { rejectionReason: string }) => {
    setLoading(true);
    try {
      return await service.reject(kycId, payload);
    } finally {
      setLoading(false);
    }
  }, [service]);

  const requestResubmit = useCallback(async (kycId: string, payload: { resubmitNote: string }) => {
    setLoading(true);
    try {
      return await service.requestResubmit(kycId, payload);
    } finally {
      setLoading(false);
    }
  }, [service]);

  return { data, list, loading, error, submitKyc, fetchStatus, fetchList, fetchById, approve, reject, requestResubmit };
};

export default useKyc;
