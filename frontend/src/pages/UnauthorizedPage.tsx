import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Seo } from '../components/seo/Seo';

const UnauthorizedPage: React.FC = () => {
  const [params] = useSearchParams();
  const redirectTo = params.get('redirect_to') || '/dashboard';
  return (
    <section className="page-center">
      <Seo path="/401" noindex />
      <div className="panel max-w-lg text-center">
        <h2 className="text-6xl font-bold text-gray-900">401</h2>
        <p className="mt-2 text-lg font-medium text-gray-700">
          Unauthorized
        </p>
        <p className="mt-1 text-sm text-gray-500">You need to log in to access this page. Your session may have expired. Please log in again.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link className="underline text-sm" to={`/login?redirect_to=${encodeURIComponent(redirectTo)}`}>Log in</Link>
          <Link className="underline text-sm" to="/register">Don&apos;t have an account? Sign up</Link>
        </div>
        <div className="mt-3 text-sm text-gray-500">
          <Link className="underline text-sm" to="/contact">Contact support</Link>
          {' | '}
          <Link className="underline text-sm" to="/pricing">Pricing</Link>
        </div>
      </div>
    </section>
  );
};

export default UnauthorizedPage;
