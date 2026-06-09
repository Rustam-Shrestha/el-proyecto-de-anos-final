import React, { useEffect, useState } from 'react';
import useProtectedRoute from '../../middleware/protectedRoute';
import useDocument from '../../hooks/useDocument';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const DocumentManagementPage: React.FC = () => {
  useProtectedRoute(['USER']);
  useDocument();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => { setLoading(true); try { /* placeholder: no id */ } finally { setLoading(false); } })();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1>Documents</h1>
      <div>No documents UI implemented yet.</div>
    </div>
  );
};

export default DocumentManagementPage;
