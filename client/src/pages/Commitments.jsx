import { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { fetchSIPs, createSIP, deleteSIP } from '../api/sips';
import { fetchEMIs, createEMI, deleteEMI } from '../api/emis';
import { fetchAccounts } from '../api/accounts';

const formatCurrency = (amount) => `₹${Math.round(amount || 0).toLocaleString('en-IN')}`;

const EMPTY_SIP_FORM = { sipName: '', amount: '', frequency: 'monthly', sipDate: '', accountId: '' };
const EMPTY_EMI_FORM = {
  loanName: '', principalAmount: '', emiAmount: '', interestRate: '',
  startDate: '', endDate: '', numberOfInstallments: '', dueDate: '', accountId: '',
};

const Commitments = () => {
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [sips, setSips] = useState([]);
  const [emis, setEmis] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showSipForm, setShowSipForm] = useState(false);
  const [sipForm, setSipForm] = useState(EMPTY_SIP_FORM);
  const [submittingSip, setSubmittingSip] = useState(false);

  const [showEmiForm, setShowEmiForm] = useState(false);
  const [emiForm, setEmiForm] = useState(EMPTY_EMI_FORM);
  const [submittingEmi, setSubmittingEmi] = useState(false);

  const [confirmState, setConfirmState] = useState({ open: false, type: null, id: null });

  const loadAll = async () => {
    try {
      const [sipRes, emiRes, accRes] = await Promise.all([fetchSIPs(), fetchEMIs(), fetchAccounts()]);
      setSips(sipRes.data.sips);
      setEmis(emiRes.data.emis);
      setAccounts(accRes.data.accounts);
    } catch (err) {
      showToast('Could not load your commitments.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddSip = async (e) => {
    e.preventDefault();
    setSubmittingSip(true);
    try {
      await createSIP({ ...sipForm, amount: Number(sipForm.amount), sipDate: Number(sipForm.sipDate) });
      setSipForm(EMPTY_SIP_FORM);
      setShowSipForm(false);
      loadAll();
      showToast('SIP added', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not add SIP.', 'error');
    } finally {
      setSubmittingSip(false);
    }
  };

  const handleAddEmi = async (e) => {
    e.preventDefault();
    setSubmittingEmi(true);
    try {
      await createEMI({
        ...emiForm,
        principalAmount: Number(emiForm.principalAmount),
        emiAmount: Number(emiForm.emiAmount),
        interestRate: Number(emiForm.interestRate) || 0,
        numberOfInstallments: Number(emiForm.numberOfInstallments),
        dueDate: Number(emiForm.dueDate),
      });
      setEmiForm(EMPTY_EMI_FORM);
      setShowEmiForm(false);
      loadAll();
      showToast('EMI added', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not add EMI.', 'error');
    } finally {
      setSubmittingEmi(false);
    }
  };

  const handleConfirmDelete = async () => {
    const { type, id } = confirmState;
    try {
      if (type === 'sip') await deleteSIP(id);
      if (type === 'emi') await deleteEMI(id);
      loadAll();
      showToast(`${type === 'sip' ? 'SIP' : 'EMI'} removed`, 'success');
    } catch (err) {
      showToast('Could not remove this item.', 'error');
    } finally {
      setConfirmState({ open: false, type: null, id: null });
    }
  };

  const noAccounts = accounts.length === 0;

  return (
    <PageLayout>
      <div className="mb-4">
        <span className="eyebrow-tab">Commitments</span>
        <h1 className="font-display mt-3" style={{ fontSize: '2rem', color: 'var(--ink-navy)' }}>
          SIPs & EMIs
        </h1>
      </div>

      {noAccounts && !loading && (
        <div className="font-mono mb-4" style={{ background: 'var(--rust-soft)', color: 'var(--rust)', padding: '0.6rem 0.8rem', borderRadius: '2px', fontSize: '0.85rem' }}>
          Add a bank account first — SIPs and EMIs need one to debit from.
        </div>
      )}

      {/* ---- SIPs ---- */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="font-display" style={{ fontSize: '1.25rem' }}>Systematic Investments (SIPs)</h2>
        <button className="btn-ledger" onClick={() => setShowSipForm(!showSipForm)} disabled={noAccounts}>
          {showSipForm ? 'Cancel' : '+ Add SIP'}
        </button>
      </div>

      {showSipForm && (
        <div className="card-paper p-4 mb-4">
          <form onSubmit={handleAddSip}>
            <div className="row g-3">
              <div className="col-md-6">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>SIP name</label>
                <input className="input-ledger" value={sipForm.sipName} onChange={(e) => setSipForm({ ...sipForm, sipName: e.target.value })} required />
              </div>
              <div className="col-md-6">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Amount</label>
                <input type="number" className="input-ledger" value={sipForm.amount} onChange={(e) => setSipForm({ ...sipForm, amount: e.target.value })} required min="0" />
              </div>
              <div className="col-md-4">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Debit date (day of month)</label>
                <input type="number" min="1" max="31" className="input-ledger" value={sipForm.sipDate} onChange={(e) => setSipForm({ ...sipForm, sipDate: e.target.value })} required />
              </div>
              <div className="col-md-4">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Frequency</label>
                <select className="input-ledger" value={sipForm.frequency} onChange={(e) => setSipForm({ ...sipForm, frequency: e.target.value })}>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="col-md-4">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Debit account</label>
                <select className="input-ledger" value={sipForm.accountId} onChange={(e) => setSipForm({ ...sipForm, accountId: e.target.value })} required>
                  <option value="">Select account</option>
                  {accounts.map((a) => <option key={a._id} value={a._id}>{a.bankName} — {a.accountName}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="btn-ledger mt-4" disabled={submittingSip}>
              {submittingSip ? 'Adding…' : 'Add SIP'}
            </button>
          </form>
        </div>
      )}

      <div className="card-paper p-4 mb-5">
        {loading ? (
          <p style={{ color: 'var(--ink-text-muted)' }}>Loading…</p>
        ) : sips.length === 0 ? (
          <p style={{ color: 'var(--ink-text-muted)' }}>No SIPs added yet.</p>
        ) : (
          sips.map((sip) => (
            <div className="ledger-row" key={sip._id}>
              <div>
                <div className="ledger-row-label" style={{ color: 'var(--ink-text)', fontWeight: 500 }}>{sip.sipName}</div>
                <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--ink-text-muted)' }}>
                  Next due {new Date(sip.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  {' · '}{sip.frequency}
                </div>
              </div>
              <div className="d-flex align-items-center gap-3">
                <span className="ledger-row-value value-negative">{formatCurrency(sip.amount)}</span>
                <button onClick={() => setConfirmState({ open: true, type: 'sip', id: sip._id })} style={{ background: 'none', border: 'none', color: 'var(--rust)', fontSize: '0.8rem', cursor: 'pointer' }}>
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ---- EMIs ---- */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="font-display" style={{ fontSize: '1.25rem' }}>Loan EMIs</h2>
        <button className="btn-ledger" onClick={() => setShowEmiForm(!showEmiForm)} disabled={noAccounts}>
          {showEmiForm ? 'Cancel' : '+ Add EMI'}
        </button>
      </div>

      {showEmiForm && (
        <div className="card-paper p-4 mb-4">
          <form onSubmit={handleAddEmi}>
            <div className="row g-3">
              <div className="col-md-6">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Loan name</label>
                <input className="input-ledger" value={emiForm.loanName} onChange={(e) => setEmiForm({ ...emiForm, loanName: e.target.value })} required />
              </div>
              <div className="col-md-6">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Principal amount</label>
                <input type="number" className="input-ledger" value={emiForm.principalAmount} onChange={(e) => setEmiForm({ ...emiForm, principalAmount: e.target.value })} required min="0" />
              </div>
              <div className="col-md-4">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>EMI amount</label>
                <input type="number" className="input-ledger" value={emiForm.emiAmount} onChange={(e) => setEmiForm({ ...emiForm, emiAmount: e.target.value })} required min="0" />
              </div>
              <div className="col-md-4">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Interest rate (%)</label>
                <input type="number" step="0.1" className="input-ledger" value={emiForm.interestRate} onChange={(e) => setEmiForm({ ...emiForm, interestRate: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Due date (day of month)</label>
                <input type="number" min="1" max="31" className="input-ledger" value={emiForm.dueDate} onChange={(e) => setEmiForm({ ...emiForm, dueDate: e.target.value })} required />
              </div>
              <div className="col-md-4">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Start date</label>
                <input type="date" className="input-ledger" value={emiForm.startDate} onChange={(e) => setEmiForm({ ...emiForm, startDate: e.target.value })} required />
              </div>
              <div className="col-md-4">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>End date</label>
                <input type="date" className="input-ledger" value={emiForm.endDate} onChange={(e) => setEmiForm({ ...emiForm, endDate: e.target.value })} required />
              </div>
              <div className="col-md-4">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Number of installments</label>
                <input type="number" className="input-ledger" value={emiForm.numberOfInstallments} onChange={(e) => setEmiForm({ ...emiForm, numberOfInstallments: e.target.value })} required min="1" />
              </div>
              <div className="col-md-6">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Debit account</label>
                <select className="input-ledger" value={emiForm.accountId} onChange={(e) => setEmiForm({ ...emiForm, accountId: e.target.value })} required>
                  <option value="">Select account</option>
                  {accounts.map((a) => <option key={a._id} value={a._id}>{a.bankName} — {a.accountName}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="btn-ledger mt-4" disabled={submittingEmi}>
              {submittingEmi ? 'Adding…' : 'Add EMI'}
            </button>
          </form>
        </div>
      )}

      <div className="card-paper p-4">
        {loading ? (
          <p style={{ color: 'var(--ink-text-muted)' }}>Loading…</p>
        ) : emis.length === 0 ? (
          <p style={{ color: 'var(--ink-text-muted)' }}>No EMIs added yet.</p>
        ) : (
          emis.map((emi) => (
            <div className="ledger-row" key={emi._id}>
              <div>
                <div className="ledger-row-label" style={{ color: 'var(--ink-text)', fontWeight: 500 }}>{emi.loanName}</div>
                <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--ink-text-muted)' }}>
                  Next due {new Date(emi.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  {' · '}{emi.interestRate}% interest
                </div>
              </div>
              <div className="d-flex align-items-center gap-3">
                <span className="ledger-row-value value-negative">{formatCurrency(emi.emiAmount)}</span>
                <button onClick={() => setConfirmState({ open: true, type: 'emi', id: emi._id })} style={{ background: 'none', border: 'none', color: 'var(--rust)', fontSize: '0.8rem', cursor: 'pointer' }}>
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={confirmState.open}
        title={`Remove this ${confirmState.type === 'sip' ? 'SIP' : 'EMI'}?`}
        message="This stops it from appearing in your upcoming dues and monthly commitments."
        confirmLabel="Remove"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ open: false, type: null, id: null })}
      />
    </PageLayout>
  );
};

export default Commitments;