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
      <div style={{ maxWidth: 420, margin: '4rem auto', padding: 24 }}>
        <h1>Reset Password</h1>
        <p style={{ color: 'red' }}>This reset link is invalid (missing token).</p>
        <p>
          <Link to="/forgot-password">Request a new link</Link> · <Link to="/login">Back to login</Link>
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 420, margin: '4rem auto', padding: 24 }}>
      <h1>Reset Password</h1>
      {done ? (
        <>
          <p style={{ color: '#15803d' }}>Your password was reset. You can now sign in.</p>
          <p>
            <Link to="/login">Go to login</Link>
          </p>
        </>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {error && <div style={{ color: 'red' }}>{error}</div>}
          <label>New password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <label>Confirm new password</label>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
          <button disabled={loading} type="submit">
            {loading ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ResetPasswordPage;
