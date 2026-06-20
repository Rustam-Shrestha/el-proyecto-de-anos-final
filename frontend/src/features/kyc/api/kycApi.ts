import axios from "axios";
import type { AxiosProgressEvent } from "axios";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/apiClient";
import type { ApiResponse } from "@shared/types/common";
import type {
  KYCApplication,
  KYCDocument,
  DocumentType,
} from "@shared/types/common";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface KYCStatusResponse {
  kyc_application_id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  confidence_score: number;
  document_count: number;
  documents: Document[];
  ocr_results: OCRResult[];
  face_verifications: FaceVerification[];
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  type: string;
  uploaded_at: string;
}

export interface OCRResult {
  id: string;
  document_type: string;
  language_detected: string;
  confidence_score: number;
  structured_data: Record<string, unknown>;
}

export interface FaceVerification {
  id: string;
  is_match: boolean;
  distance: number;
  verified_at: string;
}

export interface UploadResponse {
  document_id: string;
  kyc_application_id: string;
  status: string;
  message: string;
}

export interface VerifyResponse {
  verification_id: string;
  is_match: boolean;
  distance: number;
  status: string;
  message: string;
}

type KYCListApiResponse =
  | {
      applications: KYCApplication[];
      total: number;
    }
  | {
      success: boolean;
      data: KYCApplication[];
      meta: { total: number };
    };

type KYCDetailsApiResponse =
  | KYCApplication
  | {
      success: boolean;
      data: KYCApplication;
    };

type MyKYCStatusApiResponse =
  | KYCApplication
  | {
      success: boolean;
      data: KYCApplication | null;
    }
  | null;

type SubmitKYCResponse =
  | {
      success: boolean;
      data: {
        kyc_application_id: string;
        message?: string;
      };
    }
  | {
      kyc_application_id: string;
      message?: string;
    };

export const kycKeys = {
  all: ["kyc"] as const,
  list: (page: number, limit: number, status?: string) =>
    ["kyc", "list", page, limit, status].filter(Boolean) as readonly string[],
  detail: (id: string) => ["kyc", id] as const,
  myStatus: ["kyc", "my-status"] as const,
  documents: (kycId: string) => ["kyc", "documents", kycId] as const,
};

class KycApiService {
  private baseURL = API_BASE_URL;

  async uploadDocument(
    userId: string,
    documentType: string,
    file: unknown,
    onProgress?: (...args: [number]) => void
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("document_type", documentType);
    formData.append("file", file as string);

    try {
      const response = await axios.post(`${this.baseURL}/kyc/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (onProgress && progressEvent.total) {
            onProgress((progressEvent.loaded / progressEvent.total) * 100);
          }
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Document upload failed: ${error}`);
    }
  }

  async verifyFace(
    kycApplicationId: string,
    selfiePath: string,
    idDocumentPath: string
  ): Promise<VerifyResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/kyc/verify`, {
        kyc_application_id: kycApplicationId,
        selfie_path: selfiePath,
        id_document_path: idDocumentPath,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Face verification failed: ${error}`);
    }
  }

  async getKYCStatus(kycApplicationId: string): Promise<KYCStatusResponse> {
    try {
      const response = await axios.get(`${this.baseURL}/kyc/status/${kycApplicationId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to retrieve KYC status: ${error}`);
    }
  }
}

export const kycApiService = new KycApiService();

export const useKYCList = (page: number, limit: number, status?: string) => {
  return useQuery({
    queryKey: kycKeys.list(page, limit, status),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set("page", String(page));
      searchParams.set("limit", String(limit));
      if (status && status !== "ALL") {
        searchParams.set("status", status);
      }

      const { data } = await apiClient.get<KYCListApiResponse>(
        `/kyc?${searchParams.toString()}`
      );

      if ("applications" in data) {
        return data;
      }

      return {
        applications: data.data,
        total: data.meta.total,
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: true,
  });
};

export const useGetKYCDetails = (id: string) => {
  return useQuery({
    queryKey: kycKeys.detail(id),
    queryFn: async () => {
      if (!id) throw new Error("KYC application id is required");

      const { data } = await apiClient.get<KYCDetailsApiResponse>(`/kyc/${id}`);
      if ("success" in data) {
        return data.data;
      }
      return data;
    },
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    retry: true,
  });
};

export const useGetMyKYCStatus = () => {
  return useQuery({
    queryKey: kycKeys.myStatus,
    queryFn: async () => {
      const { data } = await apiClient.get<MyKYCStatusApiResponse>("/kyc/my-status");

      if (!data) return null;

      if ("success" in data) {
        return data.data;
      }
      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useSubmitKYCMutation = () => {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async (payload: FormData) => {
      setUploadProgress(0);
      const { data } = await apiClient.post<SubmitKYCResponse>("/kyc/submit", payload, {
        onUploadProgress: (event) => {
          if (event.total) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        },
      });

      if ("success" in data) return data.data;
      return data;
    },
    onSuccess: () => {
      setUploadProgress(100);
      queryClient.invalidateQueries({ queryKey: kycKeys.all });
      queryClient.invalidateQueries({ queryKey: kycKeys.myStatus });
    },
    onSettled: () => {
      setTimeout(() => setUploadProgress(0), 300);
    },
  });

  return { ...mutation, uploadProgress };
};

export const useUploadDocumentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      kycId,
      documentType,
      file,
    }: {
      kycId: string;
      documentType: DocumentType;
      file: File;
    }) => {
      const formData = new FormData();
      formData.append("kycId", kycId);
      formData.append("documentType", documentType);
      formData.append("document", file);

      const { data } = await apiClient.post<ApiResponse<KYCDocument>>(
        "/kyc/documents/upload",
        formData
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycKeys.all });
    },
  });
};

export const useApproveKYCMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { data } = await apiClient.patch<KYCDetailsApiResponse>(
        `/kyc/${id}/approve`,
        { notes }
      );
      return "success" in data ? data.data : data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycKeys.all });
    },
  });
};

export const useRejectKYCMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data } = await apiClient.patch<KYCDetailsApiResponse>(
        `/kyc/${id}/reject`,
        { rejectionReason: reason }
      );
      return "success" in data ? data.data : data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycKeys.all });
    },
  });
};

export const useGetKYCDocuments = (kycId: string) => {
  return useQuery({
    queryKey: kycKeys.documents(kycId),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<KYCDocument[]>>(
        `/kyc/${kycId}/documents`
      );
      return data.data;
    },
    enabled: Boolean(kycId),
  });
};

export const useVerifyDocumentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await apiClient.patch<ApiResponse<KYCDocument>>(
        `/kyc/documents/${id}/verify`,
        { status }
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycKeys.all });
    },
  });
};

export const useReplaceDocumentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append("document", file);

      const { data } = await apiClient.post<ApiResponse<KYCDocument>>(
        `/kyc/documents/${id}/replace`,
        formData
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycKeys.all });
    },
  });
};

export const useKYCApplications = useKYCList;
export const useKYCApplication = useGetKYCDetails;
