import React, { useEffect } from 'react';
import useProtectedRoute from '../../middleware/protectedRoute';
import useKyc from '../../hooks/useKyc';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorAlert from '../../components/shared/ErrorAlert';

const KycStatusPage: React.FC = () => {
  useProtectedRoute(['USER']);
  const { data, fetchStatus, loading, error } = useKyc();

  useEffect(() => { fetchStatus(); }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!data) return <div>No KYC submitted yet</div>;

  return (
    <div>
      <h1>KYC Status</h1>
      <div>Status: {data.status}</div>
      <div>Submitted: {new Date(data.submittedAt).toLocaleString()}</div>
    </div>
  );
};

export default KycStatusPage;
