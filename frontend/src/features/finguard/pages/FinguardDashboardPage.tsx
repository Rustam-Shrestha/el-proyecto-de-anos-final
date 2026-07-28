import React from "react";
import FinancialOverview from "../components/FinancialOverview";
import StatementUpload from "../components/StatementUpload";
import LoanAssessor from "../components/LoanAssessor";
import NluChatbot from "../components/NluChatbot";

const FinguardDashboardPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Financial Analysis</h1>
        <p className="text-sm text-gray-500">
          Upload bank statements, analyze your finances, and check loan eligibility
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <StatementUpload />
          <FinancialOverview />
          <LoanAssessor />
        </div>
        <div>
          <NluChatbot />
        </div>
      </div>
    </div>
  );
};

export default FinguardDashboardPage;
