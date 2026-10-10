const getAuthToken = () => localStorage.getItem('accessToken') || localStorage.getItem('token') || '';

export const apiClient = {
  get: async (url: string, config?: Record<string, any>) => {
    const token = getAuthToken();
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(config?.headers || {}),
      },
    });
    if (!res.ok) throw new Error(await res.text() || 'GET request failed');
    return res.json();
  },

  post: async (url: string, body?: any, config?: Record<string, any>) => {
    const token = getAuthToken();
    const isForm = body instanceof FormData;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...(isForm ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(config?.headers || {}),
      },
      body: isForm ? body : JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text() || 'POST request failed');
    return res.json();
  },

  put: async (url: string, body?: any, config?: Record<string, any>) => {
    const token = getAuthToken();
    const isForm = body instanceof FormData;
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        ...(isForm ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(config?.headers || {}),
      },
      body: isForm ? body : JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text() || 'PUT request failed');
    return res.json();
  },

  delete: async (url: string, config?: Record<string, any>) => {
    const token = getAuthToken();
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(config?.headers || {}),
      },
    });
    if (!res.ok) throw new Error(await res.text() || 'DELETE request failed');
    return res.json();
  },
};

export default apiClient;
