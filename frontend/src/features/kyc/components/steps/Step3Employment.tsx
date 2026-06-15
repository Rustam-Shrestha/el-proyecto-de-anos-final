import { memo, useState, useEffect } from "react";
import { z } from "zod";

const employmentSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  employmentType: z.enum(["Employed", "Self Employed", "Daily Wage", "Freelance"], {
    errorMap: () => ({ message: "Select an employment type" }),
  }),
  employmentStartDate: z.string().min(1, "Start date is required").refine(
    (val) => {
      const d = new Date(val);
      return !isNaN(d.getTime()) && d <= new Date();
    },
    { message: "Start date must be in the past" }
  ),
  declaredAnnualIncome: z
    .number({ invalid_type_error: "Enter a valid number" })
    .min(1, "Income must be at least 1"),
});

export type EmploymentData = z.infer<typeof employmentSchema>;

interface Step3EmploymentProps {
  data: EmploymentData | null;
  onSave: (data: EmploymentData) => void;
  onValidityChange: (valid: boolean) => void;
}

const EMPLOYMENT_TYPES = ["Employed", "Self Employed", "Daily Wage", "Freelance"] as const;

export const Step3Employment = memo(
  ({ data, onSave, onValidityChange }: Step3EmploymentProps) => {
    const [jobTitle, setJobTitle] = useState(data?.jobTitle ?? "");
    const [employmentType, setEmploymentType] = useState(data?.employmentType ?? "");
    const [employmentStartDate, setEmploymentStartDate] = useState(data?.employmentStartDate ?? "");
    const [declaredAnnualIncome, setDeclaredAnnualIncome] = useState(
      data?.declaredAnnualIncome?.toString() ?? ""
    );
    const [errors, setErrors] = useState<Record<string, string | null>>({});

    useEffect(() => {
      const result = employmentSchema.safeParse({
        jobTitle,
        employmentType,
        employmentStartDate,
        declaredAnnualIncome: declaredAnnualIncome ? Number(declaredAnnualIncome) : undefined,
      });

      const fieldErrors: Record<string, string | null> = {};
      if (!result.success) {
        for (const issue of result.error.issues) {
          const path = issue.path[0] as string;
          if (!fieldErrors[path]) {
            fieldErrors[path] = issue.message;
          }
        }
      }

      setErrors(fieldErrors);
      onValidityChange(result.success);

      if (result.success) {
        if (
          result.data.jobTitle !== data?.jobTitle ||
          result.data.employmentType !== data?.employmentType ||
          result.data.employmentStartDate !== data?.employmentStartDate ||
          result.data.declaredAnnualIncome !== data?.declaredAnnualIncome
        ) {
          onSave(result.data);
        }
      }
    }, [jobTitle, employmentType, employmentStartDate, declaredAnnualIncome]);

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-color)" }}>
            Employment Information
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--gray-column-text, #6b7280)" }}>
            Provide your current employment and income details
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              className="mb-1 block text-sm font-medium"
              style={{ color: "var(--text-color)" }}
            >
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Software Engineer, Shop Owner, Farmer"
              className="w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: "var(--surface-color)",
                borderColor: errors.jobTitle ? "var(--red, #ef4444)" : "var(--border-color)",
                color: "var(--text-color)",
              }}
            />
            {errors.jobTitle ? (
              <p className="mt-1 text-sm" style={{ color: "var(--red, #ef4444)" }} role="alert">
                {errors.jobTitle}
              </p>
            ) : null}
          </div>

          <div>
            <label
              className="mb-1 block text-sm font-medium"
              style={{ color: "var(--text-color)" }}
            >
              Employment Type <span className="text-red-500">*</span>
            </label>
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: "var(--surface-color)",
                borderColor: errors.employmentType ? "var(--red, #ef4444)" : "var(--border-color)",
                color: "var(--text-color)",
              }}
            >
              <option value="">Select employment type</option>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {errors.employmentType ? (
              <p className="mt-1 text-sm" style={{ color: "var(--red, #ef4444)" }} role="alert">
                {errors.employmentType}
              </p>
            ) : null}
          </div>

          <div>
            <label
              className="mb-1 block text-sm font-medium"
              style={{ color: "var(--text-color)" }}
            >
              Employment Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={employmentStartDate}
              onChange={(e) => setEmploymentStartDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: "var(--surface-color)",
                borderColor: errors.employmentStartDate
                  ? "var(--red, #ef4444)"
                  : "var(--border-color)",
                color: "var(--text-color)",
              }}
            />
            {errors.employmentStartDate ? (
              <p className="mt-1 text-sm" style={{ color: "var(--red, #ef4444)" }} role="alert">
                {errors.employmentStartDate}
              </p>
            ) : null}
          </div>

          <div>
            <label
              className="mb-1 block text-sm font-medium"
              style={{ color: "var(--text-color)" }}
            >
              Declared Annual Income (USD) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={declaredAnnualIncome}
              onChange={(e) => setDeclaredAnnualIncome(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: "var(--surface-color)",
                borderColor: errors.declaredAnnualIncome
                  ? "var(--red, #ef4444)"
                  : "var(--border-color)",
                color: "var(--text-color)",
              }}
            />
            {errors.declaredAnnualIncome ? (
              <p className="mt-1 text-sm" style={{ color: "var(--red, #ef4444)" }} role="alert">
                {errors.declaredAnnualIncome}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
);

Step3Employment.displayName = "Step3Employment";

export default Step3Employment;
