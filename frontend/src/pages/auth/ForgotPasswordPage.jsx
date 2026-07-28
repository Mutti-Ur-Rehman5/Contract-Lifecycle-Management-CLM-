import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../features/auth/authApi.js';
import '../../styles/pages/auth.css';

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Check your email</h1>
            <p className="auth-subtitle">We sent a 6-digit OTP code to</p>
            <p className="auth-email-highlight">{email}</p>
          </div>
          <div className="auth-info-box">
            <p>Enter the code on the next screen to reset your password. The code expires in 10 minutes.</p>
          </div>
          <button
            className="btn btn-primary btn-full"
            onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
          >
            Enter OTP Code
          </button>
          <p className="auth-footer">
            <button className="auth-link-btn" onClick={() => { setSent(false); setEmail(''); }}>
              Use a different email
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Forgot your password?</h1>
          <p className="auth-subtitle">Enter your email and we'll send you a code to reset it.</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              required
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading || !email}>
            {loading ? 'Sending OTP...' : 'Send OTP Code'}
          </button>
        </form>
        <p className="auth-footer">
          Remember your password?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
