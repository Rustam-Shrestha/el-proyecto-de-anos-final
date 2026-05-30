// """
// useKYC Hook - Custom React hook for KYC operations.

// Manages:
// - Document uploads (citizenship, selfie)
// - Face verification
// - Status polling
// - Error handling

// Uses TanStack Query for data fetching and caching.
// """

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { kycApiService, type UploadResponse, type VerifyResponse } from "../api/kycApi";

interface UseKYCOptions {
  kycApplicationId?: string;
  userId?: string;
  pollInterval?: number;
}

export const useKYC = (options: UseKYCOptions = {}) => {
  const queryClient = useQueryClient();
  const { kycApplicationId, userId, pollInterval = 5000 } = options;

  const [uploadProgress, setUploadProgress] = useState(0);

  const kycStatusQuery = useQuery({
    queryKey: ["kyc-status", kycApplicationId],
    queryFn: async () => {
      if (!kycApplicationId) throw new Error("KYC Application ID is required");
      return kycApiService.getKYCStatus(kycApplicationId);
    },
    enabled: !!kycApplicationId,
    refetchInterval: kycApplicationId ? pollInterval : undefined,
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
      return kycApiService.uploadDocument(
        userId,
        documentType,
        file,
        setUploadProgress
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["kyc-status", data.kyc_application_id],
      });
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
      return kycApiService.verifyFace(
        kycApplicationId,
        selfiePath,
        idDocumentPath
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["kyc-status", kycApplicationId],
      });
    },
  });

  const uploadDocument = useCallback(
    async (documentType: string, file: File) => {
      return uploadDocumentMutation.mutateAsync({ documentType, file });
    },
    [uploadDocumentMutation]
  );

  const verifyFace = useCallback(
    async (selfiePath: string, idDocumentPath: string) => {
      return verifyFaceMutation.mutateAsync({ selfiePath, idDocumentPath });
    },
    [verifyFaceMutation]
  );

  const resetProgress = useCallback(() => {
    setUploadProgress(0);
  }, []);

  return {
    // Status
    kycStatus: kycStatusQuery.data,
    kycStatusLoading: kycStatusQuery.isLoading,
    kycStatusError: kycStatusQuery.error,

    // Document upload
    uploadDocument,
    uploadProgress,
    isUploading: uploadDocumentMutation.isPending,
    uploadError: uploadDocumentMutation.error,
    resetProgress,

    // Face verification
    verifyFace,
    isVerifying: verifyFaceMutation.isPending,
    verifyError: verifyFaceMutation.error,
    lastVerification: verifyFaceMutation.data,
  };
};
