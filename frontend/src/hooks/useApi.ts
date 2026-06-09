import { BASE_API_URL } from '../utils/constants';

const getToken = () => localStorage.getItem('accessToken') || '';

const buildUrl = (path: string, params?: Record<string, unknown>) => {
  const url = new URL(path, BASE_API_URL);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.append(k, String(v));
    });
  }
  return url.toString();
};

const useApi = () => {
  const headersWithAuth = (isForm = false) => {
    const token = getToken();
    const base: Record<string, string> = {};
    if (!isForm) base['Content-Type'] = 'application/json';
    if (token) base['Authorization'] = `Bearer ${token}`;
    return base;
  };

  const get = async (path: string, config?: { params?: Record<string, unknown> }) => {
    const url = buildUrl(path, config?.params);
    const res = await fetch(url, { method: 'GET', headers: headersWithAuth() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const post = async (path: string, data?: any, config?: Record<string, unknown>) => {
    const isForm = data instanceof FormData;
    const url = buildUrl(path, config?.params as any);
    const res = await fetch(url, { method: 'POST', headers: headersWithAuth(isForm), body: isForm ? data : JSON.stringify(data) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const patch = async (path: string, data?: any, config?: Record<string, unknown>) => {
    const isForm = data instanceof FormData;
    const url = buildUrl(path, config?.params as any);
    const res = await fetch(url, { method: 'PATCH', headers: headersWithAuth(isForm), body: isForm ? data : JSON.stringify(data) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const del = async (path: string, config?: { params?: Record<string, unknown> }) => {
    const url = buildUrl(path, config?.params);
    const res = await fetch(url, { method: 'DELETE', headers: headersWithAuth() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  return { get, post, patch, delete: del };
};

export default useApi;
