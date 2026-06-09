import React from 'react';
import useProtectedRoute from '../../middleware/protectedRoute';

const KycListAdminPage: React.FC = () => {
  useProtectedRoute(['ADMIN', 'REVIEWER']);
  return (
    <div>
      <h1>Admin KYC List</h1>
      <p>Use KycListPage components here.</p>
    </div>
  );
};

export default KycListAdminPage;
