import { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import ConfirmDialog from '../components/ConfirmDialog';
import Select from '../components/Select';
import { useToast } from '../context/ToastContext';
import { fetchIPOs, createIPO, markIPOAllotted, markIPONotAllotted, cancelIPO } from '../api/ipo';
import { fetchAccounts } from '../api/accounts';

const formatCurrency = (amount) => `₹${Math.round(amount || 0).toLocaleString('en-IN')}`;
const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const EMPTY_FORM = { accountId: '', ipoName: '', amountApplied: '', applicationDate: new Date().toISOString().slice(0, 10), allotmentDate: '' };

const STATUS_STYLE = {
  blocked: { label: 'Blocked (pending)', color: 'var(--gold)' },
  allotted: { label: 'Allotted — deducted', color: 'var(--emerald)' },
  not_allotted: { label: 'Not allotted — released', color: 'var(--ink-text-muted)' },
};

const IPOPage = () => {
  const { showToast } = useToast();
  const [ipos, setIpos] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, ipo: null, action: null });

  const loadData = async () => {
    try {
      const [ipoRes, accRes] = await Promise.all([fetchIPOs(), fetchAccounts()]);
      setIpos(ipoRes.data.ipos);
      setAccounts(accRes.data.accounts);
    } catch (err) {
      showToast('Could not load IPO applications.', 'error');
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
      await createIPO({ ...form, amountApplied: Number(form.amountApplied) });
      setForm(EMPTY_FORM);
      setShowForm(false);
      loadData();
      showToast(`₹${form.amountApplied} blocked for ${form.ipoName}`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not apply for this IPO.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmAction = async () => {
    const { ipo, action } = confirmState;
    setConfirmState({ open: false, ipo: null, action: null });
    try {
      if (action === 'allot') {
        await markIPOAllotted(ipo._id);
        showToast(`${ipo.ipoName} allotted — ${formatCurrency(ipo.amountApplied)} deducted`, 'success');
      } else if (action === 'not-allot') {
        await markIPONotAllotted(ipo._id);
        showToast(`${ipo.ipoName} not allotted — hold released`, 'success');
      } else if (action === 'cancel') {
        await cancelIPO(ipo._id);
        showToast('Application cancelled, hold released', 'success');
      }
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update this application.', 'error');
    }
  };

  const blockedIPOs = ipos.filter((i) => i.status === 'blocked');
  const decidedIPOs = ipos.filter((i) => i.status !== 'blocked');
  const accountMap = Object.fromEntries(accounts.map((a) => [a._id, `${a.bankName} — ${a.accountName}`]));

  const renderRow = (ipo) => (
    <div className="ledger-row" key={ipo._id}>
      <div>
        <div className="ledger-row-label" style={{ color: 'var(--ink-text)', fontWeight: 500 }}>{ipo.ipoName}</div>
        <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--ink-text-muted)' }}>
          {accountMap[ipo.accountId] || 'Account'} · Allotment {formatDate(ipo.allotmentDate)}
        </div>
        <div className="font-mono" style={{ fontSize: '0.72rem', color: STATUS_STYLE[ipo.status].color, fontWeight: 600 }}>
          {STATUS_STYLE[ipo.status].label}
        </div>
      </div>
      <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
        <span className="ledger-row-value value-neutral">{formatCurrency(ipo.amountApplied)}</span>
        {ipo.status === 'blocked' && (
          <>
            <button
              onClick={() => setConfirmState({ open: true, ipo, action: 'allot' })}
              className="btn-ledger"
              style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}
            >
              Allotted
            </button>
            <button
              onClick={() => setConfirmState({ open: true, ipo, action: 'not-allot' })}
              style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', background: 'none', border: '1px solid var(--rule-strong)', borderRadius: '2px', color: 'var(--ink-text)' }}
            >
              Not allotted
            </button>
            <button
              onClick={() => setConfirmState({ open: true, ipo, action: 'cancel' })}
              style={{ background: 'none', border: 'none', color: 'var(--rust)', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <PageLayout>
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <span className="eyebrow-tab">IPO</span>
          <h1 className="font-display mt-3" style={{ fontSize: '2rem', color: 'var(--ink-navy)' }}>
            IPO applications
          </h1>
          <p style={{ color: 'var(--ink-text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            Applying blocks the amount in your account — it's only actually deducted if allotted.
          </p>
        </div>
        <button className="btn-ledger" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Apply for IPO'}
        </button>
      </div>

      {showForm && (
        <div className="card-paper p-4 mb-4">
          {accounts.length === 0 ? (
            <p style={{ color: 'var(--ink-text-muted)' }}>Add a bank account first — IPO amounts get blocked against one.</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>IPO name</label>
                  <input name="ipoName" className="input-ledger" value={form.ipoName} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Account to block from</label>
                  <Select
                    name="accountId"
                    value={form.accountId}
                    onChange={handleChange}
                    placeholder="Select account"
                    options={accounts.map((a) => ({ value: a._id, label: `${a.bankName} — ${a.accountName} (${formatCurrency(a.availableBalance)} available)` }))}
                  />
                </div>
                <div className="col-md-4">
                  <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Amount to block</label>
                  <input name="amountApplied" type="number" className="input-ledger" value={form.amountApplied} onChange={handleChange} required min="0" />
                </div>
                <div className="col-md-4">
                  <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Application date</label>
                  <input name="applicationDate" type="date" className="input-ledger" value={form.applicationDate} onChange={handleChange} required />
                </div>
                <div className="col-md-4">
                  <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Allotment date</label>
                  <input name="allotmentDate" type="date" className="input-ledger" value={form.allotmentDate} onChange={handleChange} required />
                </div>
              </div>
              <button type="submit" className="btn-ledger mt-4" disabled={submitting || !form.accountId}>
                {submitting ? 'Applying…' : 'Apply & block amount'}
              </button>
            </form>
          )}
        </div>
      )}

      <div className="card-paper p-4 mb-4">
        <h2 className="font-display" style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Pending allotment</h2>
        {loading ? (
          <p style={{ color: 'var(--ink-text-muted)' }}>Loading…</p>
        ) : blockedIPOs.length === 0 ? (
          <p style={{ color: 'var(--ink-text-muted)' }}>No applications currently blocked.</p>
        ) : (
          blockedIPOs.map(renderRow)
        )}
      </div>

      {decidedIPOs.length > 0 && (
        <div className="card-paper p-4">
          <h2 className="font-display" style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Past applications</h2>
          {decidedIPOs.map(renderRow)}
        </div>
      )}

      <ConfirmDialog
        open={confirmState.open}
        title={
          confirmState.action === 'allot' ? 'Mark as allotted?' :
          confirmState.action === 'not-allot' ? 'Mark as not allotted?' : 'Cancel this application?'
        }
        message={
          confirmState.action === 'allot'
            ? `This deducts ${formatCurrency(confirmState.ipo?.amountApplied)} from the account as a real transaction.`
            : confirmState.action === 'not-allot'
            ? 'This releases the held amount back to your available balance. No money was actually spent.'
            : 'This releases the held amount and removes the application entirely.'
        }
        confirmLabel={confirmState.action === 'allot' ? 'Confirm allotted' : confirmState.action === 'not-allot' ? 'Confirm not allotted' : 'Cancel application'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmState({ open: false, ipo: null, action: null })}
      />
    </PageLayout>
  );
};

export default IPOPage;