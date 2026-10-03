import { memo, useState } from "react";
import LoansList from "@features/loans/components/LoansList";
import PageHeader from "@shared/components/PageHeader";
import Card from "@shared/components/Card";
import CustomSelectField from "@components/common/SelectField";

import Breadcrumb from "@components/seo/Breadcrumb";

const statusOptions = ["ALL", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"] as const;
type StatusOption = (typeof statusOptions)[number];

const LoanOfficerDashboardPage = () => {
  const [status, setStatus] = useState<StatusOption>("ALL");
  return (
    <section className="space-y-4">
      <PageHeader
        breadcrumb={<Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Loan Applications" }]} />}
        title="Loan Applications"
        actions={
          <div className="w-full sm:w-56">
            <CustomSelectField label="Status Filter" value={status} onChange={(e) => setStatus(e.target.value as StatusOption)} options={statusOptions.map((o) => ({ value: o, label: o === "ALL" ? "All" : o.charAt(0) + o.slice(1).toLowerCase() }))} />
          </div>
        }
      />
      <LoansList status={status} />
    </section>
  );
};
LoanOfficerDashboardPage.displayName = "LoanOfficerDashboardPage";
export default memo(LoanOfficerDashboardPage);
