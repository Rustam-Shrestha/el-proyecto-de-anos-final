import React from 'react';
import useProtectedRoute from '../../middleware/protectedRoute';

const EditProfilePage: React.FC = () => {
  useProtectedRoute(['USER', 'ADMIN', 'REVIEWER']);
  return (
    <div>
      <h1>Edit Profile</h1>
      <p>Profile edit form goes here.</p>
    </div>
  );
};

export default EditProfilePage;
