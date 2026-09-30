import { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import ConfirmDialog from '../components/ConfirmDialog';
import Select from '../components/Select';
import { useToast } from '../context/ToastContext';
import { fetchLendBorrowRecords, createLendBorrowRecord, addRepayment, deleteLendBorrowRecord } from '../api/lendBorrow';
import { fetchAccounts } from '../api/accounts';

const formatCurrency = (amount) => `₹${Math.round(amount || 0).toLocaleString('en-IN')}`;

const EMPTY_FORM = { personName: '', type: 'lend', amount: '', expectedRepaymentDate: '', description: '' };
const STATUS_LABEL = { pending: 'Pending', partial: 'Partially paid', settled: 'Settled' };

const Lending = () => {
  const { showToast } = useToast();
  const [records, setRecords] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Repayment mini-form state: repayingId identifies which record's
  // form is open, mode is 'partial' (log any amount) or 'settle'
  // (pre-filled with the full remaining amount, one click to close it out).
  const [repayingId, setRepayingId] = useState(null);
  const [repayMode, setRepayMode] = useState('partial');
  const [repayAmount, setRepayAmount] = useState('');
  const [repayAccountId, setRepayAccountId] = useState('');
  const [submittingRepay, setSubmittingRepay] = useState(false);

  const [confirmState, setConfirmState] = useState({ open: false, id: null });

  const loadData = async () => {
    try {
      const [recordsRes, accountsRes] = await Promise.all([fetchLendBorrowRecords(), fetchAccounts()]);
      setRecords(recordsRes.data.records);
      setAccounts(accountsRes.data.accounts);
    } catch (err) {
      showToast('Could not load records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createLendBorrowRecord({ ...form, amount: Number(form.amount) });
      setForm(EMPTY_FORM);
      setShowForm(false);
      loadData();
      showToast(`${form.type === 'lend' ? 'Lending' : 'Borrowing'} record added`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not add record.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openRepayForm = (record, mode) => {
    setRepayingId(repayingId === record._id && repayMode === mode ? null : record._id);
    setRepayMode(mode);
    setRepayAmount(mode === 'settle' ? String(record.remainingAmount) : '');
    setRepayAccountId('');
  };

  const handleLogRepayment = async (record) => {
    if (!repayAmount || Number(repayAmount) <= 0) {
      showToast('Enter a valid repayment amount.', 'error');
      return;
    }
    if (repayMode === 'settle' && !repayAccountId) {
      showToast('Select an account to settle into.', 'error');
      return;
    }
    setSubmittingRepay(true);
    try {
      await addRepayment(record._id, {
        amount: Number(repayAmount),
        accountId: repayAccountId || undefined,
      });
      setRepayingId(null);
      setRepayAmount('');
      setRepayAccountId('');
      loadData();
      showToast(
        repayAccountId
          ? `${formatCurrency(repayAmount)} ${record.type === 'lend' ? 'added to' : 'deducted from'} account`
          : 'Repayment logged',
        'success'
      );
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not log repayment.', 'error');
    } finally {
      setSubmittingRepay(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteLendBorrowRecord(confirmState.id);
      loadData();
      showToast('Record deleted', 'success');
    } catch (err) {
      showToast('Could not delete record.', 'error');
    } finally {
      setConfirmState({ open: false, id: null });
    }
  };

  const lendRecords = records.filter((r) => r.type === 'lend');
  const borrowRecords = records.filter((r) => r.type === 'borrow');

  const renderRecord = (record) => (
    <div key={record._id}>
      <div className="ledger-row">
        <div>
          <div className="ledger-row-label" style={{ color: 'var(--ink-text)', fontWeight: 500 }}>{record.personName}</div>
          <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--ink-text-muted)' }}>
            {STATUS_LABEL[record.status]}
            {record.expectedRepaymentDate && ` · Expected ${new Date(record.expectedRepaymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
            {record.description && ` · ${record.description}`}
          </div>
        </div>
        <div className="d-flex align-items-center gap-3 flex-wrap justify-content-end">
          <span className={`ledger-row-value ${record.type === 'lend' ? 'value-positive' : 'value-negative'}`}>
            {formatCurrency(record.remainingAmount)}
          </span>
          {record.status !== 'settled' && (
            <>
              <button
                onClick={() => openRepayForm(record, 'settle')}
                className="btn-ledger"
                style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}
              >
                Settle
              </button>
              <button
                onClick={() => openRepayForm(record, 'partial')}
                style={{ background: 'none', border: '1px solid var(--rule-strong)', borderRadius: '2px', padding: '0.35rem 0.7rem', fontSize: '0.75rem', color: 'var(--ink-text)' }}
              >
                Log payment
              </button>
            </>
          )}
          <button
            onClick={() => setConfirmState({ open: true, id: record._id })}
            style={{ background: 'none', border: 'none', color: 'var(--rust)', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            Delete
          </button>
        </div>
      </div>

      {repayingId === record._id && (
        <div className="mb-3" style={{ paddingLeft: '0.1rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)', marginBottom: '0.4rem' }}>
            {repayMode === 'settle'
              ? `Settling the full ${formatCurrency(record.remainingAmount)} — pick which account this ${record.type === 'lend' ? 'goes into' : 'comes out of'}.`
              : "Optionally link this to an account to actually move real money — leave it unselected to just log the amount."}
          </p>
          <div className="row g-2 align-items-end">
            <div className="col-6 col-md-3">
              <label style={{ fontSize: '0.75rem', color: 'var(--ink-text-muted)' }}>Amount</label>
              <input
                type="number"
                min="0"
                className="input-ledger"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                disabled={repayMode === 'settle'}
              />
            </div>
            <div className="col-6 col-md-5">
              <label style={{ fontSize: '0.75rem', color: 'var(--ink-text-muted)' }}>
                Account {repayMode === 'partial' && '(optional)'}
              </label>
              <Select
                name="repayAccountId"
                value={repayAccountId}
                onChange={(e) => setRepayAccountId(e.target.value)}
                placeholder={repayMode === 'partial' ? "Don't link to an account" : 'Select account'}
                options={accounts.map((a) => ({ value: a._id, label: `${a.bankName} — ${a.accountName}` }))}
              />
            </div>
            <div className="col-12 col-md-4">
              <button className="btn-ledger w-100" onClick={() => handleLogRepayment(record)} disabled={submittingRepay}>
                {submittingRepay ? 'Saving…' : repayMode === 'settle' ? 'Confirm settle' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <PageLayout>
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <span className="eyebrow-tab">Lending & Borrowing</span>
          <h1 className="font-display mt-3" style={{ fontSize: '2rem', color: 'var(--ink-navy)' }}>
            Who owes whom
          </h1>
        </div>
        <button className="btn-ledger" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add record'}
        </button>
      </div>

      {showForm && (
        <div className="card-paper p-4 mb-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Person's name</label>
                <input name="personName" className="input-ledger" value={form.personName} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Type</label>
                <Select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  options={[
                    { value: 'lend', label: 'I Lent Money (They Owe Me)' },
                    { value: 'borrow', label: 'I Borrowed Money (I Owe Them)' },
                  ]}
                />
              </div>
              <div className="col-md-4">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Amount</label>
                <input name="amount" type="number" className="input-ledger" value={form.amount} onChange={handleChange} required min="0" />
              </div>
              <div className="col-md-4">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Expected repayment date</label>
                <input name="expectedRepaymentDate" type="date" className="input-ledger" value={form.expectedRepaymentDate} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Description</label>
                <input name="description" className="input-ledger" value={form.description} onChange={handleChange} placeholder="Optional" />
              </div>
            </div>
            <button type="submit" className="btn-ledger mt-4" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add record'}
            </button>
          </form>
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card-paper p-4">
            <h2 className="font-display" style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Money to receive</h2>
            {loading ? (
              <p style={{ color: 'var(--ink-text-muted)' }}>Loading…</p>
            ) : lendRecords.length === 0 ? (
              <p style={{ color: 'var(--ink-text-muted)', fontSize: '0.9rem' }}>Nobody owes you right now.</p>
            ) : (
              lendRecords.map(renderRecord)
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card-paper p-4">
            <h2 className="font-display" style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Money to pay</h2>
            {loading ? (
              <p style={{ color: 'var(--ink-text-muted)' }}>Loading…</p>
            ) : borrowRecords.length === 0 ? (
              <p style={{ color: 'var(--ink-text-muted)', fontSize: '0.9rem' }}>You don't owe anyone right now.</p>
            ) : (
              borrowRecords.map(renderRecord)
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmState.open}
        title="Delete this record?"
        message="This permanently removes the record and its repayment history. Any linked transactions are NOT reversed."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ open: false, id: null })}
      />
    </PageLayout>
  );
};

export default Lending;