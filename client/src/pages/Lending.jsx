import { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { fetchLendBorrowRecords, createLendBorrowRecord, addRepayment, deleteLendBorrowRecord } from '../api/lendBorrow';

const formatCurrency = (amount) => `₹${Math.round(amount || 0).toLocaleString('en-IN')}`;

const EMPTY_FORM = { personName: '', type: 'lend', amount: '', expectedRepaymentDate: '', description: '' };
const STATUS_LABEL = { pending: 'Pending', partial: 'Partially paid', settled: 'Settled' };

const Lending = () => {
  const { showToast } = useToast();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [repayingId, setRepayingId] = useState(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [submittingRepay, setSubmittingRepay] = useState(false);

  const [confirmState, setConfirmState] = useState({ open: false, id: null });

  const loadRecords = async () => {
    try {
      const res = await fetchLendBorrowRecords();
      setRecords(res.data.records);
    } catch (err) {
      showToast('Could not load records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
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
      loadRecords();
      showToast(`${form.type === 'lend' ? 'Lending' : 'Borrowing'} record added`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not add record.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogRepayment = async (id) => {
    if (!repayAmount || Number(repayAmount) <= 0) {
      showToast('Enter a valid repayment amount.', 'error');
      return;
    }
    setSubmittingRepay(true);
    try {
      await addRepayment(id, { amount: Number(repayAmount) });
      setRepayingId(null);
      setRepayAmount('');
      loadRecords();
      showToast('Repayment logged', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not log repayment.', 'error');
    } finally {
      setSubmittingRepay(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteLendBorrowRecord(confirmState.id);
      loadRecords();
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
        <div className="d-flex align-items-center gap-3">
          <span className={`ledger-row-value ${record.type === 'lend' ? 'value-positive' : 'value-negative'}`}>
            {formatCurrency(record.remainingAmount)}
          </span>
          {record.status !== 'settled' && (
            <button
              onClick={() => { setRepayingId(repayingId === record._id ? null : record._id); setRepayAmount(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--emerald)', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              Log repayment
            </button>
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
        <div className="d-flex gap-2 mb-2" style={{ paddingLeft: '0.1rem' }}>
          <input
            type="number"
            min="0"
            placeholder={`Up to ${record.remainingAmount}`}
            className="input-ledger"
            style={{ maxWidth: '180px' }}
            value={repayAmount}
            onChange={(e) => setRepayAmount(e.target.value)}
          />
          <button className="btn-ledger" onClick={() => handleLogRepayment(record._id)} disabled={submittingRepay}>
            {submittingRepay ? 'Saving…' : 'Save'}
          </button>
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
                <select name="type" className="input-ledger" value={form.type} onChange={handleChange}>
                  <option value="lend">I lent money (they owe me)</option>
                  <option value="borrow">I borrowed money (I owe them)</option>
                </select>
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
        message="This permanently removes the record and its repayment history."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ open: false, id: null })}
      />
    </PageLayout>
  );
};

export default Lending;