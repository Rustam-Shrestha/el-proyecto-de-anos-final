import React, { memo, useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import InputField from "../../../components/common/InputField";
import CustomTextArea from "../../../components/common/CustomTextArea";
import {
  PrimaryButton,
  SecondaryButton,
  FileUploadButton,
} from "../../../components/common/Button";
import { useKYC } from "../hooks/useKYC";
import type { KYCStatus } from "../api/kycApi";

type KYCInputProps = React.ComponentType<{
  label?: string;
  error?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  name?: string;
}>;

interface KYCFormProps {
  userId: string;
  onKYCComplete?: (_kycApplicationId: string) => void;
}

const KYCInputField = InputField as KYCInputProps;
const KYCTextArea = CustomTextArea as KYCInputProps;

const step1Schema = z.object({
  name: z.string().min(2, "Enter a valid name"),
  email: z.string().email("Enter a valid email"),
  address: z.string().min(5, "Enter an address"),
  phone: z.string().min(7, "Enter a valid phone number"),
});

type Step1Values = z.infer<typeof step1Schema>;

const KYCForm = memo<KYCFormProps>(({ userId, onKYCComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);

  const { kycStatus, uploadDocument, verifyFace, isUploading, uploadProgress } =
    useKYC({ userId });

  const { control, handleSubmit } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: "",
      email: "",
      address: "",
      phone: "",
    },
  });

  const onStep1Submit = useCallback(() => {
    setCurrentStep(2);
  }, []);

  const handleCitizenshipUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") => {
      const file = e.target.files?.item(0);
      if (!file) return;

      try {
        await uploadDocument(`citizenship_${side}`, file);
        globalThis.alert(`Citizenship ${side} uploaded successfully`);
      } catch (error) {
        globalThis.alert(`Upload failed: ${error}`);
      }
    },
    [uploadDocument]
  );

  const handleSelfieUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.item(0);
      if (!file) return;

      try {
        await uploadDocument("selfie", file);
        globalThis.alert("Selfie uploaded successfully");
        if (kycStatus?.document_count && kycStatus.document_count >= 3) {
          setCurrentStep(4);
        }
      } catch (error) {
        globalThis.alert(`Selfie upload failed: ${error}`);
      }
    },
    [uploadDocument, kycStatus?.document_count]
  );

  const handleVerifyFace = useCallback(async () => {
    if (!kycStatus?.documents || kycStatus.documents.length < 2) {
      globalThis.alert("Please upload selfie and citizenship document");
      return;
    }

    const selfieDoc = kycStatus.documents.find(
      (document: { type: string; id: string }) => document.type === "selfie"
    );
    const citizenshipDoc = kycStatus.documents.find(
      (document: { type: string; id: string }) =>
        document.type.includes("citizenship_front")
    );

    if (!selfieDoc || !citizenshipDoc) {
      globalThis.alert("Please upload selfie and citizenship document");
      return;
    }

    try {
      const result = await verifyFace(selfieDoc.id, citizenshipDoc.id);
      if (result.is_match) {
        globalThis.alert("Face verification successful!");
        onKYCComplete?.(result.verification_id);
      } else {
        globalThis.alert("Face verification failed. Please try again.");
      }
    } catch (error) {
      globalThis.alert(`Verification failed: ${error}`);
    }
  }, [kycStatus?.documents, verifyFace, onKYCComplete]);

  return (
    <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.25em] text-gray-500">FinGuard KYC</p>
        <h1 className="text-3xl font-semibold text-gray-900">Identity verification</h1>
        <p className="mt-2 text-sm text-gray-600">
          Upload your citizenship and selfie documents, then verify the identity match.
        </p>
      </div>

      {currentStep === 1 && (
        <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-5">
          <h2 className="text-xl font-semibold text-gray-900">Step 1: Personal Information</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <KYCInputField label="Name" {...field} error={fieldState.error?.message} />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field, fieldState }) => (
                <KYCInputField label="Email" type="email" {...field} error={fieldState.error?.message} />
              )}
            />

            <div className="md:col-span-2">
              <Controller
                control={control}
                name="address"
                render={({ field, fieldState }) => (
                  <KYCTextArea label="Address" {...field} error={fieldState.error?.message} />
                )}
              />
            </div>

            <Controller
              control={control}
              name="phone"
              render={({ field, fieldState }) => (
                <KYCInputField label="Phone" type="tel" {...field} error={fieldState.error?.message} />
              )}
            />
          </div>

          <div className="flex justify-end pt-2">
            <PrimaryButton type="submit" label="Next: Upload Documents" />
          </div>
        </form>
      )}

      {currentStep === 2 && (
        <div className="space-y-5">
          <h2 className="text-xl font-semibold text-gray-900">Step 2: Upload Documents</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Citizenship Front</label>
              <FileUploadButton
                label={isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : "Upload front image"}
                onFileSelect={(e: React.ChangeEvent<HTMLInputElement>) => handleCitizenshipUpload(e, "front")}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Citizenship Back</label>
              <FileUploadButton
                label={isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : "Upload back image"}
                onFileSelect={(e: React.ChangeEvent<HTMLInputElement>) => handleCitizenshipUpload(e, "back")}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <SecondaryButton onClick={() => setCurrentStep(1)} label="Previous" className="flex-1" />
              <PrimaryButton onClick={() => setCurrentStep(3)} label="Next: Selfie" className="flex-1" />
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-5">
          <h2 className="text-xl font-semibold text-gray-900">Step 3: Upload Selfie</h2>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Take a selfie with your citizenship document
            </label>
            <FileUploadButton
              label={isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : "Upload selfie"}
              onFileSelect={handleSelfieUpload}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <SecondaryButton onClick={() => setCurrentStep(2)} label="Previous" className="flex-1" />
            <PrimaryButton onClick={() => setCurrentStep(4)} label="Next: Verify & Submit" className="flex-1" />
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="space-y-5">
          <h2 className="text-xl font-semibold text-gray-900">Step 4: Verification</h2>

          {kycStatus && (
            <div className="space-y-3 rounded-xl bg-gray-50 p-4 ring-1 ring-gray-200">
              <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
                <p><strong>Status:</strong> {kycStatus.status}</p>
                <p><strong>Confidence:</strong> {(kycStatus.confidence_score * 100).toFixed(2)}%</p>
                <p><strong>Documents:</strong> {kycStatus.document_count} / 3</p>
              </div>

              {kycStatus.ocr_results.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-800">OCR Results</p>
                  {kycStatus.ocr_results.map((ocr: KYCStatus["ocr_results"][number]) => (
                    <div key={ocr.id} className="rounded-lg bg-white p-3 text-xs ring-1 ring-gray-200">
                      <p>Language: {ocr.language_detected}</p>
                      <p>Confidence: {(ocr.confidence_score * 100).toFixed(2)}%</p>
                      <p className="break-words">Data: {JSON.stringify(ocr.structured_data)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <PrimaryButton
            onClick={handleVerifyFace}
            label="Verify Face & Complete KYC"
            className="w-full"
            disabled={!kycStatus || kycStatus.document_count < 3}
          />
        </div>
      )}
    </div>
  );
});

KYCForm.displayName = "KYCForm";

export default KYCForm;