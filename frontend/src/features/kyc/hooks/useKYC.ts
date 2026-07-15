import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { kycApiService, type UploadResponse, type VerifyResponse } from "../api/kycApi";

interface UseKYCOptions {
  kycApplicationId?: string;
  userId?: string;
  pollInterval?: number;
}

export interface ProcessingStatus {
  workflowStage: string;
  processingStatus: string;
  faceVerificationStatus: string;
  ocrProcessingStatus: string;
  faceVerification: any;
  latestOcrResult: any;
  submissionFile: any;
  queuedForManualReview: boolean;
  pendingReviewQueue: any[];
  faceError: string | null;
  processingError: string | null;
}

export const useKYC = (options: UseKYCOptions = {}) => {
  const queryClient = useQueryClient();
  const { kycApplicationId, userId, pollInterval = 5000 } = options;

  const [uploadProgress, setUploadProgress] = useState(0);

  // Poll detailed processing status (face-first workflow)
  const kycStatusQuery = useQuery({
    queryKey: ["kyc-processing", kycApplicationId],
    queryFn: async (): Promise<ProcessingStatus | null> => {
      if (!kycApplicationId) return null;
      const res = await fetch(`/api/v1/kyc/status/${kycApplicationId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      const json = await res.json();
      return json?.data || null;
    },
    enabled: !!kycApplicationId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return pollInterval;
      const done = data.workflowStage === 'COMPLETE' || data.processingStatus === 'FAILED';
      return done ? false : pollInterval;
    },
    staleTime: 0,
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async ({
      documentType,
      file,
    }: {
      documentType: string;
      file: File;
    }): Promise<UploadResponse> => {
      if (!userId) throw new Error("User ID is required");
      return kycApiService.uploadDocument(userId, documentType, file, setUploadProgress);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["kyc-processing", data.kyc_application_id] });
    },
  });

  const verifyFaceMutation = useMutation({
    mutationFn: async ({
      selfiePath,
      idDocumentPath,
    }: {
      selfiePath: string;
      idDocumentPath: string;
    }): Promise<VerifyResponse> => {
      if (!kycApplicationId) throw new Error("KYC Application ID is required");
      return kycApiService.verifyFace(kycApplicationId, selfiePath, idDocumentPath);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc-processing", kycApplicationId] });
    },
  });

  const uploadDocument = useCallback(
    async (documentType: string, file: File) => uploadDocumentMutation.mutateAsync({ documentType, file }),
    [uploadDocumentMutation]
  );

  const verifyFace = useCallback(
    async (selfiePath: string, idDocumentPath: string) => verifyFaceMutation.mutateAsync({ selfiePath, idDocumentPath }),
    [verifyFaceMutation]
  );

  const resetProgress = useCallback(() => setUploadProgress(0), []);

  return {
    kycStatus: kycStatusQuery.data,
    kycStatusLoading: kycStatusQuery.isLoading,
    kycStatusError: kycStatusQuery.error,

    uploadDocument,
    uploadProgress,
    isUploading: uploadDocumentMutation.isPending,
    uploadError: uploadDocumentMutation.error,
    resetProgress,

    verifyFace,
    isVerifying: verifyFaceMutation.isPending,
    verifyError: verifyFaceMutation.error,
    lastVerification: verifyFaceMutation.data,
  };
};
