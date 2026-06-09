import React, { useEffect } from 'react';
import useProtectedRoute from '../../middleware/protectedRoute';
import useAdmin from '../../hooks/useAdmin';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const AdminDashboardPage: React.FC = () => {
  useProtectedRoute(['ADMIN', 'REVIEWER']);
  const { fetchDashboard, dashboard, loading } = useAdmin();

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <pre>{JSON.stringify(dashboard, null, 2)}</pre>
    </div>
  );
};

export default AdminDashboardPage;
