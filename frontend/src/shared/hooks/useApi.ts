import { useState, useCallback } from 'react';

const getStoredToken = () => localStorage.getItem('accessToken') || localStorage.getItem('token') || '';

export const useApi = (initialUrl?: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (options?: { method?: string; body?: any; headers?: Record<string, string>; url?: string }) => {
    const targetUrl = options?.url || initialUrl;
    if (!targetUrl) throw new Error('API URL is required');

    setLoading(true);
    setError(null);
    try {
      const token = getStoredToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers || {}),
      };

      const res = await fetch(targetUrl, {
        method: options?.method || 'GET',
        headers,
        body: options?.body ? JSON.stringify(options.body) : undefined,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }

      const result = await res.json();
      setData(result);
      return result;
    } catch (err: any) {
      const msg = err.message || 'API Request Failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [initialUrl]);

  return { data, loading, error, execute };
};

export default useApi;
