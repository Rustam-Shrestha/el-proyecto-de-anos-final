import React, { useEffect } from 'react';
import useProtectedRoute from '../../middleware/protectedRoute';
import useUser from '../../hooks/useUser';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorAlert from '../../components/shared/ErrorAlert';

const ProfilePage: React.FC = () => {
  useProtectedRoute(['USER', 'ADMIN', 'REVIEWER']);
  const { data, fetchMe, loading, error } = useUser();

  useEffect(() => { fetchMe(); }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!data) return <ErrorAlert message="Profile not found" />;

  return (
    <div>
      <h1>Profile</h1>
      <div>
        <p><strong>Email:</strong> {data.email}</p>
        <p><strong>Name:</strong> {data.fullName}</p>
        <p><strong>Role:</strong> {data.role}</p>
      </div>
    </div>
  );
};

export default ProfilePage;
