import React from 'react';
import useProtectedRoute from '../../middleware/protectedRoute';
import KycSubmitForm from '../../components/forms/KycSubmitForm';

const SubmitKycPage: React.FC = () => {
  useProtectedRoute(['USER']);
  return (
    <div>
      <h1>Submit KYC</h1>
      <KycSubmitForm />
    </div>
  );
};

export default SubmitKycPage;
