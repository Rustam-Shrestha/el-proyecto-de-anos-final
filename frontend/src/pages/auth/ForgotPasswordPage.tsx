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
    <div style={{ maxWidth: 420, margin: '4rem auto', padding: 24 }}>
      <h1>Forgot Password</h1>
      {sent ? (
        <>
          <p style={{ color: '#15803d' }}>
            If an account exists for {email}, a password reset link was sent to it.
            The link expires in 1 hour.
          </p>
          <p>
            <Link to="/login">Back to login</Link>
          </p>
        </>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ color: '#6b7280' }}>Enter your account email and we will send you a reset link.</p>
          {error && <div style={{ color: 'red' }}>{error}</div>}
          <label>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <button disabled={loading} type="submit">
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
          <p>
            <Link to="/login">Back to login</Link>
          </p>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
