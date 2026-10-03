import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthService } from '../../services/authService';
import { apiErrorMessage } from '@shared/utils/apiError';

const ForgotPasswordPage: React.FC = () => {
  const { forgotPassword } = useAuthService();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword({ email });
      // Backend is silent for unknown emails (no account enumeration),
      // so always show the confirmation.
      setSent(true);
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Could not send reset email. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="panel w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
        {sent ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-green-200 bg-[var(--primary-soft)] p-4 text-sm text-[var(--primary)]">
              If an account exists for <span className="font-semibold">{email}</span>, a password reset link was sent to it. The link expires in 1 hour.
            </div>
            <p className="text-center text-sm">
              <Link className="font-medium text-[var(--primary)] hover:underline" to="/login">
                Back to login
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <p className="text-sm text-gray-600">Enter your account email and we will send you a reset link.</p>
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="name@example.com"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[var(--primary)]"
              />
            </div>
            <button
              disabled={loading}
              type="submit"
              className="w-full rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
            <p className="text-center text-sm text-gray-600">
              <Link className="font-medium text-[var(--primary)] hover:underline" to="/login">
                Back to login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
