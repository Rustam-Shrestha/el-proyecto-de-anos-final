import { useState, useCallback } from 'react';
import { useDocumentService } from '../services/documentService';
import { DocumentItem } from '../types/document';

export const useDocument = () => {
  const service = useDocumentService();
  const [data, setData] = useState<DocumentItem | null>(null);
  const [versions, setVersions] = useState<DocumentItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, _setError] = useState<string | null>(null);

  const upload = useCallback(async (form: FormData) => {
    setLoading(true);
    try {
      const res = await service.upload(form);
      setData(res.data as DocumentItem);
      return res.data;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const getById = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await service.getById(id);
      setData(res.data as DocumentItem);
      return res.data;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const getVersions = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await service.getVersions(id);
      setVersions(res.data as DocumentItem[]);
      return res.data;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    try {
      return await service.remove(id);
    } finally {
      setLoading(false);
    }
  }, [service]);

  const replace = useCallback(async (id: string, form: FormData) => {
    setLoading(true);
    try {
      return await service.replace(id, form);
    } finally {
      setLoading(false);
    }
  }, [service]);

  return { data, versions, loading, error, upload, getById, getVersions, remove, replace };
};

export default useDocument;
