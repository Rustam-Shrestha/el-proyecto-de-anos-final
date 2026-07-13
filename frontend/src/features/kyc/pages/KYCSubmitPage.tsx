import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@shared/components/Button";
import { SkeletonLoader } from "@shared/components/SkeletonLoader";
import { useToast } from "@shared/hooks/useToast";
import {
  useGetMyKYCStatus,
  useSubmitKYCMutation,
} from "@features/kyc/api/kycApi";
import { KYCWizardSteps } from "@features/kyc/components/KYCWizardSteps";
import { Step1Upload } from "@features/kyc/components/Step1Upload";
import { Step2Processing } from "@features/kyc/components/Step2Processing";
import { Step3Review } from "@features/kyc/components/Step3Review";
import { Step4FaceResult } from "@features/kyc/components/Step4FaceResult";
import { Step5Report } from "@features/kyc/components/Step5Report";

const STEPS = ["Upload", "OCR", "Review", "Face", "Submit"];

const KYCSubmitPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: existingKyc, isLoading: checkingKyc } = useGetMyKYCStatus();

  const [currentStep, setCurrentStep] = useState(1);
  const [kycApplicationId, setKycApplicationId] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<any>({});
  const [ocrData, setOcrData] = useState<any>(null);
  const [faceResult, setFaceResult] = useState<any>(null);

  useEffect(() => {
    if (existingKyc) {
      const status = existingKyc?.status || (existingKyc as any)?.applicationStatus;
      if (status === "APPROVED" || status === "UNDER_REVIEW" || status === "PENDING_REVIEW") {
        navigate("/dashboard/kyc-status");
      }
    }
  }, [existingKyc, navigate]);

  const handleUploadComplete = useCallback((files: any, kycId: string) => {
    setUploadedFiles(files);
    setKycApplicationId(kycId);
    setCurrentStep(2);
  }, []);

  const handleProcessingComplete = useCallback((extracted: any) => {
    setOcrData(extracted);
    setCurrentStep(3);
  }, []);

  const handleReviewComplete = useCallback((confirmedData: any) => {
    setCurrentStep(4);
  }, []);

  const handleFaceComplete = useCallback((result: any) => {
    setFaceResult(result);
    setCurrentStep(5);
  }, []);

  const handleReportGenerated = useCallback((report: any) => {
    toast("KYC submitted successfully!", "success");
    navigate("/dashboard/kyc-status");
  }, [navigate, toast]);

  const handleSkipOcr = useCallback(() => {
    setOcrData({});
    setCurrentStep(3);
  }, []);

  if (checkingKyc) return <SkeletonLoader className="h-64" />;

  return (
    <div className="panel">
      <h1>KYC Submission</h1>
      <p className="text-sm text-gray-500 mb-6">Step {currentStep} of 5: {STEPS[currentStep - 1]}</p>

      <KYCWizardSteps currentStep={currentStep} steps={STEPS} />

      <div className="mt-6">
        {currentStep === 1 && (
          <Step1Upload onComplete={handleUploadComplete} />
        )}
        {currentStep === 2 && (
          <Step2Processing
            kycApplicationId={kycApplicationId}
            uploadedFiles={uploadedFiles}
            onComplete={handleProcessingComplete}
            onSkip={handleSkipOcr}
          />
        )}
        {currentStep === 3 && (
          <Step3Review
            kycApplicationId={kycApplicationId}
            ocrData={ocrData || {}}
            onComplete={handleReviewComplete}
            onBack={() => setCurrentStep(2)}
          />
        )}
        {currentStep === 4 && (
          <Step4FaceResult
            kycApplicationId={kycApplicationId}
            uploadedFiles={uploadedFiles}
            onComplete={handleFaceComplete}
            onBack={() => setCurrentStep(3)}
          />
        )}
        {currentStep === 5 && (
          <Step5Report
            kycApplicationId={kycApplicationId}
            onComplete={handleReportGenerated}
            onBack={() => setCurrentStep(4)}
          />
        )}
      </div>
    </div>
  );
};

export default KYCSubmitPage;
