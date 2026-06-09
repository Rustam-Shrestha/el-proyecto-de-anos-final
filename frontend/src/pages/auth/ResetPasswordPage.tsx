import React from 'react';
import { useParams } from 'react-router-dom';

const ResetPasswordPage: React.FC = () => {
  const { token } = useParams();
  return (
    <div>
      <h1>Reset Password</h1>
      <p>Token: {token}</p>
    </div>
  );
};

export default ResetPasswordPage;
