import { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import ConfirmDialog from '../components/ConfirmDialog';
import Select from '../components/Select';
import { useToast } from '../context/ToastContext';
import { fetchAccounts, createAccount, deleteAccount } from '../api/accounts';

const ACCOUNT_TYPES = [
  { value: 'savings', label: 'Savings' },
  { value: 'current', label: 'Current' },
  { value: 'salary', label: 'Salary' },
  { value: 'other', label: 'Other' },
];

const formatCurrency = (amount) => `₹${Math.round(amount || 0).toLocaleString('en-IN')}`;

const EMPTY_FORM = { bankName: '', accountName: '', accountType: 'savings', initialBalance: '' };

const Accounts = () => {
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, accountId: null });

  const loadAccounts = async () => {
    try {
      const res = await fetchAccounts();
      setAccounts(res.data.accounts);
    } catch (err) {
      setError('Could not load accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await createAccount({
        ...form,
        initialBalance: Number(form.initialBalance) || 0,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      loadAccounts();
      showToast(`${form.bankName} account added`, 'success');
    } catch (err) {
      const message = err.response?.data?.message || 'Could not add account.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (accountId) => {
    setConfirmState({ open: true, accountId });
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteAccount(confirmState.accountId);
      loadAccounts();
      showToast('Account removed', 'success');
    } catch (err) {
      showToast('Could not delete account.', 'error');
    } finally {
      setConfirmState({ open: false, accountId: null });
    }
  };

  return (
    <PageLayout>
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <span className="eyebrow-tab">Accounts</span>
          <h1 className="font-display mt-3" style={{ fontSize: '2rem', color: 'var(--ink-navy)' }}>
            Your bank accounts
          </h1>
        </div>
        <button className="btn-ledger" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add account'}
        </button>
      </div>

      {error && (
        <div className="font-mono mb-3" style={{ background: 'var(--rust-soft)', color: 'var(--rust)', padding: '0.6rem 0.8rem', borderRadius: '2px', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {showForm && (
        <div className="card-paper p-4 mb-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Bank name</label>
                <input name="bankName" className="input-ledger" value={form.bankName} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Account name</label>
                <input name="accountName" className="input-ledger" value={form.accountName} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Account type</label>
                <Select name="accountType" value={form.accountType} onChange={handleChange} options={ACCOUNT_TYPES} />
              </div>
              <div className="col-md-6">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Initial balance</label>
                <input
                  name="initialBalance"
                  type="number"
                  className="input-ledger"
                  value={form.initialBalance}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
            </div>
            <button type="submit" className="btn-ledger mt-4" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add account'}
            </button>
          </form>
        </div>
      )}

      <div className="card-paper p-4">
        {loading ? (
          <p style={{ color: 'var(--ink-text-muted)' }}>Loading accounts…</p>
        ) : accounts.length === 0 ? (
          <p style={{ color: 'var(--ink-text-muted)' }}>
            No accounts yet. Add your first bank account to start tracking your balance.
          </p>
        ) : (
          accounts.map((acc) => (
            <div className="ledger-row" key={acc._id}>
              <div>
                <div className="ledger-row-label" style={{ color: 'var(--ink-text)', fontWeight: 500 }}>
                  {acc.bankName} — {acc.accountName}
                </div>
                <div className="font-mono text-capitalize" style={{ fontSize: '0.72rem', color: 'var(--ink-text-muted)' }}>
                  {acc.accountType} · {acc.status}
                </div>
              </div>
              <div className="d-flex align-items-center gap-3">
                <span className="ledger-row-value value-neutral">{formatCurrency(acc.currentBalance)}</span>
                <button
                  onClick={() => handleDeleteClick(acc._id)}
                  style={{ background: 'none', border: 'none', color: 'var(--rust)', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={confirmState.open}
        title="Remove this account?"
        message="This will permanently remove the account. Transactions already recorded against it will remain, but you won't be able to add new ones."
        confirmLabel="Remove"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ open: false, accountId: null })}
      />
    </PageLayout>
  );
};

export default Accounts;