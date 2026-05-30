import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@components/Button";
import Input from "@components/Input";
import { SkeletonLoader } from "@shared/components/SkeletonLoader";
import { useToast } from "@hooks/useToast";
import { apiClient } from "@shared/lib/apiClient";
import { useSubmitKYCMutation } from "@features/kyc/api/kycApi";

type CurrentUser = {
  id?: string;
  email?: string;
  name?: string;
  phone?: string;
  address?: string;
};

type FileField = "selfie" | "idProof" | "addressProof";

const ACCEPTED_TYPES = ["image/jpeg", "image/png"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const readableSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
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
  const [files, setFiles] = useState<Record<FileField, File | null>>({
    selfie: null,
    idProof: null,
    addressProof: null,
  });
  const [errors, setErrors] = useState<Record<FileField, string | null>>({
    selfie: null,
    idProof: null,
    addressProof: null,
  });
  const [previews, setPreviews] = useState<Record<FileField, string>>({
    selfie: "",
    idProof: "",
    addressProof: "",
  });

  const authQuery = useQuery({
    queryKey: ["auth", "me", "kyc-submit"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data?: CurrentUser }>("/auth/me");
      return data.data ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (authQuery.data) {
      setCurrentUser(authQuery.data);
    }
  }, [authQuery.data]);

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((preview) => {
        if (preview) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [previews]);

  const validateFile = (field: FileField, file: File | null) => {
    if (!file) {
      setErrors((current) => ({ ...current, [field]: "Please choose a file" }));
      return false;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrors((current) => ({ ...current, [field]: "Only JPG and PNG files are allowed" }));
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrors((current) => ({ ...current, [field]: "File must be 5MB or smaller" }));
      return false;
    }

    setErrors((current) => ({ ...current, [field]: null }));
    return true;
  };

  const handleFileChange = (field: FileField, file: File | null) => {
    const isValid = validateFile(field, file);

    if (!isValid || !file) {
      setFiles((current) => ({ ...current, [field]: null }));
      setPreviews((current) => ({ ...current, [field]: "" }));
      return;
    }

    setFiles((current) => ({ ...current, [field]: file }));
    setPreviews((current) => {
      const nextPreview = URL.createObjectURL(file);
      if (current[field]) {
        URL.revokeObjectURL(current[field]);
      }
      return { ...current, [field]: nextPreview };
    });
  };

  const canContinueFromStep2 = Boolean(files.selfie && files.idProof && files.addressProof);

  const handleSubmit = async () => {
    if (!canContinueFromStep2) {
      toast.error("Please upload all documents first");
      return;
    }

    const formData = new FormData();
    formData.append("selfie", files.selfie as File);
    formData.append("idProof", files.idProof as File);
    formData.append("addressProof", files.addressProof as File);

    try {
      await submitMutation.mutateAsync(formData);
      toast.success("Application submitted");
      onSubmitted?.();
      navigate("/dashboard/kyc-status", { replace: true });
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || "Upload error. Please retry.");
    }
  };

  if (authQuery.isLoading) {
    return <SkeletonLoader count={3} type="list" />;
  }

  return (
    <div className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--green-icon)]">KYC Submission</p>
        <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">Submit your KYC application</h2>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className={step >= 1 ? "font-semibold text-gray-900 dark:text-gray-100" : "text-gray-500"}>1. Personal</span>
        <span className="text-gray-400">-</span>
        <span className={step >= 2 ? "font-semibold text-gray-900 dark:text-gray-100" : "text-gray-500"}>2. Upload</span>
        <span className="text-gray-400">-</span>
        <span className={step >= 3 ? "font-semibold text-gray-900 dark:text-gray-100" : "text-gray-500"}>3. Review</span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
        <div
          className="h-full rounded-full bg-[var(--green-icon)] transition-all"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <Input label="Full Name" value={currentUser?.name ?? ""} readOnly />
          <Input label="Email" value={currentUser?.email ?? ""} readOnly />
          <Input label="Phone" value={currentUser?.phone ?? ""} readOnly />
          <Input label="Address" value={currentUser?.address ?? ""} readOnly />
          <div className="flex justify-end">
            <Button type="button" onClick={() => setStep(2)}>
              Next
            </Button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-5">
          {(["selfie", "idProof", "addressProof"] as FileField[]).map((field) => (
            <div key={field} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                {field === "selfie" ? "Selfie" : field === "idProof" ? "ID Proof" : "Address Proof"}
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={(event) => handleFileChange(field, event.target.files?.item(0) ?? null)}
                className="block w-full text-sm"
              />
              {errors[field] ? <p className="text-sm text-red-500">{errors[field]}</p> : null}
              {previews[field] ? (
                <div className="space-y-2">
                  <img src={previews[field]} alt={`${field} preview`} className="h-40 rounded-2xl object-cover" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {files[field]?.name} • {files[field] ? readableSize(files[field].size) : ""}
                  </p>
                </div>
              ) : null}
            </div>
          ))}

          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" type="button" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="button" onClick={() => setStep(3)} disabled={!canContinueFromStep2}>
              Review
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-5">
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <p>Selfie: {files.selfie?.name ?? "Not selected"}</p>
            <p>ID Proof: {files.idProof?.name ?? "Not selected"}</p>
            <p>Address Proof: {files.addressProof?.name ?? "Not selected"}</p>
          </div>

          {submitMutation.isPending ? (
            <div className="space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-[var(--green-icon)] transition-all"
                  style={{ width: `${submitMutation.uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Uploading application... {Math.round(submitMutation.uploadProgress)}%</p>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" type="button" onClick={() => setStep(2)}>
              Back
            </Button>
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
    </div>
  );
};

export default KYCSubmissionForm;