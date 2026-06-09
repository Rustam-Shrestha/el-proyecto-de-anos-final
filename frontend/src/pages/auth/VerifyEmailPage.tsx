import React from 'react';
import { useParams } from 'react-router-dom';

const VerifyEmailPage: React.FC = () => {
  const { token } = useParams();
  return (
    <div>
      <h1>Verify Email</h1>
      <p>Token: {token}</p>
    </div>
  );
};

export default VerifyEmailPage;
