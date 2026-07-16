import { Button } from "@shared/components/Button";
import { useKYC } from "../hooks/useKYC";

interface Props {
  kycApplicationId: string;
  uploadedFiles: Record<string, unknown>;
  onComplete: (result: { similarityScore: number; status: string; recommendation: string | null } | null) => void;
  onBack: () => void;
}

export const Step4FaceResult = ({ kycApplicationId, onComplete, onBack }: Props) => {
  const { kycStatus, kycStatusLoading } = useKYC({
    kycApplicationId,
    pollInterval: 3000,
  });

  const faceVerification = kycStatus?.faceVerification;
  const faceStatus = kycStatus?.faceVerificationStatus;
  const similarityScore = faceVerification?.similarityScore;

  const result = faceVerification
    ? {
        similarityScore,
        status: faceVerification.status,
        recommendation: faceVerification.recommendation,
      }
    : null;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Step 4: Face Verification</h2>
      <p className="text-sm text-gray-600 mb-4">
        Your face was verified during processing. Here's the result.
      </p>

      {kycStatusLoading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded flex items-center gap-3">
          <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
          <p className="text-blue-700 text-sm">Loading face verification result...</p>
        </div>
      )}

      {!kycStatusLoading && !result && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded">
          <p className="text-amber-700 font-medium mb-2">Face verification data not available</p>
          <p className="text-sm text-amber-600 mb-3">Face verification may still be processing or was skipped.</p>
          <Button variant="secondary" onClick={() => onComplete(null)}>Continue Anyway</Button>
        </div>
      )}

      {result && !kycStatusLoading && (
        <div className="mt-4">
          <div className={`rounded p-4 mb-4 border ${
            faceStatus === "VERIFIED" ? "bg-green-50 border-green-200" :
            faceStatus === "FAILED" ? "bg-red-50 border-red-200" :
            "bg-amber-50 border-amber-200"
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">
                {faceStatus === "VERIFIED" ? "✅" : faceStatus === "FAILED" ? "❌" : "⚠️"}
              </span>
              <div>
                <p className="font-medium">Similarity: {Math.round((similarityScore || 0) * 100)}%</p>
                <p className="text-sm">Match: {result.status?.replace(/_/g, " ")}</p>
                {result.recommendation && (
                  <p className="text-sm">Recommendation: {result.recommendation}</p>
                )}
              </div>
            </div>
          </div>

          {kycStatus?.queuedForManualReview && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700 mb-4">
              This result has been queued for manual review by an admin.
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="primary" onClick={() => onComplete(result)}>Continue</Button>
            <Button variant="secondary" onClick={onBack}>Back</Button>
          </div>
        </div>
      )}
    </div>
  );
};
