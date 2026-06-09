import useApi from '../hooks/useApi';
import { DocumentItem } from '../types/document';

export const useDocumentService = () => {
  const api = useApi();

  const upload = async (form: FormData) => {
    const res = await api.post<{ success: boolean; data: DocumentItem }>('/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  };

  const getById = async (id: string) => {
    const res = await api.get<{ success: boolean; data: DocumentItem }>(`/documents/${id}`);
    return res.data;
  };

  const getVersions = async (id: string) => {
    const res = await api.get<{ success: boolean; data: DocumentItem[] }>(`/documents/${id}/versions`);
    return res.data;
  };

  const remove = async (id: string) => {
    const res = await api.delete(`/documents/${id}`);
    return res.data;
  };

  const replace = async (id: string, form: FormData) => {
    const res = await api.post(`/documents/${id}/replace`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  };

  return { upload, getById, getVersions, remove, replace };
};
