import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Seo } from '../components/seo/Seo';
import { useAuth } from '@store/hooks';

const UnauthorizedPage: React.FC = () => {
  const [params] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const redirectTo = params.get('redirect_to') || '/dashboard';

  return (
    <section className="flex min-h-[60vh] items-center justify-center p-6">
      <Seo path="/401" noindex />
      <div className="panel max-w-lg text-center p-8">
        <h2 className="text-5xl font-bold text-gray-900">{isAuthenticated ? "403" : "401"}</h2>
        <p className="mt-3 text-lg font-semibold text-gray-800">
          {isAuthenticated ? "Access Restricted" : "Unauthorized"}
        </p>
        <p className="mt-2 text-sm text-gray-600">
          {isAuthenticated
            ? "Your account role does not have permission to view this section."
            : "You need to log in to access this page. Your session may have expired."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          {isAuthenticated ? (
            <Link
              className="inline-flex items-center rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
              to="/dashboard"
            >
              Back to Dashboard
            </Link>
          ) : (
            <>
              <Link className="inline-flex items-center rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)]" to={`/login?redirect_to=${encodeURIComponent(redirectTo)}`}>
                Log in
              </Link>
              <Link className="inline-flex items-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" to="/register">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default UnauthorizedPage;
