import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="FinVault"
      title="Your money, in one book."
      tagline="Accounts, cards, SIPs, EMIs, and everyone who owes you — one place, no guessing."
    >
      <h2 className="font-display" style={{ fontSize: '1.7rem', marginBottom: '0.3rem' }}>
        Welcome back
      </h2>
      <p style={{ color: 'var(--ink-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Log in to see where you stand.
      </p>

      {error && (
        <div
          className="font-mono"
          style={{
            background: 'var(--rust-soft)',
            color: 'var(--rust)',
            padding: '0.6rem 0.8rem',
            borderRadius: '2px',
            fontSize: '0.85rem',
            marginBottom: '1.2rem',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Email</label>
          <input
            type="email"
            className="input-ledger"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Password</label>
          <input
            type="password"
            className="input-ledger"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-ledger w-100" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log In'}
        </button>
      </form>

      <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--ink-text-muted)' }}>
        New here? <Link to="/register" style={{ color: 'var(--ink-navy)' }}>Create an account</Link>
      </p>
    </AuthLayout>
  );
};

export default Login;