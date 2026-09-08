import { memo, useState } from "react";
import KYCList from "@features/kyc/components/KYCList";
import PageHeader from "@shared/components/PageHeader";
import Card from "@shared/components/Card";
import CustomSelectField from "@components/common/SelectField";

const statusOptions = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const;
type StatusOption = (typeof statusOptions)[number];

const KYCListPage = () => {
  const [status, setStatus] = useState<StatusOption>("ALL");
  return (
    <section className="space-y-6">
      <Card>
        <PageHeader
          label="KYC Applications"
          title="KYC Applications"
          description="Review submitted applications and manage status."
          actions={
            <div className="w-full sm:w-56">
              <CustomSelectField
                label="Status Filter"
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusOption)}
                options={statusOptions.map((o) => ({ value: o, label: o === "ALL" ? "All" : o.charAt(0) + o.slice(1).toLowerCase() }))}
              />
            </div>
          }
        />
      </Card>
      <KYCList status={status} />
    </section>
  );
};
export default memo(KYCListPage);
