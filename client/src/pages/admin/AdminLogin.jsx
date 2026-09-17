import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../../api/superAdmin';
import { setAdminToken } from '../../api/adminClient';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await loginAdmin(email, password);
      setAdminToken(res.data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: '100vh', background: 'var(--ink-navy)' }}
    >
      <div style={{ width: '100%', maxWidth: '360px', padding: '2rem' }}>
        <div className="text-center mb-4">
          <span className="eyebrow-tab">Restricted</span>
          <h1 className="font-display mt-3" style={{ fontSize: '1.8rem', color: 'var(--paper)' }}>
            Admin Portal
          </h1>
          <p style={{ color: 'rgba(239,234,224,0.6)', fontSize: '0.85rem' }}>
            Cash Ledger operator access
          </p>
        </div>

        <div className="card-paper p-4">
          {error && (
            <div
              className="font-mono mb-3"
              style={{ background: 'var(--rust-soft)', color: 'var(--rust)', padding: '0.6rem 0.8rem', borderRadius: '2px', fontSize: '0.85rem' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Email</label>
              <input type="email" className="input-ledger" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="mb-4">
              <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Password</label>
              <input type="password" className="input-ledger" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn-ledger w-100" disabled={submitting}>
              {submitting ? 'Logging in…' : 'Log In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;