import { useState, useEffect, useCallback } from 'react';

const getStoredToken = () => localStorage.getItem('accessToken') || localStorage.getItem('token') || '';

export const useApiQuery = <T = any>(url: string, options?: { enabled?: boolean; params?: Record<string, any> }) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(options?.enabled !== false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!url || options?.enabled === false) return;
    setLoading(true);
    setError(null);
    try {
      const token = getStoredToken();
      let queryUrl = url;
      if (options?.params) {
        const queryParams = new URLSearchParams(options.params).toString();
        queryUrl += (queryUrl.includes('?') ? '&' : '?') + queryParams;
      }

      const res = await fetch(queryUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error(await res.text() || 'Query failed');
      }

      const json = await res.json();
      setData(json.data || json);
    } catch (err: any) {
      setError(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  }, [url, options?.enabled, JSON.stringify(options?.params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

export const useApiMutation = <T = any>(url: string, method: 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'POST') => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (body?: any) => {
    setLoading(true);
    setError(null);
    try {
      const token = getStoredToken();
      const isFormData = body instanceof FormData;
      const headers: Record<string, string> = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }

      const res = await fetch(url, {
        method,
        headers,
        body: isFormData ? body : JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(await res.text() || 'Mutation failed');
      }

      const json = await res.json();
      const resultData = json.data || json;
      setData(resultData);
      return { success: true, data: resultData };
    } catch (err: any) {
      const msg = err.message || 'Mutation Error';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [url, method]);

  return { data, loading, error, mutate };
};
