import { memo, useState, useEffect } from "react";
import { z } from "zod";
import InputField from "@components/common/InputField";
import CustomSelectField from "@components/common/SelectField";

const employmentSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  employmentType: z.enum(["Employed", "Self Employed", "Daily Wage", "Freelance"], { errorMap: () => ({ message: "Select an employment type" }) }),
  employmentStartDate: z.string().min(1, "Start date is required").refine((val) => { const d = new Date(val); return !isNaN(d.getTime()) && d <= new Date(); }, { message: "Start date must be in the past" }),
  declaredAnnualIncome: z.number({ invalid_type_error: "Enter a valid number" }).min(1, "Income must be at least 1"),
});
export type EmploymentData = z.infer<typeof employmentSchema>;
interface Step3EmploymentProps { data: EmploymentData | null; onSave: (data: EmploymentData) => void; onValidityChange: (valid: boolean) => void; }
const EMPLOYMENT_TYPES = ["Employed", "Self Employed", "Daily Wage", "Freelance"] as const;

export const Step3Employment = memo(({ data, onSave, onValidityChange }: Step3EmploymentProps) => {
  const [jobTitle, setJobTitle] = useState(data?.jobTitle ?? "");
  const [employmentType, setEmploymentType] = useState(data?.employmentType ?? "");
  const [employmentStartDate, setEmploymentStartDate] = useState(data?.employmentStartDate ?? "");
  const [declaredAnnualIncome, setDeclaredAnnualIncome] = useState(data?.declaredAnnualIncome?.toString() ?? "");
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  useEffect(() => {
    const result = employmentSchema.safeParse({ jobTitle, employmentType, employmentStartDate, declaredAnnualIncome: declaredAnnualIncome ? Number(declaredAnnualIncome) : undefined });
    const fieldErrors: Record<string, string | null> = {};
    if (!result.success) for (const issue of result.error.issues) { const path = issue.path[0] as string; if (!fieldErrors[path]) fieldErrors[path] = issue.message; }
    setErrors(fieldErrors); onValidityChange(result.success);
    if (result.success) { if (result.data.jobTitle !== data?.jobTitle || result.data.employmentType !== data?.employmentType || result.data.employmentStartDate !== data?.employmentStartDate || result.data.declaredAnnualIncome !== data?.declaredAnnualIncome) onSave(result.data); }
  }, [jobTitle, employmentType, employmentStartDate, declaredAnnualIncome]);
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#0F172A]">Employment Information</h3>
        <p className="mt-1 text-sm text-[#64748B]">Provide your current employment and income details</p>
      </div>
      <div className="space-y-4">
        <InputField label="Job Title *" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Software Engineer, Shop Owner, Farmer" error={errors.jobTitle ?? undefined} />
        <CustomSelectField label="Employment Type *" value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} options={EMPLOYMENT_TYPES.map((t) => ({ value: t, label: t }))} placeholder="Select employment type" error={errors.employmentType ?? undefined} />
        <InputField label="Employment Start Date *" type="date" value={employmentStartDate} onChange={(e) => setEmploymentStartDate(e.target.value)} error={errors.employmentStartDate ?? undefined} />
        <InputField label="Declared Annual Income (USD) *" type="number" value={declaredAnnualIncome} onChange={(e) => setDeclaredAnnualIncome(e.target.value)} placeholder="e.g. 50000" error={errors.declaredAnnualIncome ?? undefined} />
      </div>
    </div>
  );
});
Step3Employment.displayName = "Step3Employment";
export default Step3Employment;
