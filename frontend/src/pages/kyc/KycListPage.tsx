import React, { useEffect, useState } from 'react';
import useProtectedRoute from '../../middleware/protectedRoute';
import useKyc from '../../hooks/useKyc';
import KycApplicationsTable from '../../components/tables/KycApplicationsTable';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const KycListPage: React.FC = () => {
  useProtectedRoute(['ADMIN', 'REVIEWER']);
  const { fetchList } = useKyc();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => { setLoading(true); try { const res = await fetchList({ page: 1, limit: 20 }); setData(res.data || []); } finally { setLoading(false); } })();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1>KYC Applications</h1>
      <KycApplicationsTable data={data} />
    </div>
  );
};

export default KycListPage;
