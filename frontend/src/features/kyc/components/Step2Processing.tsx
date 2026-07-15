import { useState, useEffect, useRef } from "react";
import { Button } from "@shared/components/Button";
import { useToast } from "@shared/hooks/useToast";
import { useKYC, type ProcessingStatus } from "../hooks/useKYC";

interface Props {
  kycApplicationId: string;
  uploadedFiles: any;
  onComplete: (ocrExtracted: any) => void;
  onSkip: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  VALIDATING_FACE: "Verifying your face...",
  AWAITING_OCR: "Face verified! Extracting document data...",
  AWAITING_USER_CONFIRMATION: "Processing complete — review your data",
  COMPLETE: "All done!",
};

const FACE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Waiting to start...",
  PROCESSING: "Comparing faces...",
  VERIFIED: "Face matched!",
  FAILED: "Face verification issue",
  SKIPPED: "Face verification skipped",
};

const OCR_STATUS_LABELS: Record<string, string> = {
  PENDING: "Waiting for face verification...",
  EXTRACTING: "Reading document fields...",
  EXTRACTED: "Document data extracted",
  PARTIAL: "Some fields extracted (admin will verify)",
  FAILED: "Document extraction needs admin review",
};

export const Step2Processing = ({ kycApplicationId, uploadedFiles, onComplete, onSkip }: Props) => {
  const toast = useToast();
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pollStatus, setPollStatus] = useState<"idle" | "polling" | "done" | "error">("idle");

  const { kycStatus, kycStatusLoading } = useKYC({
    kycApplicationId,
    pollInterval: 3000,
  });

  // Timer for elapsed display
  useEffect(() => {
    if (pollStatus === "polling") {
      timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pollStatus]);

  // Start polling when component mounts
  useEffect(() => {
    if (kycApplicationId) {
      setPollStatus("polling");
    }
  }, [kycApplicationId]);

  // Collect OCR data when done
  const latestOcr = kycStatus?.latestOcrResult?.extractedData || {};
  const ocrData = Object.keys(latestOcr).length > 0 ? latestOcr : null;

  const formattedElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  const mergeOcrFromAllDocs = async (): Promise<any> => {
    try {
      const { default: apiClient } = await import("@shared/lib/apiClient");
      const frontRes = await apiClient.post("/kyc/extract-ocr", {
        kycApplicationId,
        documentType: "CITIZENSHIP_FRONT",
      });
      const backRes = await apiClient.post("/kyc/extract-ocr", {
        kycApplicationId,
        documentType: "CITIZENSHIP_BACK",
      });
      return {
        ...(frontRes.data?.data?.extractedData || {}),
        ...(backRes.data?.data?.extractedData || {}),
      };
    } catch {
      return null;
    }
  };

  const handleContinue = async () => {
    if (ocrData && Object.keys(ocrData).length > 0) {
      onComplete(ocrData);
    } else {
      const merged = await mergeOcrFromAllDocs();
      onComplete(merged || {});
    }
  };

  const stage: string = (kycStatus as any)?.workflowStage || "VALIDATING_FACE";
  const faceStatus: string = (kycStatus as any)?.faceVerificationStatus || "PENDING";
  const ocrStatus: string = (kycStatus as any)?.ocrProcessingStatus || "PENDING";
  const processingStatus: string = (kycStatus as any)?.processingStatus || "PENDING";
  const queuedForReview: boolean = (kycStatus as any)?.queuedForManualReview || false;
  const faceSimilarity = (kycStatus as any)?.faceVerification?.similarityScore;

  const isProcessing = pollStatus === "polling" && !["DONE", "FAILED"].includes(processingStatus);
  const isComplete = processingStatus === "DONE" || stage === "COMPLETE";
  const isFailed = processingStatus === "FAILED";
  const isError = pollStatus === "error" || isFailed;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Step 2: Processing Your Documents</h2>
      <p className="text-sm text-gray-600 mb-4">
        We verify your face first, then extract document data in the background.
      </p>

      {pollStatus === "idle" && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
          <p>Preparing to process your documents...</p>
        </div>
      )}

      {isProcessing && (
        <div className="space-y-4">
          {/* Face verification progress */}
          <div className={`p-4 rounded border ${faceStatus === "VERIFIED" ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{faceStatus === "VERIFIED" ? "✅" : faceStatus === "FAILED" ? "❌" : faceStatus === "SKIPPED" ? "⏭️" : "🔄"}</span>
              <div className="flex-1">
                <p className="font-medium text-sm">{FACE_STATUS_LABELS[faceStatus] || "Checking face..."}</p>
                {faceSimilarity !== undefined && faceSimilarity !== null && (
                  <p className="text-xs text-gray-500">Similarity: {Math.round(faceSimilarity * 100)}%</p>
                )}
              </div>
              {faceStatus === "PROCESSING" && (
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full shrink-0" />
              )}
            </div>
          </div>

          {/* OCR progress */}
          <div className={`p-4 rounded border ${ocrStatus === "EXTRACTED" ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">
                {ocrStatus === "EXTRACTED" ? "✅" : ocrStatus === "FAILED" || ocrStatus === "PARTIAL" ? "⚠️" : faceStatus !== "VERIFIED" ? "⏳" : "🔄"}
              </span>
              <div className="flex-1">
                <p className="font-medium text-sm">{OCR_STATUS_LABELS[ocrStatus] || "Extracting..."}</p>
                {ocrStatus === "EXTRACTED" && kycStatus?.latestOcrResult && (
                  <p className="text-xs text-gray-500">Confidence: {Math.round((kycStatus.latestOcrResult as any).overallConfidence * 100)}%</p>
                )}
              </div>
              {(ocrStatus === "EXTRACTING" || ocrStatus === "EXTRACTED") && faceStatus === "VERIFIED" && (
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full shrink-0" />
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
              style={{
                width: `${faceStatus === "VERIFIED" ? (ocrStatus === "EXTRACTED" ? 95 : 50) : 20}%`,
              }}
            />
          </div>

          <p className="text-xs text-gray-400">
            Elapsed: {formattedElapsed(elapsed)} &mdash; {STAGE_LABELS[stage] || "Processing..."}
          </p>

          {queuedForReview && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
              Some data needs manual review by an admin. You can continue in the meantime.
            </div>
          )}
        </div>
      )}

      {isComplete && (
        <div className="mt-4">
          <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
            <p className="text-green-700 font-medium">Processing complete ({formattedElapsed(elapsed)})</p>
            {faceSimilarity !== undefined && (
              <p className="text-sm text-green-600">Face match: {Math.round(faceSimilarity * 100)}%</p>
            )}
            {kycStatus?.latestOcrResult && (
              <p className="text-sm text-green-600">Document confidence: {Math.round((kycStatus.latestOcrResult as any).overallConfidence * 100)}%</p>
            )}
          </div>

          {ocrData && Object.keys(ocrData).length > 0 && (
            <div className="space-y-2 border rounded p-4 mb-4">
              {Object.entries(ocrData).map(([key, val]) => (
                <div key={key} className="flex gap-2 text-sm">
                  <span className="font-medium min-w-[140px] capitalize">{key.replace(/_/g, " ")}:</span>
                  <span>{String(val)}</span>
                </div>
              ))}
            </div>
          )}

          {queuedForReview && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700 mb-4">
              Some data needs manual review. An admin will verify the results.
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="primary" onClick={handleContinue}>
              {ocrData ? "Continue to Review" : "Continue"}
            </Button>
            <Button variant="secondary" onClick={onSkip}>Enter Details Manually</Button>
          </div>
        </div>
      )}

      {isError && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded">
          <p className="text-amber-700 font-medium mb-1">Processing needs attention</p>
          <p className="text-sm text-amber-600 mb-3">
            {kycStatus?.faceError || kycStatus?.processingError || "Some processing steps need manual review."}
          </p>
          <div className="flex gap-3">
            <Button variant="primary" onClick={handleContinue}>Continue Anyway</Button>
            <Button variant="secondary" onClick={onSkip}>Enter Details Manually</Button>
          </div>
        </div>
      )}
    </div>
  );
};
