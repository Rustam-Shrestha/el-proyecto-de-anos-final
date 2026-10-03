import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthService } from '../../services/authService';
import { apiErrorMessage } from '@shared/utils/apiError';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { resetPassword } = useAuthService();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ token, password });
      setDone(true);
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Reset failed. The link may have expired — request a new one.'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-shell">
        <div className="panel w-full max-w-md p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            This reset link is invalid or missing token.
          </div>
          <p className="text-sm">
            <Link className="font-medium text-[var(--primary)] hover:underline" to="/forgot-password">Request a new link</Link>
            {" · "}
            <Link className="font-medium text-gray-600 hover:underline" to="/login">Back to login</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="panel w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
        {done ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-green-200 bg-[var(--primary-soft)] p-4 text-sm text-[var(--primary)]">
              Your password was reset successfully. You can now sign in with your new credentials.
            </div>
            <p className="text-center text-sm">
              <Link className="inline-flex items-center rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-hover)]" to="/login">
                Go to login
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                placeholder="Re-enter new password"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[var(--primary)]"
              />
            </div>
            <button
              disabled={loading}
              type="submit"
              className="w-full rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset password"}
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

export default ResetPasswordPage;
