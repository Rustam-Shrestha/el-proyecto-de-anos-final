import { memo, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetMyEmployment,
  useSaveEmploymentMutation,
  useGetPortfolioDocuments,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
  useGetVerificationStatus,
} from "@features/loans/api/portfolioApi";
import { Button } from "@shared/components/Button";
import { FileUploadField } from "@shared/components/FileUploadField";
import InputField from "@components/common/InputField";
import CustomDatePicker from "@components/common/CutomDatePicker";
import CustomSelectField from "@components/common/SelectField";
import { CheckMarkIcon } from "@assets/data/icons";
import { DocumentType } from "@shared/types/common";
import { useToast } from "@shared/hooks/useToast";
import { SkeletonLoader } from "@shared/components/SkeletonLoader";

type IncomeType = "EMPLOYED" | "SELF_EMPLOYED" | "STUDENT" | "UNEMPLOYED" | "RETIRED";

const INCOME_TYPES: { value: IncomeType; label: string; description: string }[] = [
  { value: "EMPLOYED", label: "Salaried Employee", description: "I work for an employer and receive regular salary" },
  { value: "SELF_EMPLOYED", label: "Self-Employed / Business", description: "I own a business or work independently" },
  { value: "STUDENT", label: "Student", description: "I am currently studying with no or minimal income" },
  { value: "UNEMPLOYED", label: "Unemployed", description: "I am currently not employed" },
  { value: "RETIRED", label: "Retired", description: "I am retired and may have pension income" },
];

const EMPLOYMENT_STATUS_OPTIONS = [
  "EMPLOYED", "SELF_EMPLOYED", "BUSINESS", "STUDENT", "UNEMPLOYED", "RETIRED", "OTHER",
];

const BUSINESS_TYPE_OPTIONS = [
  "Retail", "Service", "Manufacturing", "Technology", "Agriculture", "Construction", "Transportation", "Freelance", "Other",
];

const EDUCATION_LEVEL_OPTIONS = [
  "HighSchool", "Bachelor", "Master", "PhD", "Diploma",
];

const INCOME_SOURCE_OPTIONS = [
  { value: "SALARY", label: "Salary" },
  { value: "BUSINESS", label: "Business" },
  { value: "PENSION", label: "Pension" },
  { value: "STIPEND", label: "Stipend" },
  { value: "OTHER", label: "Other" },
];

interface FormData {
  employmentStatus: IncomeType;
  occupationJobTitle: string;
  employerName: string;
  employmentStartDate: string;
  monthlyGrossIncome: string;
  annualIncome: string;
  dependentsCount: string;
  incomeSourceType: string;
  businessName: string;
  businessType: string;
  institutionName: string;
  educationLevel: string;
  expectedGraduationDate: string;
}

type Step = "income-type" | "details" | "documents" | "review";

interface DocEntry {
  id: string;
  documentType: string;
  verificationStatus: string;
  originalName: string | null;
}

const PortfolioPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: employment, isLoading: empLoading } = useGetMyEmployment();
  const { data: documents, isLoading: docsLoading } = useGetPortfolioDocuments();
  const { data: verificationStatus } = useGetVerificationStatus();
  const saveMutation = useSaveEmploymentMutation();
  const uploadMutation = useUploadDocumentMutation();
  const deleteMutation = useDeleteDocumentMutation();

  const [step, setStep] = useState<Step>("income-type");
  const [formData, setFormData] = useState<FormData>({
    employmentStatus: "EMPLOYED",
    occupationJobTitle: "",
    employerName: "",
    employmentStartDate: "",
    monthlyGrossIncome: "",
    annualIncome: "",
    dependentsCount: "0",
    incomeSourceType: "SALARY",
    businessName: "",
    businessType: "",
    institutionName: "",
    educationLevel: "",
    expectedGraduationDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const docList: DocEntry[] = documents || [];

  useEffect(() => {
    if (employment) {
      setFormData({
        employmentStatus: (employment.employmentStatus as IncomeType) || "EMPLOYED",
        occupationJobTitle: employment.occupationJobTitle ?? "",
        employerName: employment.employerName ?? "",
        employmentStartDate: employment.employmentStartDate
          ? employment.employmentStartDate.split("T")[0]
          : "",
        monthlyGrossIncome: employment.monthlyGrossIncome?.toString() ?? "",
        annualIncome: employment.annualIncome?.toString() ?? "",
        dependentsCount: employment.dependentsCount?.toString() ?? "0",
        incomeSourceType: employment.incomeSourceType ?? "SALARY",
        businessName: employment.businessName ?? "",
        businessType: employment.businessType ?? "",
        institutionName: employment.institutionName ?? "",
        educationLevel: employment.educationLevel ?? "",
        expectedGraduationDate: employment.expectedGraduationDate
          ? employment.expectedGraduationDate.split("T")[0]
          : "",
      });
      if (employment.employmentStatus) {
        setStep("details");
      }
    }
  }, [employment]);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const handleDateChange = (key: keyof FormData) => (e: { target: { name: string; value: string } }) => {
    updateField(key, e.target.value as FormData[typeof key]);
  };

  const handleSelectChange = (key: keyof FormData) => (e: { target: { name: string; value: string } }) => {
    updateField(key, e.target.value as FormData[typeof key]);
  };

  const handleIncomeTypeSelect = (type: IncomeType) => {
    updateField("employmentStatus", type);
    const sourceMap: Record<IncomeType, string> = {
      EMPLOYED: "SALARY",
      SELF_EMPLOYED: "BUSINESS",
      STUDENT: "STIPEND",
      UNEMPLOYED: "OTHER",
      RETIRED: "PENSION",
    };
    updateField("incomeSourceType", sourceMap[type]);
    setStep("details");
  };

  const validateStep1 = (): boolean => {
    const fieldErrors: Record<string, string> = {};
    const { employmentStatus } = formData;

    if (employmentStatus === "EMPLOYED") {
      if (!formData.occupationJobTitle.trim()) fieldErrors.occupationJobTitle = "Job title is required";
      if (!formData.employerName.trim()) fieldErrors.employerName = "Employer name is required";
      if (!formData.employmentStartDate) fieldErrors.employmentStartDate = "Start date is required";
      if (!formData.monthlyGrossIncome || Number(formData.monthlyGrossIncome) <= 0)
        fieldErrors.monthlyGrossIncome = "Monthly salary is required";
    } else if (employmentStatus === "SELF_EMPLOYED") {
      if (!formData.businessName.trim()) fieldErrors.businessName = "Business name is required";
      if (!formData.businessType.trim()) fieldErrors.businessType = "Business type is required";
      if (!formData.monthlyGrossIncome || Number(formData.monthlyGrossIncome) <= 0)
        fieldErrors.monthlyGrossIncome = "Monthly income is required";
    } else if (employmentStatus === "STUDENT") {
      if (!formData.institutionName.trim()) fieldErrors.institutionName = "Institution name is required";
      if (!formData.educationLevel.trim()) fieldErrors.educationLevel = "Education level is required";
    }

    setErrors(fieldErrors);
    return Object.keys(fieldErrors).length === 0;
  };

  const handleSaveDetails = async () => {
    if (!validateStep1()) return;

    try {
      const payload: Record<string, unknown> = {
        employmentStatus: formData.employmentStatus,
        dependentsCount: Number(formData.dependentsCount) || 0,
        incomeSourceType: formData.incomeSourceType,
      };

      if (formData.employmentStatus === "EMPLOYED") {
        payload.occupationJobTitle = formData.occupationJobTitle.trim();
        payload.employerName = formData.employerName.trim();
        payload.employmentStartDate = formData.employmentStartDate;
        payload.monthlyGrossIncome = Number(formData.monthlyGrossIncome);
      } else if (formData.employmentStatus === "SELF_EMPLOYED") {
        payload.businessName = formData.businessName.trim();
        payload.businessType = formData.businessType.trim();
        payload.employmentStartDate = formData.employmentStartDate || undefined;
        payload.monthlyGrossIncome = Number(formData.monthlyGrossIncome);
      } else if (formData.employmentStatus === "STUDENT") {
        payload.institutionName = formData.institutionName.trim();
        payload.educationLevel = formData.educationLevel.trim();
        payload.expectedGraduationDate = formData.expectedGraduationDate || undefined;
        payload.monthlyGrossIncome = Number(formData.monthlyGrossIncome) || 0;
      } else if (formData.employmentStatus === "RETIRED") {
        payload.monthlyGrossIncome = Number(formData.monthlyGrossIncome) || 0;
      }

      await saveMutation.mutateAsync(payload as Parameters<typeof saveMutation.mutateAsync>[0]);
      toast.success("Employment information saved");

      const needsDocs = formData.employmentStatus === "EMPLOYED" || formData.employmentStatus === "SELF_EMPLOYED";
      setStep(needsDocs ? "documents" : "review");
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || "Failed to save employment information");
    }
  };

  const handleFileUpload = useCallback(
    async (_docType: string, file: File) => {
      try {
        await uploadMutation.mutateAsync({ documentType: _docType, file });
        toast.success(`${_docType.replace(/_/g, " ")} uploaded`);
      } catch (error) {
        const apiError = error as { response?: { data?: { message?: string } } };
        toast.error(apiError.response?.data?.message || "Upload failed");
      }
    },
    [uploadMutation, toast]
  );

  const handleDeleteDocument = useCallback(
    async (documentId: string) => {
      try {
        await deleteMutation.mutateAsync(documentId);
        toast.success("Document removed");
      } catch (error) {
        toast.error("Failed to delete document");
      }
    },
    [deleteMutation, toast]
  );

  const mapDocType = (dt: string): DocumentType => {
    const known = Object.values(DocumentType);
    return known.includes(dt as DocumentType) ? (dt as DocumentType) : DocumentType.OTHER;
  };

  const getDocForType = (docType: string): DocEntry | undefined =>
    docList.find((d) => d.documentType === docType);

  const getDocFile = (docType: string): File | null => {
    const doc = getDocForType(docType);
    return doc ? (null as unknown as File) : null;
  };

  const isLoading = empLoading || docsLoading;
  const isComplete = verificationStatus?.isComplete;
  const currentStatus = verificationStatus?.verificationStatus;

  if (isLoading) {
    return <SkeletonLoader count={3} type="list" />;
  }

  const renderStepIndicator = () => {
    const steps: Step[] = ["income-type", "details", "documents", "review"];
    const labels: Record<Step, string> = {
      "income-type": "Income Type", details: "Details", documents: "Documents", review: "Review",
    };
    const idx = steps.indexOf(step);

    return (
      <div className="flex items-center justify-between">
        {steps.map((s, i) => {
          const isActive = s === step;
          const isDone = i < idx;
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  isDone
                    ? "bg-green-500 text-white"
                    : isActive
                      ? "border-2 border-[var(--green-icon)] bg-green-50 text-[var(--green-icon)]"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {isDone ? <CheckMarkIcon /> : i + 1}
              </div>
              <span
                className={`text-sm ${
                  isActive ? "font-medium text-[var(--green-icon)]" : isDone ? "text-green-600" : "text-gray-500"
                }`}
              >
                {labels[s]}
              </span>
              {i < 3 ? <div className="mx-2 h-px w-8 bg-gray-300" /> : null}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--green-icon)]">
          Financial Portfolio
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900">
          {isComplete ? "Portfolio Verified" : "Complete Your Financial Profile"}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {isComplete
            ? "Your financial profile is verified. You can now apply for loans."
            : currentStatus === "REJECTED"
              ? "Your portfolio was rejected. Please review the feedback and resubmit."
              : currentStatus === "PENDING_REVIEW"
                ? "Your portfolio is under review by an admin."
                : "Provide your employment details and upload supporting documents."}
        </p>
        {currentStatus && !isComplete ? (
          <div className="mt-3">
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                currentStatus === "REJECTED"
                  ? "bg-red-100 text-red-800"
                  : currentStatus === "PENDING_REVIEW"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-blue-100 text-blue-800"
              }`}
            >
              {currentStatus.replace(/_/g, " ")}
            </span>
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        {renderStepIndicator()}
      </div>

      {step === "income-type" ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Select Your Income Type</h2>
          <p className="mt-1 text-sm text-gray-500">
            Choose the option that best describes your current financial situation.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {INCOME_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleIncomeTypeSelect(type.value)}
                className={`rounded-xl border-2 p-4 text-left transition-all hover:border-[var(--green-icon)] hover:bg-green-50 ${
                  formData.employmentStatus === type.value
                    ? "border-[var(--green-icon)] bg-green-50"
                    : "border-gray-200"
                }`}
              >
                <p className="font-medium text-gray-900">{type.label}</p>
                <p className="mt-1 text-xs text-gray-500">{type.description}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === "details" ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            {formData.employmentStatus === "EMPLOYED"
              ? "Employment Details"
              : formData.employmentStatus === "SELF_EMPLOYED"
                ? "Business Details"
                : formData.employmentStatus === "STUDENT"
                  ? "Education Details"
                  : formData.employmentStatus === "RETIRED"
                    ? "Retirement Details"
                    : "Current Status"}
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {formData.employmentStatus === "EMPLOYED" ? (
              <>
                <InputField
                  label="Job Title *"
                  placeholder="e.g. Software Engineer, Teacher"
                  value={formData.occupationJobTitle}
                  onChange={(e) => updateField("occupationJobTitle", e.target.value)}
                  error={errors.occupationJobTitle}
                />
                <InputField
                  label="Employer Name *"
                  placeholder="e.g. ABC Company"
                  value={formData.employerName}
                  onChange={(e) => updateField("employerName", e.target.value)}
                  error={errors.employerName}
                />
                <div>
                  <CustomDatePicker
                    label="Employment Start Date *"
                    name="employmentStartDate"
                    value={formData.employmentStartDate}
                    isForm
                    onChange={handleDateChange("employmentStartDate")}
                  />
                  {errors.employmentStartDate ? (
                    <p className="mt-1 text-xs text-red-600">{errors.employmentStartDate}</p>
                  ) : null}
                </div>
                <InputField
                  label="Monthly Gross Salary (NPR) *"
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 50000"
                  value={formData.monthlyGrossIncome}
                  onChange={(e) => updateField("monthlyGrossIncome", e.target.value.replace(/[^0-9]/g, ""))}
                  error={errors.monthlyGrossIncome}
                />
              </>
            ) : null}

            {formData.employmentStatus === "SELF_EMPLOYED" ? (
              <>
                <InputField
                  label="Business Name *"
                  placeholder="e.g. My Store"
                  value={formData.businessName}
                  onChange={(e) => updateField("businessName", e.target.value)}
                  error={errors.businessName}
                />
                <CustomSelectField
                  label="Business Type *"
                  placeholder="Select business type"
                  value={formData.businessType}
                  onChange={handleSelectChange("businessType")}
                  options={BUSINESS_TYPE_OPTIONS}
                  error={errors.businessType}
                />
                <div>
                  <CustomDatePicker
                    label="Business Start Date"
                    name="employmentStartDate"
                    value={formData.employmentStartDate}
                    isForm
                    onChange={handleDateChange("employmentStartDate")}
                  />
                </div>
                <InputField
                  label="Monthly Income (NPR) *"
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 80000"
                  value={formData.monthlyGrossIncome}
                  onChange={(e) => updateField("monthlyGrossIncome", e.target.value.replace(/[^0-9]/g, ""))}
                  error={errors.monthlyGrossIncome}
                />
              </>
            ) : null}

            {formData.employmentStatus === "STUDENT" ? (
              <>
                <InputField
                  label="Institution Name *"
                  placeholder="e.g. Tribhuvan University"
                  value={formData.institutionName}
                  onChange={(e) => updateField("institutionName", e.target.value)}
                  error={errors.institutionName}
                />
                <CustomSelectField
                  label="Education Level *"
                  placeholder="Select education level"
                  value={formData.educationLevel}
                  onChange={handleSelectChange("educationLevel")}
                  options={EDUCATION_LEVEL_OPTIONS}
                  error={errors.educationLevel}
                />
                <div>
                  <CustomDatePicker
                    label="Expected Graduation Date"
                    name="expectedGraduationDate"
                    value={formData.expectedGraduationDate}
                    isForm
                    onChange={handleDateChange("expectedGraduationDate")}
                  />
                </div>
                <InputField
                  label="Monthly Stipend (if any)"
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 5000"
                  value={formData.monthlyGrossIncome}
                  onChange={(e) => updateField("monthlyGrossIncome", e.target.value.replace(/[^0-9]/g, ""))}
                />
              </>
            ) : null}

            {formData.employmentStatus === "UNEMPLOYED" || formData.employmentStatus === "RETIRED" ? (
              <>
                {formData.employmentStatus === "RETIRED" ? (
                  <InputField
                    label="Monthly Pension (if any)"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 25000"
                    value={formData.monthlyGrossIncome}
                    onChange={(e) => updateField("monthlyGrossIncome", e.target.value.replace(/[^0-9]/g, ""))}
                  />
                ) : (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">
                      No income details needed. Your portfolio will be noted as unemployed.
                    </p>
                  </div>
                )}
              </>
            ) : null}

            <InputField
              label="Number of Dependents"
              type="number"
              min={0}
              max={20}
              value={formData.dependentsCount}
              onChange={(e) => updateField("dependentsCount", e.target.value)}
            />
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-5">
            <Button variant="ghost" type="button" onClick={() => setStep("income-type")}>
              Back
            </Button>
            <Button type="button" onClick={handleSaveDetails} isLoading={saveMutation.isPending}>
              {employment ? "Update & Continue" : "Save & Continue"}
            </Button>
          </div>
        </div>
      ) : null}

      {step === "documents" ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Upload Supporting Documents</h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload the required documents to verify your income. Accepted formats: JPEG, PNG, PDF (max 10MB each).
          </p>

          <div className="mt-6 space-y-6">
            {formData.employmentStatus === "EMPLOYED" ? (
              <>
                <FileUploadField
                  label="Latest Salary Slip"
                  documentType={DocumentType.SALARY_SLIP}
                  accept="image/jpeg,image/png,application/pdf"
                  maxSizeMB={10}
                  onFileSelect={(file) => handleFileUpload("SALARY_SLIP", file)}
                  onClear={() => {
                    const doc = getDocForType("SALARY_SLIP");
                    if (doc) handleDeleteDocument(doc.id);
                  }}
                  currentFile={getDocFile("SALARY_SLIP")}
                  isUploading={uploadMutation.isPending}
                  isRequired
                />
                <FileUploadField
                  label="Bank Statement (Last 3 Months)"
                  documentType={DocumentType.BANK_STATEMENT}
                  accept="image/jpeg,image/png,application/pdf"
                  maxSizeMB={10}
                  onFileSelect={(file) => handleFileUpload("BANK_STATEMENT", file)}
                  onClear={() => {
                    const doc = getDocForType("BANK_STATEMENT");
                    if (doc) handleDeleteDocument(doc.id);
                  }}
                  currentFile={getDocFile("BANK_STATEMENT")}
                  isUploading={uploadMutation.isPending}
                  isRequired
                />
                <FileUploadField
                  label="Employment Letter (Optional)"
                  documentType={DocumentType.INCOME_CERT}
                  accept="image/jpeg,image/png,application/pdf"
                  maxSizeMB={10}
                  onFileSelect={(file) => handleFileUpload("INCOME_CERT", file)}
                  onClear={() => {
                    const doc = getDocForType("INCOME_CERT");
                    if (doc) handleDeleteDocument(doc.id);
                  }}
                  currentFile={getDocFile("INCOME_CERT")}
                  isUploading={uploadMutation.isPending}
                />
              </>
            ) : null}

            {formData.employmentStatus === "SELF_EMPLOYED" ? (
              <>
                <FileUploadField
                  label="Business Registration Certificate"
                  documentType={DocumentType.BUSINESS_REG}
                  accept="image/jpeg,image/png,application/pdf"
                  maxSizeMB={10}
                  onFileSelect={(file) => handleFileUpload("BUSINESS_REG", file)}
                  onClear={() => {
                    const doc = getDocForType("BUSINESS_REG");
                    if (doc) handleDeleteDocument(doc.id);
                  }}
                  currentFile={getDocFile("BUSINESS_REG")}
                  isUploading={uploadMutation.isPending}
                />
                <FileUploadField
                  label="Bank Statement (Last 6 Months)"
                  documentType={DocumentType.BANK_STATEMENT}
                  accept="image/jpeg,image/png,application/pdf"
                  maxSizeMB={10}
                  onFileSelect={(file) => handleFileUpload("BANK_STATEMENT", file)}
                  onClear={() => {
                    const doc = getDocForType("BANK_STATEMENT");
                    if (doc) handleDeleteDocument(doc.id);
                  }}
                  currentFile={getDocFile("BANK_STATEMENT")}
                  isUploading={uploadMutation.isPending}
                />
                <FileUploadField
                  label="Income Certificate (Optional)"
                  documentType={DocumentType.INCOME_CERT}
                  accept="image/jpeg,image/png,application/pdf"
                  maxSizeMB={10}
                  onFileSelect={(file) => handleFileUpload("INCOME_CERT", file)}
                  onClear={() => {
                    const doc = getDocForType("INCOME_CERT");
                    if (doc) handleDeleteDocument(doc.id);
                  }}
                  currentFile={getDocFile("INCOME_CERT")}
                  isUploading={uploadMutation.isPending}
                />
                <FileUploadField
                  label="PAN Certificate (Optional)"
                  documentType={DocumentType.PAN}
                  accept="image/jpeg,image/png,application/pdf"
                  maxSizeMB={10}
                  onFileSelect={(file) => handleFileUpload("PAN", file)}
                  onClear={() => {
                    const doc = getDocForType("PAN");
                    if (doc) handleDeleteDocument(doc.id);
                  }}
                  currentFile={getDocFile("PAN")}
                  isUploading={uploadMutation.isPending}
                />
              </>
            ) : null}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-5">
            <Button variant="ghost" type="button" onClick={() => setStep("details")}>
              Back
            </Button>
            <Button type="button" onClick={() => setStep("review")}>
              Continue to Review
            </Button>
          </div>
        </div>
      ) : null}

      {step === "review" ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Review Your Portfolio</h2>
          <p className="mt-1 text-sm text-gray-500">
            Review your information before submitting for verification.
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Employment Status</p>
              <p className="mt-1 font-medium text-gray-900">{formData.employmentStatus.replace(/_/g, " ")}</p>
            </div>

            {formData.employmentStatus === "EMPLOYED" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <ReviewField label="Job Title" value={formData.occupationJobTitle} />
                <ReviewField label="Employer" value={formData.employerName} />
                <ReviewField label="Start Date" value={formData.employmentStartDate} />
                <ReviewField label="Monthly Salary" value={`NPR ${Number(formData.monthlyGrossIncome).toLocaleString()}`} />
              </div>
            ) : null}

            {formData.employmentStatus === "SELF_EMPLOYED" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <ReviewField label="Business Name" value={formData.businessName} />
                <ReviewField label="Business Type" value={formData.businessType} />
                <ReviewField label="Monthly Income" value={`NPR ${Number(formData.monthlyGrossIncome).toLocaleString()}`} />
              </div>
            ) : null}

            {formData.employmentStatus === "STUDENT" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <ReviewField label="Institution" value={formData.institutionName} />
                <ReviewField label="Education Level" value={formData.educationLevel} />
                {formData.expectedGraduationDate ? (
                  <ReviewField label="Expected Graduation" value={formData.expectedGraduationDate} />
                ) : null}
              </div>
            ) : null}

            <ReviewField label="Dependents" value={formData.dependentsCount} />

            {docList.length > 0 ? (
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Uploaded Documents ({docList.length})
                </p>
                <ul className="mt-2 space-y-1">
                  {docList.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between text-sm">
                      <span>{doc.documentType.replace(/_/g, " ")}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          doc.verificationStatus === "VERIFIED"
                            ? "bg-green-100 text-green-700"
                            : doc.verificationStatus === "REJECTED"
                              ? "bg-red-100 text-red-700"
                              : doc.verificationStatus === "FLAGGED"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {doc.verificationStatus}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-5">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                const needsDocs = formData.employmentStatus === "EMPLOYED" || formData.employmentStatus === "SELF_EMPLOYED";
                setStep(needsDocs ? "documents" : "details");
              }}
            >
              Back
            </Button>
            <div className="flex items-center gap-3">
              {!isComplete ? (
                <p className="text-xs text-gray-400">Your portfolio will be submitted for admin verification</p>
              ) : null}
              <Button type="button" onClick={() => navigate("/dashboard")}>
                {isComplete ? "Go to Dashboard" : "Submit for Review"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

const ReviewField = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-gray-200 p-4">
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
    <p className="mt-1 font-medium text-gray-900">{value || "Not provided"}</p>
  </div>
);

PortfolioPage.displayName = "PortfolioPage";
export default memo(PortfolioPage);
