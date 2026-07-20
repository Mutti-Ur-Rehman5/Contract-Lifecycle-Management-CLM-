import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import '../../styles/pages/auth.css';

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    orgName: '',
    orgSlug: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const handleOrgNameChange = (e) => {
    const name = e.target.value;
    setForm((prev) => ({
      ...prev,
      orgName: name,
      orgSlug: generateSlug(name),
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">CLM Platform</h1>
          <p className="auth-subtitle">Create your organization</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2 className="auth-heading">Register</h2>
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="orgName">Organization name</label>
            <input
              id="orgName"
              name="orgName"
              type="text"
              className="form-input"
              placeholder="Acme Corp"
              value={form.orgName}
              onChange={handleOrgNameChange}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="orgSlug">Organization slug</label>
            <input
              id="orgSlug"
              name="orgSlug"
              type="text"
              className="form-input"
              placeholder="acme-corp"
              value={form.orgSlug}
              onChange={handleChange}
              required
            />
            <span className="form-hint">Used in URLs: clm.app/{form.orgSlug || 'acme-corp'}</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="name">Your name</label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-input"
                placeholder="Jane Smith"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="jane@acme.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating organization...' : 'Create organization'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
