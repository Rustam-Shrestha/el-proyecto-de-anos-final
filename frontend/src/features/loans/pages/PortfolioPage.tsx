import { memo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetMyEmployment,
  useSaveEmploymentMutation,
  type EmploymentInput,
} from "@features/loans/api/employmentApi";
import { Button } from "@shared/components/Button";
import { useToast } from "@shared/hooks/useToast";
import { SkeletonLoader } from "@shared/components/SkeletonLoader";

const PortfolioPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: employment, isLoading } = useGetMyEmployment();
  const saveMutation = useSaveEmploymentMutation();

  const [occupationJobTitle, setOccupationJobTitle] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [employmentStartDate, setEmploymentStartDate] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");
  const [dependentsCount, setDependentsCount] = useState("0");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (employment) {
      setOccupationJobTitle(employment.occupationJobTitle ?? "");
      setEmployerName(employment.employerName ?? "");
      setEmploymentStartDate(
        employment.employmentStartDate
          ? employment.employmentStartDate.split("T")[0]
          : ""
      );
      setAnnualIncome(employment.annualIncome?.toString() ?? "");
      setDependentsCount(employment.dependentsCount?.toString() ?? "0");
    }
  }, [employment]);

  const validate = (): boolean => {
    const fieldErrors: Record<string, string> = {};
    if (!occupationJobTitle.trim())
      fieldErrors.occupationJobTitle = "Job title is required";
    if (!employmentStartDate)
      fieldErrors.employmentStartDate = "Start date is required";
    else if (new Date(employmentStartDate) > new Date())
      fieldErrors.employmentStartDate = "Start date must be in the past";
    const income = Number(annualIncome);
    if (!annualIncome || isNaN(income) || income <= 0)
      fieldErrors.annualIncome = "Enter a valid annual income";
    setErrors(fieldErrors);
    return Object.keys(fieldErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await saveMutation.mutateAsync({
        occupationJobTitle: occupationJobTitle.trim(),
        employmentStartDate,
        annualIncome: Number(annualIncome),
        employerName: employerName.trim() || undefined,
        dependentsCount: Number(dependentsCount) || 0,
      });
      toast.success("Financial profile saved successfully");
      navigate("/dashboard/loans/apply");
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(
        apiError.response?.data?.message || "Failed to save financial profile"
      );
    }
  };

  if (isLoading) {
    return <SkeletonLoader count={3} type="list" />;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--green-icon)]">
          Financial Profile
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900">
          Your Portfolio
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Provide your employment and income details. This data is used to
          calculate your loan eligibility and risk score.
        </p>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Occupation / Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={occupationJobTitle}
              onChange={(e) => setOccupationJobTitle(e.target.value)}
              placeholder="e.g. Software Engineer, Teacher, Business Owner"
              className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--green-icon)] ${
                errors.occupationJobTitle
                  ? "border-red-300"
                  : "border-gray-300"
              }`}
            />
            {errors.occupationJobTitle ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.occupationJobTitle}
              </p>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Employer Name
            </label>
            <input
              type="text"
              value={employerName}
              onChange={(e) => setEmployerName(e.target.value)}
              placeholder="e.g. ABC Company"
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--green-icon)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Employment Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={employmentStartDate}
              onChange={(e) => setEmploymentStartDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--green-icon)] ${
                errors.employmentStartDate
                  ? "border-red-300"
                  : "border-gray-300"
              }`}
            />
            {errors.employmentStartDate ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.employmentStartDate}
              </p>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Annual Income (NPR) <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                inputMode="numeric"
                value={annualIncome}
                onChange={(e) =>
                  setAnnualIncome(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="e.g. 600000"
                className={`w-full rounded-xl border px-4 py-3 pr-16 text-sm outline-none transition-colors focus:border-[var(--green-icon)] ${
                  errors.annualIncome ? "border-red-300" : "border-gray-300"
                }`}
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                NPR
              </span>
            </div>
            {errors.annualIncome ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.annualIncome}
              </p>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Number of Dependents
            </label>
            <input
              type="number"
              min={0}
              max={20}
              value={dependentsCount}
              onChange={(e) => setDependentsCount(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--green-icon)]"
            />
            <p className="mt-1 text-xs text-gray-500">
              Children or family members financially dependent on you
            </p>
          </div>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          * Your financial profile is stored securely and used to compute loan
          eligibility and risk assessment.
        </p>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-200 pt-5">
          <Button
            variant="ghost"
            type="button"
            onClick={() => navigate("/dashboard")}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            isLoading={saveMutation.isPending}
          >
            {employment ? "Update Financial Profile" : "Save Financial Profile"}
          </Button>
        </div>
      </div>
    </section>
  );
};

PortfolioPage.displayName = "PortfolioPage";

export default memo(PortfolioPage);
