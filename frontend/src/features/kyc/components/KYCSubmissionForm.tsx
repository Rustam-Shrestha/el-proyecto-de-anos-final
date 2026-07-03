import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { XCircle } from "lucide-react";
import { Button } from "@components/Button";
import Input from "@components/Input";
import { SkeletonLoader } from "@shared/components/SkeletonLoader";
import { FileUploadField } from "@shared/components/FileUploadField";
import { useToast } from "@hooks/useToast";
import { apiClient } from "@shared/lib/apiClient";
import { useSubmitKYCMutation } from "@features/kyc/api/kycApi";
import type { KYCApplication } from "@shared/types/common";
import { DocumentType, FILE_VALIDATION } from "@shared/types/common";
import CustomDatePicker from "@components/common/CutomDatePicker";

type CurrentUser = {
  id?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  address?: string;
};

type FileField = "selfie" | "idProof" | "addressProof";

const FIELD_TO_DOC_TYPE: Record<FileField, DocumentType> = {
  selfie: DocumentType.SELFIE,
  idProof: DocumentType.CITIZENSHIP_FRONT,
  addressProof: DocumentType.CITIZENSHIP_BACK,
};

const FIELD_LABELS: Record<FileField, string> = {
  selfie: "Selfie",
  idProof: "ID Proof (Citizenship Front)",
  addressProof: "Address Proof (Citizenship Back)",
};

type KYCSubmissionFormProps = {
  onSubmitted?: () => void;
};

