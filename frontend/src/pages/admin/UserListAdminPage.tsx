import React from 'react';
import useProtectedRoute from '../../middleware/protectedRoute';

const UserListAdminPage: React.FC = () => {
  useProtectedRoute(['ADMIN']);
  return (
    <div>
      <h1>Admin Users</h1>
      <p>Admin users list page (reuse `UserListPage` or components).</p>
    </div>
  );
};

export default UserListAdminPage;
