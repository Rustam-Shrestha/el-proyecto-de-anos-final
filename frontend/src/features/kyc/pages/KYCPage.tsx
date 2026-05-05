// """
// KYC Page - Main KYC workflow page.

// Renders the KYC form and status dashboard.
// """

import React, { memo } from "react";
import KYCForm from "../components/KYCForm";

const KYCPage = memo(() => {
  const userId = "user-123"; // Get from auth context

  const handleKYCComplete = (kycApplicationId: string) => {
    console.log("KYC completed successfully", kycApplicationId);
    // Redirect to success page or dashboard
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <KYCForm userId={userId} onKYCComplete={handleKYCComplete} />
    </div>
  );
});

KYCPage.displayName = "KYCPage";
export default KYCPage;