export const KYCSubmissionForm = ({ onSubmitted }: KYCSubmissionFormProps) => {
  const navigate = useNavigate();
  const toast = useToast();
  const submitMutation = useSubmitKYCMutation();
  const [step, setStep] = useState(1);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [files, setFiles] = useState<Record<FileField, File | null>>({
    selfie: null,
    idProof: null,
    addressProof: null,
  });
  const [kycId, setKycId] = useState<string | null>(null);
  const [ocrData, setOcrData] = useState<{
    ocrFullName: string;
    ocrCitizenshipNumber: string;
    ocrDateOfBirth: string;
    ocrGender: string;
    ocrAddress: string;
    faceSimilarity: number;
    faceStatus: string;
  } | null>(null);
  const [confirmedData, setConfirmedData] = useState({
    confirmedFullName: "",
    confirmedCitizenshipNumber: "",
    confirmedDateOfBirth: "",
    confirmedGender: "",
    confirmedAddress: "",
    confirmedPhoneNumber: "",
    confirmedEmail: "",
  });
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [pollingError, setPollingError] = useState<string | null>(null);
  const [isSubmittingConfirmed, setIsSubmittingConfirmed] = useState(false);

  const authQuery = useQuery({
    queryKey: ["auth", "me", "kyc-submit"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data?: CurrentUser }>("/users/me");
      return data.data ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (authQuery.data) {
      setCurrentUser(authQuery.data);
      setFullName(authQuery.data.fullName ?? "");
      setPhone(authQuery.data.phone ?? "");
      setAddress(authQuery.data.address ?? "");
    }
  }, [authQuery.data]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const canContinueFromStep2 = Boolean(files.selfie && files.idProof && files.addressProof);

  const handleFileSelect = useCallback((field: FileField, file: File) => {
    setFiles((prev) => ({ ...prev, [field]: file }));
  }, []);

  const handleFileClear = useCallback((field: FileField) => {
    setFiles((prev) => ({ ...prev, [field]: null }));
  }, []);

  const handleSubmit = async () => {
    const fileKeys: FileField[] = ["selfie", "idProof", "addressProof"];
    for (const key of fileKeys) {
      const f = files[key];
      if (!f || !(f instanceof File) || f.size === 0 || !f.name) {
        toast.error(`Invalid or empty file for "${FIELD_LABELS[key]}". Please re-select it.`);
        return;
      }
    }

    const formData = new FormData();
    formData.append("selfie", files.selfie as File);
    formData.append("idProof", files.idProof as File);
    formData.append("addressProof", files.addressProof as File);
    formData.append("fullName", fullName);
    formData.append("phone", phone);
    formData.append("address", address);

    try {
      const result = await submitMutation.mutateAsync(formData);
      const id =
        (result as { id?: string }).id ??
        (result as { kyc_application_id?: string }).kyc_application_id ??
        "";
      setKycId(id);

      setConfirmedData({
        confirmedFullName: fullName,
        confirmedCitizenshipNumber: "",
        confirmedDateOfBirth: "",
        confirmedGender: "",
        confirmedAddress: address,
        confirmedPhoneNumber: phone,
        confirmedEmail: currentUser?.email ?? "",
      });

      setStep(4);
      startPolling(id);
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || "Upload error. Please retry.");
    }
  };

  const MAX_POLLING_ATTEMPTS = 90;

  const skipToManualEntry = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setStep(5);
  }, []);

  const startPolling = useCallback((_id: string) => {
    setPollingAttempts(0);
    setPollingError(null);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await apiClient.get<{ success: boolean; data: KYCApplication | null }>(
          "/kyc/my-status"
        );
        const app = data.data;
        if (app && app.ocrResults && app.ocrResults.length > 0) {
          const ocrResult = app.ocrResults[0];
          const extracted = ocrResult.extractedData as Record<string, string>;
          setOcrData({
            ocrFullName: extracted.name ?? app.ocrFullName ?? "",
            ocrCitizenshipNumber: extracted.citizenshipNumber ?? app.ocrCitizenshipNumber ?? "",
            ocrDateOfBirth: extracted.dateOfBirth ?? app.ocrDateOfBirth ?? "",
            ocrGender: extracted.gender ?? app.ocrGender ?? "",
            ocrAddress: extracted.address ?? app.ocrAddress ?? "",
            faceSimilarity: app.faceVerification?.similarityScore ?? 0,
            faceStatus: app.faceVerification?.status ?? "PENDING",
          });
          setConfirmedData((prev) => ({
            ...prev,
            confirmedFullName: prev.confirmedFullName || extracted.name || app.ocrFullName || "",
            confirmedCitizenshipNumber: extracted.citizenshipNumber || app.ocrCitizenshipNumber || "",
            confirmedDateOfBirth: extracted.dateOfBirth || app.ocrDateOfBirth || "",
            confirmedGender: extracted.gender || app.ocrGender || "",
            confirmedAddress: prev.confirmedAddress || extracted.address || app.ocrAddress || "",
          }));
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          setStep(5);
          return;
        }
        setPollingAttempts((prev) => prev + 1);
      } catch (err) {
        const apiError = err as { response?: { data?: { message?: string } } };
        const msg = apiError.response?.data?.message || "Failed to check processing status";
        setPollingError(msg);
        setPollingAttempts((prev) => prev + 1);
      }
    }, 2000);
  }, []);

  useEffect(() => {
    if (pollingAttempts >= MAX_POLLING_ATTEMPTS && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
      const msg = pollingError
        ? `Processing timed out: ${pollingError}. You can enter the details manually.`
        : "OCR processing is taking longer than expected. You can enter the details manually.";
      toast.error(msg);
      setStep(5);
    }
  }, [pollingAttempts, pollingError, toast]);

  const handleConfirmSubmit = async () => {
    if (!kycId) {
      toast.error("No KYC application found. Please start over.");
      return;
    }

    setIsSubmittingConfirmed(true);
    try {
      await apiClient.post("/kyc/submit-confirmed", {
        kycApplicationId: kycId,
        confirmedData,
      });
      toast.success("KYC application confirmed and submitted for review");
      onSubmitted?.();
      navigate("/dashboard/kyc-status", { replace: true });
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || "Confirmation failed. Please try again.");
    } finally {
      setIsSubmittingConfirmed(false);
    }
  };

  const handleFieldChange = (field: keyof typeof confirmedData, value: string) => {
    setConfirmedData((prev) => ({ ...prev, [field]: value }));
  };

  if (authQuery.isLoading) {
    return <SkeletonLoader count={3} type="list" />;
  }

  const accept = FILE_VALIDATION.ALLOWED_MIME_TYPES.join(",");

  return (
    <div className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--green-icon)]">
          KYC Submission
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-gray-900">
          Submit your KYC application
        </h2>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className={step >= 1 ? "font-semibold text-gray-900" : "text-gray-500"}>1. Personal</span>
        <span className="text-gray-400">-</span>
        <span className={step >= 2 ? "font-semibold text-gray-900" : "text-gray-500"}>2. Upload</span>
        <span className="text-gray-400">-</span>
        <span className={step >= 3 ? "font-semibold text-gray-900" : "text-gray-500"}>3. Review</span>
        <span className="text-gray-400">-</span>
        <span className={step >= 4 ? "font-semibold text-gray-900" : "text-gray-500"}>4. Verify</span>
        <span className="text-gray-400">-</span>
        <span className={step >= 5 ? "font-semibold text-gray-900" : "text-gray-500"}>5. Confirm</span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-[var(--green-icon)] transition-all"
          style={{ width: `${Math.min((step / 5) * 100, 100)}%` }}
        />
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="Email" value={currentUser?.email ?? ""} readOnly />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
          <div className="flex justify-end">
            <Button type="button" onClick={() => setStep(2)}>Next</Button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-5">
          {(["selfie", "idProof", "addressProof"] as FileField[]).map((field) => (
            <FileUploadField
              key={field}
              label={FIELD_LABELS[field]}
              documentType={FIELD_TO_DOC_TYPE[field]}
              accept={accept}
              maxSizeMB={FILE_VALIDATION.MAX_SIZE_MB}
              currentFile={files[field]}
              onFileSelect={(file) => handleFileSelect(field, file)}
              onClear={() => handleFileClear(field)}
              isRequired
            />
          ))}
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" type="button" onClick={() => setStep(1)}>Back</Button>
            <Button type="button" onClick={() => setStep(3)} disabled={!canContinueFromStep2}>Review</Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-5">
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Name:</strong> {fullName || "Not provided"}</p>
            <p><strong>Phone:</strong> {phone || "Not provided"}</p>
            <p><strong>Address:</strong> {address || "Not provided"}</p>
            <p>Selfie: {files.selfie?.name ?? "Not selected"}</p>
            <p>ID Proof: {files.idProof?.name ?? "Not selected"}</p>
            <p>Address Proof: {files.addressProof?.name ?? "Not selected"}</p>
          </div>

          {submitMutation.isPending ? (
            <div className="space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-[var(--green-icon)] transition-all"
                  style={{ width: `${submitMutation.uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">
                Uploading application... {Math.round(submitMutation.uploadProgress)}%
              </p>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" type="button" onClick={() => setStep(2)}>Back</Button>
            <Button
              type="button"
              onClick={handleSubmit}
              isLoading={submitMutation.isPending}
              disabled={!canContinueFromStep2}
            >
              Submit Application
            </Button>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-5 py-8 text-center">
          {pollingError ? (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          ) : (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-8 w-8 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900">Processing your documents</h3>
          {pollingError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{pollingError}</p>
              <p className="mt-1 text-xs text-red-600">
                Retrying automatically ({pollingAttempts}/{MAX_POLLING_ATTEMPTS})...
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              We are extracting data from your documents using OCR and verifying your face match.
              This may take a few seconds...
            </p>
          )}
          <p className="text-xs text-gray-400">Attempt {pollingAttempts}/{MAX_POLLING_ATTEMPTS}</p>
          <div className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={skipToManualEntry}
            >
              Enter details manually
            </Button>
          </div>
        </div>
      ) : null}

      {step === 5 ? (
        <div className="space-y-5">
          {ocrData ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-semibold text-green-800">
                Documents processed successfully!
              </p>
              {ocrData.faceStatus !== "PENDING" ? (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-green-700">Face Match:</span>
                  <span className={`font-semibold ${ocrData.faceStatus === "MATCH" ? "text-green-700" : "text-amber-700"}`}>
                    {ocrData.faceStatus === "MATCH" ? "Verified" : ocrData.faceStatus}
                  </span>
                  <span className="text-gray-500">
                    ({(ocrData.faceSimilarity * 100).toFixed(1)}% similarity)
                  </span>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800">
                Automatic data extraction timed out
              </p>
              <p className="mt-1 text-xs text-amber-700">
                Please enter your details manually below. Your files have been received successfully.
              </p>
            </div>
          )}

          <h3 className="text-lg font-semibold text-gray-900">
            Confirm Information
          </h3>
          <p className="text-sm text-gray-500">
            {ocrData
              ? "Please review the information extracted from your documents. Edit any fields that need correction."
              : "Enter your details manually. All fields are editable."}
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                value={confirmedData.confirmedFullName}
                onChange={(e) => handleFieldChange("confirmedFullName", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              {ocrData?.ocrFullName ? (
                <p className="mt-1 text-xs text-gray-400">OCR detected: {ocrData.ocrFullName}</p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Citizenship Number</label>
              <input
                type="text"
                value={confirmedData.confirmedCitizenshipNumber}
                onChange={(e) => handleFieldChange("confirmedCitizenshipNumber", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              {ocrData?.ocrCitizenshipNumber ? (
                <p className="mt-1 text-xs text-gray-400">OCR detected: {ocrData.ocrCitizenshipNumber}</p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
              <CustomDatePicker
                name="confirmedDateOfBirth"
                value={confirmedData.confirmedDateOfBirth}
                onChange={(val: string) => handleFieldChange("confirmedDateOfBirth", val)}
              />
              {ocrData?.ocrDateOfBirth ? (
                <p className="mt-1 text-xs text-gray-400">OCR detected: {ocrData.ocrDateOfBirth}</p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <input
                type="text"
                value={confirmedData.confirmedGender}
                onChange={(e) => handleFieldChange("confirmedGender", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              {ocrData?.ocrGender ? (
                <p className="mt-1 text-xs text-gray-400">OCR detected: {ocrData.ocrGender}</p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                value={confirmedData.confirmedAddress}
                onChange={(e) => handleFieldChange("confirmedAddress", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              {ocrData?.ocrAddress ? (
                <p className="mt-1 text-xs text-gray-400">OCR detected: {ocrData.ocrAddress}</p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="text"
                value={confirmedData.confirmedPhoneNumber}
                onChange={(e) => handleFieldChange("confirmedPhoneNumber", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={confirmedData.confirmedEmail}
                onChange={(e) => handleFieldChange("confirmedEmail", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-4">
            <Button variant="ghost" type="button" onClick={() => setStep(3)}>Back</Button>
            <Button
              type="button"
              onClick={handleConfirmSubmit}
              isLoading={isSubmittingConfirmed}
              disabled={isSubmittingConfirmed}
            >
              Confirm & Submit
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default KYCSubmissionForm;