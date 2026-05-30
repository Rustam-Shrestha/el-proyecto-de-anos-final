import axios from "axios";
import type { AxiosProgressEvent } from "axios";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/apiClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface KYCStatus {
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

export type KYCApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type KYCApplication = {
  id: string;
  applicantEmail: string;
  applicant_email?: string;
  status: KYCApplicationStatus;
  appliedAt: string;
  applied_at?: string;
  approvedAt?: string | null;
  approved_at?: string | null;
  rejectedAt?: string | null;
  rejected_at?: string | null;
  rejectionReason?: string | null;
  rejection_reason?: string | null;
  documents: { id?: string; name?: string; filename?: string }[];
  notes?: string | null;
};

export type MyKYCStatus = {
  id: string;
  status: KYCApplicationStatus;
  appliedAt: string;
  applied_at?: string;
  approvedAt?: string | null;
  approved_at?: string | null;
  rejectedAt?: string | null;
  rejected_at?: string | null;
  rejectionReason?: string | null;
  rejection_reason?: string | null;
  approvalMessage?: string | null;
  approval_message?: string | null;
  documents: { id?: string; name?: string; filename?: string }[];
};

type KYCListApiResponse =
  | {
      applications: KYCApplication[];
      total: number;
    }
  | {
      success: boolean;
      data: KYCApplication[];
      meta: {
        total: number;
      };
    };

type KYCDetailsApiResponse =
  | KYCApplication
  | {
      success: boolean;
      data: KYCApplication;
    };

type KYCStatusPayload = {
  notes?: string;
  reason?: string;
};

type MyKYCStatusApiResponse =
  | MyKYCStatus
  | {
      success: boolean;
      data: MyKYCStatus | null;
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

class KycApiService {
  private baseURL = API_BASE_URL;

  /**
   * Upload a document for KYC processing.
   *
   * Triggers OCR processing asynchronously for citizenship documents.
   */
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
      const response = await axios.post(
        `${this.baseURL}/kyc/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (onProgress && progressEvent.total) {
              onProgress((progressEvent.loaded / progressEvent.total) * 100);
            }
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Document upload failed: ${error}`);
    }
  }

  /**
   * Verify face match between selfie and ID document.
   *
   * Returns match verdict and confidence distance.
   */
  async verifyFace(
    kycApplicationId: string,
    selfiePath: string,
    idDocumentPath: string
  ): Promise<VerifyResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/kyc/verify`,
        {
          kyc_application_id: kycApplicationId,
          selfie_path: selfiePath,
          id_document_path: idDocumentPath,
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Face verification failed: ${error}`);
    }
  }

  /**
   * Retrieve KYC application status and results.
   *
   * Includes OCR results, face verification results, and documents.
   */
  async getKYCStatus(kycApplicationId: string): Promise<KYCStatus> {
    try {
      const response = await axios.get(
        `${this.baseURL}/kyc/status/${kycApplicationId}`
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to retrieve KYC status: ${error}`);
    }
  }
}

export const kycApiService = new KycApiService();

export const useKYCApplications = (page: number, limit: number, status: string) => {
  return useQuery({
    queryKey: ["kyc", page, limit, status],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set("page", String(page));
      searchParams.set("limit", String(limit));
      if (status && status !== "ALL") {
        searchParams.set("status", status);
      }

      const { data } = await apiClient.get<KYCListApiResponse>(`/kyc?${searchParams.toString()}`);

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

export const useKYCApplication = (id?: string) => {
  return useQuery({
    queryKey: ["kyc", id],
    queryFn: async () => {
      if (!id) {
        throw new Error("KYC application id is required");
      }

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

export const useApproveKYCMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { data } = await apiClient.patch<KYCDetailsApiResponse>(`/kyc/${id}/approve`, {
        notes,
      } satisfies KYCStatusPayload);
      return "success" in data ? data.data : data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc"] });
    },
  });
};

export const useRejectKYCMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data } = await apiClient.patch<KYCDetailsApiResponse>(`/kyc/${id}/reject`, {
        reason,
      } satisfies KYCStatusPayload);
      return "success" in data ? data.data : data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc"] });
    },
  });
};

export const useSubmitKYCMutation = () => {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async (payload: FormData) => {
      setUploadProgress(0);
      const { data } = await apiClient.post<SubmitKYCResponse>("/kyc/submit", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (event) => {
          if (event.total) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        },
      });

      if ("success" in data) {
        return data.data;
      }

      return data;
    },
    onSuccess: () => {
      setUploadProgress(100);
      queryClient.invalidateQueries({ queryKey: ["kyc"] });
    },
    onSettled: () => {
      setTimeout(() => setUploadProgress(0), 300);
    },
  });

  return {
    ...mutation,
    uploadProgress,
  };
};

export const useGetMyKYCStatus = () => {
  return useQuery({
    queryKey: ["kyc", "my-status"],
    queryFn: async () => {
      const { data } = await apiClient.get<MyKYCStatusApiResponse>("/kyc/my-status");

      if (!data) {
        return null;
      }

      if ("success" in data) {
        return data.data;
      }

      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: true,
  });
};
