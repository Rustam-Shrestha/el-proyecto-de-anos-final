import { memo, useState } from "react";
import LoansList from "@features/loans/components/LoansList";
import PageHeader from "@shared/components/PageHeader";
import Card from "@shared/components/Card";
import CustomSelectField from "@components/common/SelectField";

const statusOptions = ["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"] as const;
type StatusOption = (typeof statusOptions)[number];

const LoanOfficerDashboardPage = () => {
  const [status, setStatus] = useState<StatusOption>("ALL");
  return (
    <section className="space-y-6">
      <Card>
        <PageHeader
          label="Loan Applications"
          title="Loan Applications"
          description="Review, approve, and reject loan applications."
          actions={
            <div className="w-full sm:w-56">
              <CustomSelectField label="Status Filter" value={status} onChange={(e) => setStatus(e.target.value as StatusOption)} options={statusOptions.map((o) => ({ value: o, label: o === "ALL" ? "All" : o.charAt(0) + o.slice(1).toLowerCase() }))} />
            </div>
          }
        />
      </Card>
      <LoansList status={status} />
    </section>
  );
};
LoanOfficerDashboardPage.displayName = "LoanOfficerDashboardPage";
export default memo(LoanOfficerDashboardPage);
