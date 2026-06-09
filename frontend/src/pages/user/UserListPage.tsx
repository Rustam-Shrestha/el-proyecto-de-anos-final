import React, { useEffect, useState } from 'react';
import useProtectedRoute from '../../middleware/protectedRoute';
import useUser from '../../hooks/useUser';
import UsersTable from '../../components/tables/UsersTable';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const UserListPage: React.FC = () => {
  useProtectedRoute(['ADMIN']);
  const { listUsers } = useUser();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { const res = await listUsers({ page: 1, limit: 20 }); setData(res.data || []); } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1>Users</h1>
      <UsersTable data={data} />
    </div>
  );
};

export default UserListPage;
