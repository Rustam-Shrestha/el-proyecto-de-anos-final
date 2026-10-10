import { useApiQuery, useApiMutation } from '@/shared/hooks';

export const createQuery = (url: string, options?: { enabled?: boolean; params?: Record<string, any> }) => {
  return () => useApiQuery(url, options);
};

export const createMutation = (url: string, method: 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'POST') => {
  return () => useApiMutation(url, method);
};
