import { memo, useState } from "react";
import { ChevronDown } from "lucide-react";
import KYCList from "@features/kyc/components/KYCList";

const statusOptions = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const;
type StatusOption = (typeof statusOptions)[number];

const KYCListPage = () => {
  const [status, setStatus] = useState<StatusOption>("ALL");

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--green-icon)]">KYC Applications</p>
          <h2 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">KYC Applications</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Review submitted applications and manage status.</p>
        </div>

        <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 sm:min-w-56">
          Status Filter
          <div className="relative">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusOption)}
              className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 pr-10 text-sm text-gray-900 outline-none transition-colors focus:border-[var(--green-icon)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? "All" : option.charAt(0) + option.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
          </div>
        </label>
      </div>

      <KYCList status={status} />
    </section>
  );
};

export default memo(KYCListPage);