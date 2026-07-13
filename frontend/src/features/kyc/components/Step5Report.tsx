import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@shared/components/Button";
import { useToast } from "@shared/hooks/useToast";
import { apiClient } from "@shared/lib/apiClient";

interface Props {
  kycApplicationId: string;
  onComplete: (report: any) => void;
  onBack: () => void;
}

export const Step5Report = ({ kycApplicationId, onComplete, onBack }: Props) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get(`/kyc/get-verification-report/${kycApplicationId}`);
        const data = res.data?.data || res.data;
        setReport(data);
      } catch {
        setReport(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [kycApplicationId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      toast("KYC submitted for review!", "success");
      onComplete(report);
      navigate("/dashboard/kyc-status");
    } catch {
      toast("Failed to submit. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">Generating verification report...</p>
      </div>
    );
  }

  const parsedReport = report?.report ? (() => { try { return JSON.parse(report.report); } catch { return null; } })() : null;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Step 5: Verification Report</h2>

      {parsedReport && (
        <div className="space-y-3 mb-6">
          <div className="flex justify-between p-3 bg-gray-50 rounded">
            <span>Face Similarity</span>
            <span className="font-medium">{parsedReport.faceSimilarity || "N/A"}%</span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 rounded">
            <span>OCR Confidence</span>
            <span className="font-medium">{parsedReport.ocrConfidence || "N/A"}%</span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 rounded">
            <span>Fields Corrected</span>
            <span className="font-medium">{parsedReport.fieldsCorrected || 0}</span>
          </div>
          {parsedReport.possibleMismatches?.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded">
              <p className="font-medium text-amber-700 mb-1">Possible Mismatches</p>
              <ul className="list-disc pl-5 text-sm text-amber-600">
                {parsedReport.possibleMismatches.map((m: string) => (<li key={m}>{m}</li>))}
              </ul>
            </div>
          )}
          {parsedReport.manualReviewSuggested && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded">
              <p className="text-amber-700">Manual review suggested due to above discrepancies.</p>
            </div>
          )}
        </div>
      )}

      {!parsedReport && (
        <div className="p-4 bg-gray-50 rounded mb-6">
          <p className="text-gray-600">Verification report will be generated after admin review.</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit KYC for Review"}
        </Button>
      </div>
    </div>
  );
};
