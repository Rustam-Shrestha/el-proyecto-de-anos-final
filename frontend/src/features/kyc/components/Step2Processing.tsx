import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@shared/components/Button";
import { useToast } from "@shared/hooks/useToast";
import { apiClient } from "@shared/lib/apiClient";

interface Props {
  kycApplicationId: string;
  uploadedFiles: any;
  onComplete: (ocrExtracted: any) => void;
  onSkip: () => void;
}

export const Step2Processing = ({ kycApplicationId, onComplete, onSkip }: Props) => {
  const toast = useToast();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [ocrData, setOcrData] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartOcr = useCallback(async () => {
    setStatus("loading");
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    setMessage("AI model loading (first run downloads ~50MB)...");
    try {
      const frontRes = await apiClient.post("/kyc/extract-ocr", {
        kycApplicationId,
        documentType: "CITIZENSHIP_FRONT",
      });
      const frontData = frontRes.data?.data?.extractedData || frontRes.data?.extractedData || {};

      setMessage("Processing back document...");
      const backRes = await apiClient.post("/kyc/extract-ocr", {
        kycApplicationId,
        documentType: "CITIZENSHIP_BACK",
      });
      const backData = backRes.data?.data?.extractedData || backRes.data?.extractedData || {};

      const merged = { ...frontData, ...backData };
      setOcrData(merged);
      setStatus("done");
      if (timerRef.current) clearInterval(timerRef.current);
      toast("Data extracted successfully", "success");
    } catch (err: any) {
      setStatus("error");
      if (timerRef.current) clearInterval(timerRef.current);
      setMessage(err?.response?.data?.message || err?.message || "OCR extraction failed");
      toast("OCR extraction failed. You can enter details manually.", "warning");
    }
  }, [kycApplicationId, toast]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Step 2: Extract Document Data</h2>
      <p className="text-sm text-gray-600 mb-4">
        We'll extract text from your citizenship documents using AI-powered OCR.
      </p>

      {status === "idle" && (
        <div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded mb-4 text-sm text-blue-700">
            <p className="font-medium mb-1">First run notice</p>
            <p>The OCR engine needs to download AI models on first use (~50MB). This can take 5&ndash;10 minutes depending on your internet and CPU. Subsequent runs will be much faster (30&ndash;60 seconds).</p>
          </div>
          <Button variant="primary" onClick={handleStartOcr}>
            Start OCR Extraction
          </Button>
        </div>
      )}

      {status === "loading" && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center gap-3 mb-2">
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full shrink-0" />
            <div>
              <p className="text-blue-700 font-medium">Processing &mdash; elapsed: {fmt(elapsed)}</p>
              <p className="text-sm text-blue-600">{message}</p>
            </div>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min((elapsed / 600) * 100, 95)}%` }}
            />
          </div>
          <p className="text-xs text-blue-400 mt-2">
            This can take 5&ndash;10 minutes on first run (model download). Do not refresh the page.
          </p>
        </div>
      )}

      {status === "done" && ocrData && (
        <div className="mt-4">
          <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
            <p className="text-green-700 font-medium">Data extracted successfully ({fmt(elapsed)})</p>
          </div>
          <div className="space-y-2 border rounded p-4">
            {Object.entries(ocrData).map(([key, val]) => (
              <div key={key} className="flex gap-2 text-sm">
                <span className="font-medium min-w-[140px] capitalize">{key.replace(/_/g, " ")}:</span>
                <span>{String(val)}</span>
              </div>
            ))}
          </div>
          <Button variant="primary" className="mt-4" onClick={() => onComplete(ocrData)}>
            Continue to Review
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded">
          <p className="text-amber-700 font-medium mb-1">Extraction failed ({fmt(elapsed)})</p>
          <p className="text-sm text-amber-600 mb-3">{message}</p>
          <div className="flex gap-3">
            <Button variant="primary" onClick={handleStartOcr}>Retry</Button>
            <Button variant="secondary" onClick={onSkip}>Enter Details Manually</Button>
          </div>
        </div>
      )}

      {status !== "idle" && status !== "loading" && (
        <div className="mt-3">
          <Button variant="secondary" onClick={onSkip}>
            Skip &mdash; Enter Details Manually
          </Button>
        </div>
      )}
    </div>
  );
};
