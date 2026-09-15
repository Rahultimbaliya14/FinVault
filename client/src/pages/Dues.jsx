import { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import MonthSelector from '../components/MonthSelector';
import { fetchDues } from '../api/dues';

const formatCurrency = (amount) => `₹${Math.round(amount || 0).toLocaleString('en-IN')}`;

const TYPE_LABEL = {
  sip: 'SIP',
  emi: 'EMI',
  credit_card_bill: 'Credit Card',
  borrow_repayment: 'Repayment',
};

// Urgency drives color, not the due type - an SIP due tomorrow matters
// more right now than an EMI due in three weeks.
const getUrgency = (daysUntilDue) => {
  if (daysUntilDue === null) return 'neutral';
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 3) return 'soon';
  return 'neutral';
};

const now = new Date();
const DEFAULT_MONTH_VALUE = `${now.getFullYear()}-${now.getMonth() + 1}`;

const Dues = () => {
  const [dues, setDues] = useState([]);
  const [totalDue, setTotalDue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(DEFAULT_MONTH_VALUE);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [year, month] = selectedMonth.split('-').map(Number);
        const res = await fetchDues(month, year);
        setDues(res.data.dues);
        setTotalDue(res.data.totalDue);
      } catch (err) {
        setError('Could not load your dues.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedMonth]);

  const overdue = dues.filter((d) => getUrgency(d.daysUntilDue) === 'overdue');
  const dueSoon = dues.filter((d) => getUrgency(d.daysUntilDue) === 'soon');
  const upcoming = dues.filter((d) => getUrgency(d.daysUntilDue) === 'neutral');

  const renderGroup = (title, items, toneClass) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <h2 className="font-display" style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>{title}</h2>
        <div className="card-paper p-4">
          {items.map((due) => (
            <div className="ledger-row" key={due.refId}>
              <div>
                <div className="ledger-row-label" style={{ color: 'var(--ink-text)', fontWeight: 500 }}>
                  {due.label}
                </div>
                <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--ink-text-muted)' }}>
                  {TYPE_LABEL[due.type] || due.type}
                  {due.dueDate && ` · ${new Date(due.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                  {due.daysUntilDue !== null && due.daysUntilDue >= 0 && ` · in ${due.daysUntilDue} day${due.daysUntilDue === 1 ? '' : 's'}`}
                  {due.daysUntilDue !== null && due.daysUntilDue < 0 && ` · ${Math.abs(due.daysUntilDue)} day${Math.abs(due.daysUntilDue) === 1 ? '' : 's'} overdue`}
                </div>
              </div>
              <span className={`ledger-row-value ${toneClass}`}>{formatCurrency(due.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <PageLayout>
      <div className="mb-4 d-flex justify-content-between align-items-start flex-wrap gap-3">
        <div>
          <span className="eyebrow-tab">Dues</span>
          <h1 className="font-display mt-3" style={{ fontSize: '2rem', color: 'var(--ink-navy)' }}>
            Everything coming due
          </h1>
        </div>
        <MonthSelector value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
      </div>

      {loading ? (
        <p style={{ color: 'var(--ink-text-muted)' }}>Loading…</p>
      ) : error ? (
        <p style={{ color: 'var(--rust)' }}>{error}</p>
      ) : dues.length === 0 ? (
        <div className="card-paper p-4">
          <p style={{ color: 'var(--ink-text-muted)' }}>
            Nothing due right now. As you add SIPs, EMIs, credit cards, or borrowed money, they'll show up here sorted by date.
          </p>
        </div>
      ) : (
        <>
          <div className="p-4 mb-4" style={{ background: 'var(--ink-navy)', color: 'var(--paper)', borderRadius: '3px' }}>
            <p style={{ fontSize: '0.85rem', color: 'rgba(239,234,224,0.7)', margin: 0 }}>Total across everything due</p>
            <p className="font-display font-mono" style={{ fontSize: '2.2rem', margin: '0.2rem 0 0' }}>
              {formatCurrency(totalDue)}
            </p>
          </div>

          {renderGroup('Overdue', overdue, 'value-negative')}
          {renderGroup('Due soon (within 3 days)', dueSoon, 'value-negative')}
          {renderGroup('Upcoming', upcoming, 'value-neutral')}
        </>
      )}
    </PageLayout>
  );
};

export default Dues;