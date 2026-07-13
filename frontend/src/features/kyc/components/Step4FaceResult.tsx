import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@shared/components/Button";
import { useToast } from "@shared/hooks/useToast";
import { apiClient } from "@shared/lib/apiClient";

interface Props {
  kycApplicationId: string;
  uploadedFiles: any;
  onComplete: (result: any) => void;
  onBack: () => void;
}

export const Step4FaceResult = ({ kycApplicationId, onComplete, onBack }: Props) => {
  const toast = useToast();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<any>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleVerify = useCallback(async () => {
    setStatus("loading");
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    try {
      const res = await apiClient.post("/kyc/verify-face", {
        kycApplicationId,
      });
      const data = res.data?.data || res.data;
      setResult(data);
      setStatus("done");
      if (timerRef.current) clearInterval(timerRef.current);
      toast("Face verification completed", "success");
    } catch (err: any) {
      setStatus("error");
      if (timerRef.current) clearInterval(timerRef.current);
      toast("Face verification failed. You can continue without it.", "warning");
    }
  }, [kycApplicationId, toast]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Step 4: Face Verification</h2>
      <p className="text-sm text-gray-600 mb-4">
        We'll compare your selfie with the photo on your citizenship document using AI.
      </p>

      {status === "idle" && (
        <div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded mb-4 text-sm text-blue-700">
            <p className="font-medium mb-1">First run notice</p>
            <p>The face matching model (~92MB) downloads on first use. This can take 2&ndash;5 minutes. Subsequent runs are much faster.</p>
          </div>
          <Button variant="primary" onClick={handleVerify}>
            Start Face Verification
          </Button>
        </div>
      )}

      {status === "loading" && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center gap-3 mb-2">
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full shrink-0" />
            <div>
              <p className="text-blue-700 font-medium">Verifying face &mdash; elapsed: {fmt(elapsed)}</p>
              <p className="text-sm text-blue-600">Comparing faces using AI model...</p>
            </div>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min((elapsed / 300) * 100, 95)}%` }}
            />
          </div>
          <p className="text-xs text-blue-400 mt-2">
            First run may take 2&ndash;5 minutes (model loading). Do not refresh.
          </p>
        </div>
      )}

      {status === "done" && result && (
        <div className="mt-4">
          <div className={`rounded p-4 mb-4 border ${
            result.status === "MATCH" ? "bg-green-50 border-green-200" :
            result.status === "POSSIBLE_MATCH" ? "bg-amber-50 border-amber-200" :
            "bg-red-50 border-red-200"
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">
                {result.status === "MATCH" ? "✅" : result.status === "POSSIBLE_MATCH" ? "⚠️" : "❌"}
              </span>
              <div>
                <p className="font-medium">Similarity: {Math.round((result.similarityScore || 0) * 100)}%</p>
                <p className="text-sm">Status: {result.status?.replace(/_/g, " ")}</p>
                {result.recommendation && (
                  <p className="text-sm">Recommendation: {result.recommendation}</p>
                )}
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-400 mb-3">Completed in {fmt(elapsed)}</div>
          <Button variant="primary" onClick={() => onComplete(result)}>
            Continue
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded">
          <p className="text-amber-700 font-medium mb-2">Verification failed ({fmt(elapsed)})</p>
          <p className="text-sm text-amber-600 mb-3">You can skip this step and continue.</p>
          <div className="flex gap-3">
            <Button variant="primary" onClick={handleVerify}>Retry</Button>
            <Button variant="secondary" onClick={() => onComplete(null)}>Skip</Button>
          </div>
        </div>
      )}

      <div className="mt-4">
        <Button variant="secondary" onClick={onBack}>Back</Button>
      </div>
    </div>
  );
};
