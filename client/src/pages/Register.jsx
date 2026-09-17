import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      await register(email, password);
      // Registration no longer auto-logs in - the account is pending
      // admin approval, so show a confirmation instead of the dashboard.
      setRegistered(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (registered) {
    return (
      <AuthLayout
        eyebrow="Cash Ledger"
        title="Almost there."
        tagline="Your account is being reviewed before you can start using Cash Ledger."
      >
        <h2 className="font-display" style={{ fontSize: '1.5rem', marginBottom: '0.8rem' }}>
          Registration received
        </h2>
        <p style={{ color: 'var(--ink-text-muted)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          Your account has been created and is pending admin approval. You'll be able to log in once it's approved.
        </p>
        <button className="btn-ledger w-100" onClick={() => navigate('/login')}>
          Back to login
        </button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Cash Ledger"
      title="Open your ledger."
      tagline="Bank balances, credit cards, loans, and what you're owed — recorded once, understood instantly."
    >
      <h2 className="font-display" style={{ fontSize: '1.7rem', marginBottom: '0.3rem' }}>
        Create your account
      </h2>
      <p style={{ color: 'var(--ink-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Takes less than a minute.
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

        <div className="mb-3">
          <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Password</label>
          <input
            type="password"
            className="input-ledger"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Confirm Password</label>
          <input
            type="password"
            className="input-ledger"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-ledger w-100" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Register'}
        </button>
      </form>

      <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--ink-text-muted)' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--ink-navy)' }}>Log in</Link>
      </p>
    </AuthLayout>
  );
};

export default Register;