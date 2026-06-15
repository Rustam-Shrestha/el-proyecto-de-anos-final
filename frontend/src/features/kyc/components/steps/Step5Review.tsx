import { memo, type ReactNode } from "react";
import type { EmploymentData } from "./Step3Employment";

interface UploadedDoc {
  documentId: string;
  kycApplicationId: string;
}

interface Step5ReviewProps {
  citizenshipFront: File | null;
  citizenshipBack: File | null;
  selfie: File | null;
  employmentData: EmploymentData | null;
  incomeProofs: File[];
  bankStatement: File | null;
  existingLoan: File | null;
  collateral: File | null;
  frontUploaded: UploadedDoc | null;
  backUploaded: UploadedDoc | null;
  selfieUploaded: UploadedDoc | null;
  isSubmitting: boolean;
  onSubmit: () => void;
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-4 py-2">
    <span className="text-sm font-medium" style={{ color: "var(--text-color)" }}>
      {label}
    </span>
    <span className="text-sm text-right" style={{ color: "var(--gray-column-text, #6b7280)" }}>
      {value}
    </span>
  </div>
);

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <div>
    <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
      {title}
    </h4>
    <div
      className="divide-y rounded-xl border px-4"
      style={{
        backgroundColor: "var(--surface-color)",
        borderColor: "var(--border-color)",
        divideColor: "var(--border-color)",
      }}
    >
      {children}
    </div>
  </div>
);

const formatFile = (file: File | null, uploaded: UploadedDoc | null) => {
  if (!file) return <span className="text-red-500">Not provided</span>;
  const status = uploaded ? (
    <span className="text-green-600 dark:text-green-400">Uploaded</span>
  ) : (
    <span className="text-amber-600 dark:text-amber-400">Ready to upload</span>
  );
  return (
    <span>
      {file.name} ({formatSize(file.size)}) &mdash; {status}
    </span>
  );
};

export const Step5Review = memo(
  ({
    citizenshipFront,
    citizenshipBack,
    selfie,
    employmentData,
    incomeProofs,
    bankStatement,
    existingLoan,
    collateral,
    frontUploaded,
    backUploaded,
    selfieUploaded,
    isSubmitting,
    onSubmit,
  }: Step5ReviewProps) => {
    const allUploaded = Boolean(frontUploaded && backUploaded && selfieUploaded);

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-color)" }}>
            Review & Submit
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--gray-column-text, #6b7280)" }}>
            Please review your information before submitting
          </p>
        </div>

        <Section title="Identity Documents">
          <Row label="Citizenship — Front" value={formatFile(citizenshipFront, frontUploaded)} />
          <Row label="Citizenship — Back" value={formatFile(citizenshipBack, backUploaded)} />
          <Row label="Selfie" value={formatFile(selfie, selfieUploaded)} />
        </Section>

        {employmentData ? (
          <Section title="Employment">
            <Row label="Job Title" value={employmentData.jobTitle} />
            <Row label="Employment Type" value={employmentData.employmentType} />
            <Row label="Start Date" value={employmentData.employmentStartDate} />
            <Row
              label="Annual Income"
              value={`$${employmentData.declaredAnnualIncome.toLocaleString()}`}
            />
          </Section>
        ) : null}

        {(incomeProofs.length > 0 ||
          bankStatement ||
          existingLoan ||
          collateral) ? (
          <Section title="Financial Documents">
            {incomeProofs.length > 0
              ? incomeProofs.map((f, i) => (
                  <Row key={i} label={`Income Proof ${i + 1}`} value={`${f.name} (${formatSize(f.size)})`} />
                ))
              : null}
            {bankStatement ? (
              <Row label="Bank Statement" value={`${bankStatement.name} (${formatSize(bankStatement.size)})`} />
            ) : null}
            {existingLoan ? (
              <Row label="Existing Loan" value={`${existingLoan.name} (${formatSize(existingLoan.size)})`} />
            ) : null}
            {collateral ? (
              <Row label="Collateral" value={`${collateral.name} (${formatSize(collateral.size)})`} />
            ) : null}
          </Section>
        ) : null}

        <div
          className="rounded-xl border p-4"
          style={{
            backgroundColor: "var(--surface-muted, #f9fafb)",
            borderColor: "var(--border-color)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--text-color)" }}>
            By submitting, you confirm that all the information and documents provided are accurate
            and genuine. False submissions may result in permanent account restriction.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSubmit}
            disabled={!allUploaded || isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </div>
    );
  }
);

Step5Review.displayName = "Step5Review";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default Step5Review;
