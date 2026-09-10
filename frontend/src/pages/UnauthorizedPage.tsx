import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Seo } from '../components/seo/Seo';

const UnauthorizedPage: React.FC = () => {
  const [params] = useSearchParams();
  const redirectTo = params.get('redirect_to') || '/dashboard';
  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <Seo path="/401" noindex />
      <h1>Unauthorized (401)</h1>
      <p>You need to log in to access this page.</p>
      <p style={{ fontSize: 14, color: '#666' }}>Your session may have expired. Please log in again.</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
        <Link to={`/login?redirect_to=${encodeURIComponent(redirectTo)}`}>Log in</Link>
        <Link to="/register">Don&apos;t have an account? Sign up</Link>
      </div>
      <div style={{ marginTop: 12 }}>
        <Link to="/contact">Contact support</Link> | <Link to="/pricing">Pricing</Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
