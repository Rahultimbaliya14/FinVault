import { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { fetchTransactions, createTransaction, deleteTransaction } from '../api/transactions';
import { fetchAccounts } from '../api/accounts';

const formatCurrency = (amount) => `₹${Math.round(amount || 0).toLocaleString('en-IN')}`;

const TYPES = ['expense', 'upi_expense', 'income', 'bank_transfer', 'refund'];
const CATEGORIES = ['food', 'shopping', 'travel', 'entertainment', 'utilities', 'medical', 'fuel', 'online_purchase', 'salary', 'other'];
const PAYMENT_METHODS = ['cash', 'upi', 'debit_card', 'net_banking', 'other'];
const CREDIT_TYPES = ['income', 'refund'];

const EMPTY_FORM = {
  accountId: '',
  amount: '',
  type: 'expense',
  category: 'other',
  paymentMethod: 'upi',
  date: new Date().toISOString().slice(0, 10),
  description: '',
};

const Transactions = () => {
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [filterAccount, setFilterAccount] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, txId: null });

  const accountMap = Object.fromEntries(accounts.map((a) => [a._id, `${a.bankName} — ${a.accountName}`]));

  const loadData = async (accountFilter = filterAccount) => {
    try {
      const [txRes, accRes] = await Promise.all([
        fetchTransactions(accountFilter ? { accountId: accountFilter } : {}),
        fetchAccounts(),
      ]);
      setTransactions(txRes.data.transactions);
      setAccounts(accRes.data.accounts);
      if (!form.accountId && accRes.data.accounts.length > 0) {
        setForm((f) => ({ ...f, accountId: accRes.data.accounts[0]._id }));
      }
    } catch (err) {
      setError('Could not load transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilterAccount(value);
    loadData(value);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.accountId) {
      showToast('Add a bank account first.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await createTransaction({ ...form, amount: Number(form.amount) });
      setForm({ ...EMPTY_FORM, accountId: form.accountId });
      setShowForm(false);
      loadData();
      showToast('Transaction recorded', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not record transaction.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteTransaction(confirmState.txId);
      loadData();
      showToast('Transaction deleted', 'success');
    } catch (err) {
      showToast('Could not delete transaction.', 'error');
    } finally {
      setConfirmState({ open: false, txId: null });
    }
  };

  return (
    <PageLayout>
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <span className="eyebrow-tab">Transactions</span>
          <h1 className="font-display mt-3" style={{ fontSize: '2rem', color: 'var(--ink-navy)' }}>
            Every entry, logged
          </h1>
        </div>
        <button className="btn-ledger" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add transaction'}
        </button>
      </div>

      {error && (
        <div className="font-mono mb-3" style={{ background: 'var(--rust-soft)', color: 'var(--rust)', padding: '0.6rem 0.8rem', borderRadius: '2px', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {showForm && (
        <div className="card-paper p-4 mb-4">
          {accounts.length === 0 ? (
            <p style={{ color: 'var(--ink-text-muted)' }}>
              You need a bank account before recording transactions. Add one from the Accounts page first.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Account</label>
                  <select name="accountId" className="input-ledger" value={form.accountId} onChange={handleChange} required>
                    {accounts.map((acc) => (
                      <option key={acc._id} value={acc._id}>{acc.bankName} — {acc.accountName}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Amount</label>
                  <input name="amount" type="number" className="input-ledger" value={form.amount} onChange={handleChange} required min="0" />
                </div>
                <div className="col-md-4">
                  <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Type</label>
                  <select name="type" className="input-ledger" value={form.type} onChange={handleChange}>
                    {TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Category</label>
                  <select name="category" className="input-ledger" value={form.category} onChange={handleChange}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Payment method</label>
                  <select name="paymentMethod" className="input-ledger" value={form.paymentMethod} onChange={handleChange}>
                    {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Date</label>
                  <input name="date" type="date" className="input-ledger" value={form.date} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Description</label>
                  <input name="description" className="input-ledger" value={form.description} onChange={handleChange} placeholder="Optional" />
                </div>
              </div>
              <button type="submit" className="btn-ledger mt-4" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save transaction'}
              </button>
            </form>
          )}
        </div>
      )}

      {accounts.length > 0 && (
        <div className="mb-3" style={{ maxWidth: '280px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Filter by account</label>
          <select className="input-ledger" value={filterAccount} onChange={handleFilterChange}>
            <option value="">All accounts</option>
            {accounts.map((acc) => (
              <option key={acc._id} value={acc._id}>{acc.bankName} — {acc.accountName}</option>
            ))}
          </select>
        </div>
      )}

      <div className="card-paper p-4">
        {loading ? (
          <p style={{ color: 'var(--ink-text-muted)' }}>Loading transactions…</p>
        ) : transactions.length === 0 ? (
          <p style={{ color: 'var(--ink-text-muted)' }}>No transactions recorded yet.</p>
        ) : (
          transactions.map((tx) => (
            <div className="ledger-row" key={tx._id}>
              <div>
                <div className="ledger-row-label" style={{ color: 'var(--ink-text)', fontWeight: 500 }}>
                  {tx.description || tx.category.replace('_', ' ')}
                </div>
                <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--ink-text-muted)' }}>
                  {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' · '}{accountMap[tx.accountId] || 'Account'}
                  {' · '}{tx.paymentMethod.replace('_', ' ')}
                </div>
              </div>
              <div className="d-flex align-items-center gap-3">
                <span className={`ledger-row-value ${CREDIT_TYPES.includes(tx.type) ? 'value-positive' : 'value-negative'}`}>
                  {CREDIT_TYPES.includes(tx.type) ? '+' : '−'}{formatCurrency(tx.amount)}
                </span>
                <button
                  onClick={() => setConfirmState({ open: true, txId: tx._id })}
                  style={{ background: 'none', border: 'none', color: 'var(--rust)', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={confirmState.open}
        title="Delete this transaction?"
        message="This will remove the entry and update the linked account's balance immediately."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ open: false, txId: null })}
      />
    </PageLayout>
  );
};

export default Transactions;