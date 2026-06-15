import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DocumentType } from "@shared/types/common";
import { Button } from "@shared/components/Button";
import { SkeletonLoader } from "@shared/components/SkeletonLoader";
import { useToast } from "@shared/hooks/useToast";
import {
  useGetMyKYCStatus,
  useSubmitKYCMutation,
  useUploadDocumentMutation,
} from "@features/kyc/api/kycApi";
import { KYCWizardSteps } from "@features/kyc/components/KYCWizardSteps";
import { Step1Identity } from "@features/kyc/components/steps/Step1Identity";
import { Step2Selfie } from "@features/kyc/components/steps/Step2Selfie";
import { Step3Employment } from "@features/kyc/components/steps/Step3Employment";
import type { EmploymentData } from "@features/kyc/components/steps/Step3Employment";
import { Step4Income } from "@features/kyc/components/steps/Step4Income";
import { Step5Review } from "@features/kyc/components/steps/Step5Review";

interface UploadedDoc {
  documentId: string;
  kycApplicationId: string;
}

const STEPS = ["Identity", "Selfie", "Employment", "Income", "Review"];

const KYCSubmitPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: existingKyc, isLoading: checkingKyc } = useGetMyKYCStatus();
  const submitMutation = useSubmitKYCMutation();
  const uploadMutation = useUploadDocumentMutation();

  const [currentStep, setCurrentStep] = useState(1);

  const [citizenshipFront, setCitizenshipFront] = useState<File | null>(null);
  const [citizenshipBack, setCitizenshipBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [employmentData, setEmploymentData] = useState<EmploymentData | null>(null);
  const [incomeProofs, setIncomeProofs] = useState<File[]>([]);
  const [bankStatement, setBankStatement] = useState<File | null>(null);
  const [existingLoan, setExistingLoan] = useState<File | null>(null);
  const [collateral, setCollateral] = useState<File | null>(null);

  const [uploaded, setUploaded] = useState<Record<string, UploadedDoc | null>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [kycId, setKycId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [step3Valid, setStep3Valid] = useState(false);

  useEffect(() => {
    if (checkingKyc) return;
    if (existingKyc) {
      const status = existingKyc.status;
      if (status === "PENDING" || status === "UNDER_REVIEW" || status === "APPROVED") {
        navigate("/dashboard/kyc-status", { replace: true });
      }
    }
  }, [existingKyc, checkingKyc, navigate]);

  const handleStep1File = useCallback(
    async (type: DocumentType, file: File) => {
      if (type === DocumentType.CITIZENSHIP_FRONT) setCitizenshipFront(file);
      if (type === DocumentType.CITIZENSHIP_BACK) setCitizenshipBack(file);
    },
    []
  );

  const handleStep1Clear = useCallback((type: DocumentType) => {
    if (type === DocumentType.CITIZENSHIP_FRONT) setCitizenshipFront(null);
    if (type === DocumentType.CITIZENSHIP_BACK) setCitizenshipBack(null);
    setUploaded((prev) => ({ ...prev, [type]: null }));
  }, []);

  const handleSelfieSelect = useCallback((file: File) => {
    setSelfie(file);
  }, []);

  const handleSelfieClear = useCallback(() => {
    setSelfie(null);
    setUploaded((prev) => ({ ...prev, [DocumentType.SELFIE]: null }));
  }, []);

  const handleEmploymentSave = useCallback((data: EmploymentData) => {
    setEmploymentData(data);
  }, []);

  const uploadDoc = useCallback(
    async (type: DocumentType | string, file: File) => {
      const key = typeof type === "string" ? type : type;
      setUploading((prev) => ({ ...prev, [key]: true }));
      try {
        const result = await uploadMutation.mutateAsync({
          kycId: kycId!,
          documentType: type as DocumentType,
          file,
        });
        setUploaded((prev) => ({
          ...prev,
          [key]: { documentId: result.id, kycApplicationId: result.kycId },
        }));
        toast.success(`${key} uploaded`);
      } catch {
        toast.error(`Failed to upload ${key}`);
      } finally {
        setUploading((prev) => ({ ...prev, [key]: false }));
      }
    },
    [kycId, uploadMutation, toast]
  );

  const handleIncomeFileSelect = useCallback(
    async (type: DocumentType, file: File) => {
      if (type === DocumentType.INCOME_PROOF) {
        setIncomeProofs((prev) => [...prev, file]);
        if (kycId) {
          await uploadDoc(`${DocumentType.INCOME_PROOF}_${incomeProofs.length}`, file);
        }
      }
      if (type === DocumentType.BANK_STATEMENT) {
        setBankStatement(file);
        if (kycId) await uploadDoc(type, file);
      }
      if (type === DocumentType.EXISTING_LOAN) {
        setExistingLoan(file);
        if (kycId) await uploadDoc(type, file);
      }
      if (type === DocumentType.COLLATERAL) {
        setCollateral(file);
        if (kycId) await uploadDoc(type, file);
      }
    },
    [kycId, incomeProofs.length, uploadDoc]
  );

  const handleIncomeClear = useCallback((type: DocumentType) => {
    if (type === DocumentType.BANK_STATEMENT) setBankStatement(null);
    else if (type === DocumentType.EXISTING_LOAN) setExistingLoan(null);
    else if (type === DocumentType.COLLATERAL) setCollateral(null);
    setUploaded((prev) => ({ ...prev, [type]: null }));
  }, []);

  const canGoNext = useCallback(() => {
    switch (currentStep) {
      case 1:
        return Boolean(citizenshipFront && citizenshipBack);
      case 2:
        return Boolean(selfie);
      case 3:
        return step3Valid;
      case 4:
        return incomeProofs.length > 0;
      default:
        return false;
    }
  }, [currentStep, citizenshipFront, citizenshipBack, selfie, step3Valid, incomeProofs.length]);

  const handleNext = useCallback(() => {
    if (canGoNext()) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  }, [canGoNext]);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selfie || !citizenshipFront || !citizenshipBack) {
      toast.error("Missing required identity documents");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("selfie", selfie);
      formData.append("idProof", citizenshipFront);
      formData.append("addressProof", citizenshipBack);

      if (employmentData) {
        formData.append("jobTitle", employmentData.jobTitle);
        formData.append("employmentType", employmentData.employmentType);
        formData.append("employmentStartDate", employmentData.employmentStartDate);
        formData.append("declaredAnnualIncome", String(employmentData.declaredAnnualIncome));
      }

      const submitResult = await submitMutation.mutateAsync(formData);
      const kycApplicationId =
        (submitResult as { kyc_application_id?: string }).kyc_application_id ??
        (submitResult as { id?: string }).id ??
        "";
      setKycId(kycApplicationId);

      setUploaded((prev) => ({
        ...prev,
        [DocumentType.CITIZENSHIP_FRONT]: { documentId: "", kycApplicationId },
        [DocumentType.CITIZENSHIP_BACK]: { documentId: "", kycApplicationId },
        [DocumentType.SELFIE]: { documentId: "", kycApplicationId },
      }));

      for (let i = 0; i < incomeProofs.length; i++) {
        const key = `${DocumentType.INCOME_PROOF}_${i}`;
        setUploading((prev) => ({ ...prev, [key]: true }));
        try {
          const doc = await uploadMutation.mutateAsync({
            kycId: kycApplicationId,
            documentType: DocumentType.INCOME_PROOF,
            file: incomeProofs[i],
          });
          setUploaded((prev) => ({
            ...prev,
            [key]: { documentId: doc.id, kycApplicationId: doc.kycId },
          }));
        } catch {
          toast.error(`Failed to upload income proof ${i + 1}`);
        } finally {
          setUploading((prev) => ({ ...prev, [key]: false }));
        }
      }

      for (const [type, file] of [
        [DocumentType.BANK_STATEMENT, bankStatement] as const,
        [DocumentType.EXISTING_LOAN, existingLoan] as const,
        [DocumentType.COLLATERAL, collateral] as const,
      ]) {
        if (file) {
          const key = type;
          setUploading((prev) => ({ ...prev, [key]: true }));
          try {
            const doc = await uploadMutation.mutateAsync({
              kycId: kycApplicationId,
              documentType: type,
              file,
            });
            setUploaded((prev) => ({
              ...prev,
              [key]: { documentId: doc.id, kycApplicationId: doc.kycId },
            }));
          } catch {
            toast.error(`Failed to upload ${type}`);
          } finally {
            setUploading((prev) => ({ ...prev, [key]: false }));
          }
        }
      }

      toast.success("KYC application submitted successfully");
      navigate("/dashboard/kyc-status", { replace: true });
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selfie,
    citizenshipFront,
    citizenshipBack,
    employmentData,
    incomeProofs,
    bankStatement,
    existingLoan,
    collateral,
    submitMutation,
    uploadMutation,
    toast,
    navigate,
  ]);

  if (checkingKyc) {
    return (
      <div className="space-y-4">
        <SkeletonLoader count={3} type="card" />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div
        className="rounded-3xl border p-6 shadow-sm"
        style={{
          backgroundColor: "var(--surface-color)",
          borderColor: "var(--border-color)",
        }}
      >
        <p
          className="text-sm font-semibold uppercase tracking-[0.22em]"
          style={{ color: "var(--green-icon)" }}
        >
          KYC Application
        </p>
        <h1
          className="mt-1 text-2xl font-semibold"
          style={{ color: "var(--text-color)" }}
        >
          Submit your KYC application
        </h1>
      </div>

      <div
        className="rounded-3xl border p-6 shadow-sm"
        style={{
          backgroundColor: "var(--surface-color)",
          borderColor: "var(--border-color)",
        }}
      >
        <KYCWizardSteps currentStep={currentStep} steps={STEPS} />

        <div className="mt-8">
          {currentStep === 1 ? (
            <Step1Identity
              citizenshipFront={citizenshipFront}
              citizenshipBack={citizenshipBack}
              frontUploaded={uploaded[DocumentType.CITIZENSHIP_FRONT]}
              backUploaded={uploaded[DocumentType.CITIZENSHIP_BACK]}
              isUploadingFront={Boolean(uploading[DocumentType.CITIZENSHIP_FRONT])}
              isUploadingBack={Boolean(uploading[DocumentType.CITIZENSHIP_BACK])}
              onFileSelect={handleStep1File}
              onClear={handleStep1Clear}
            />
          ) : null}

          {currentStep === 2 ? (
            <Step2Selfie
              selfie={selfie}
              uploaded={uploaded[DocumentType.SELFIE]}
              isUploading={Boolean(uploading[DocumentType.SELFIE])}
              onFileSelect={handleSelfieSelect}
              onClear={handleSelfieClear}
            />
          ) : null}

          {currentStep === 3 ? (
            <Step3Employment
              data={employmentData}
              onSave={handleEmploymentSave}
              onValidityChange={setStep3Valid}
            />
          ) : null}

          {currentStep === 4 ? (
            <Step4Income
              incomeProofs={incomeProofs}
              bankStatement={bankStatement}
              existingLoan={existingLoan}
              collateral={collateral}
              uploaded={uploaded}
              uploading={uploading}
              onFileSelect={handleIncomeFileSelect}
              onClear={handleIncomeClear}
            />
          ) : null}

          {currentStep === 5 ? (
            <Step5Review
              citizenshipFront={citizenshipFront}
              citizenshipBack={citizenshipBack}
              selfie={selfie}
              employmentData={employmentData}
              incomeProofs={incomeProofs}
              bankStatement={bankStatement}
              existingLoan={existingLoan}
              collateral={collateral}
              frontUploaded={uploaded[DocumentType.CITIZENSHIP_FRONT]}
              backUploaded={uploaded[DocumentType.CITIZENSHIP_BACK]}
              selfieUploaded={uploaded[DocumentType.SELFIE]}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
            />
          ) : null}
        </div>

        {currentStep < 5 ? (
          <div className="mt-8 flex items-center justify-between border-t pt-6" style={{ borderColor: "var(--border-color)" }}>
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canGoNext()}
            >
              {currentStep === 4 ? "Review" : "Next"}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default KYCSubmitPage;
