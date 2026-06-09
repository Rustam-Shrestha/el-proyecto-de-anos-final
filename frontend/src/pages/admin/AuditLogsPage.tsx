import React from 'react';
import useProtectedRoute from '../../middleware/protectedRoute';

const AuditLogsPage: React.FC = () => {
  useProtectedRoute(['ADMIN']);
  return (
    <div>
      <h1>Audit Logs</h1>
      <p>Audit logs table would be here.</p>
    </div>
  );
};

export default AuditLogsPage;
