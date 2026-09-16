import { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import ReportMonthPicker from '../components/ReportMonthPicker';
import { fetchReport } from '../api/reports';

const formatCurrency = (amount) => `₹${Math.round(amount || 0).toLocaleString('en-IN')}`;
const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_COLORS = {
  paid: 'var(--emerald)',
  skipped: 'var(--ink-text-muted)',
  pending: 'var(--rust)',
  open: 'var(--rust)',
  billed: 'var(--rust)',
  overdue: 'var(--rust)',
};

const now = new Date();

const Reports = () => {
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchReport(month, year);
        setReport(res.data.report);
      } catch (err) {
        setError('Could not generate the report for this period.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [month, year]);

  const Section = ({ title, children }) => (
    <div className="card-paper p-4 mb-4">
      <h2 className="font-display" style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--ink-navy)' }}>
        {title}
      </h2>
      {children}
    </div>
  );

  const EmptyNote = ({ children }) => (
    <p style={{ color: 'var(--ink-text-muted)', fontSize: '0.88rem', margin: 0 }}>{children}</p>
  );

  return (
    <PageLayout>
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4 no-print">
        <div>
          <span className="eyebrow-tab">Reports</span>
          <h1 className="font-display mt-3" style={{ fontSize: '2rem', color: 'var(--ink-navy)' }}>
            Monthly report
          </h1>
        </div>
        <div className="d-flex align-items-center gap-2">
          <ReportMonthPicker month={month} year={year} onChangeMonth={setMonth} onChangeYear={setYear} />
          {report && (
            <button className="btn-ledger" onClick={() => window.print()}>
              Print / Save PDF
            </button>
          )}
        </div>
      </div>

      {loading && <p style={{ color: 'var(--ink-text-muted)' }}>Generating report…</p>}
      {error && <p style={{ color: 'var(--rust)' }}>{error}</p>}

      {report && !loading && (
        <div id="report-printable">
          {/* Report header - shows in the printed output too */}
          <div className="mb-4">
            <p className="font-mono" style={{ color: 'var(--ink-text-muted)', fontSize: '0.8rem', margin: 0 }}>
              FINVAULT — FINANCIAL REPORT
            </p>
            <h1 className="font-display" style={{ fontSize: '2.2rem', color: 'var(--ink-navy)', margin: '0.2rem 0' }}>
              {report.period.label}
            </h1>
          </div>

          {/* Summary */}
          <Section title="Summary">
            <div className="ledger-row">
              <span className="ledger-row-label">Total income</span>
              <span className="ledger-row-value value-positive">{formatCurrency(report.summary.totalIncome)}</span>
            </div>
            <div className="ledger-row">
              <span className="ledger-row-label">Total expenses</span>
              <span className="ledger-row-value value-negative">{formatCurrency(report.summary.totalExpenses)}</span>
            </div>
            <div className="ledger-row">
              <span className="ledger-row-label">Net savings</span>
              <span className={`ledger-row-value ${report.summary.netSavings >= 0 ? 'value-positive' : 'value-negative'}`}>
                {formatCurrency(report.summary.netSavings)}
              </span>
            </div>
            <div className="ledger-row">
              <span className="ledger-row-label">Total bank balance (current)</span>
              <span className="ledger-row-value value-neutral">{formatCurrency(report.summary.totalBankBalance)}</span>
            </div>
            <div className="ledger-row">
              <span className="ledger-row-label">Transactions recorded</span>
              <span className="ledger-row-value value-neutral">{report.summary.transactionCount}</span>
            </div>
          </Section>

          {/* Category breakdown */}
          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <div className="card-paper p-4 h-100">
                <h2 className="font-display" style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--ink-navy)' }}>
                  Expenses by category
                </h2>
                {Object.keys(report.expenseCategoryBreakdown).length === 0 ? (
                  <EmptyNote>No expenses recorded this month.</EmptyNote>
                ) : (
                  Object.entries(report.expenseCategoryBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([category, amount]) => (
                      <div className="ledger-row" key={category}>
                        <span className="ledger-row-label text-capitalize">{category.replace('_', ' ')}</span>
                        <span className="ledger-row-value value-negative">{formatCurrency(amount)}</span>
                      </div>
                    ))
                )}
              </div>
            </div>
            <div className="col-md-6">
              <div className="card-paper p-4 h-100">
                <h2 className="font-display" style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--ink-navy)' }}>
                  Income by category
                </h2>
                {Object.keys(report.incomeCategoryBreakdown).length === 0 ? (
                  <EmptyNote>No income recorded this month.</EmptyNote>
                ) : (
                  Object.entries(report.incomeCategoryBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([category, amount]) => (
                      <div className="ledger-row" key={category}>
                        <span className="ledger-row-label text-capitalize">{category.replace('_', ' ')}</span>
                        <span className="ledger-row-value value-positive">{formatCurrency(amount)}</span>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          {/* SIPs */}
          <Section title="SIPs this month">
            {report.sips.length === 0 ? (
              <EmptyNote>No active SIPs.</EmptyNote>
            ) : (
              report.sips.map((sip, i) => (
                <div className="ledger-row" key={i}>
                  <div>
                    <div className="ledger-row-label" style={{ color: 'var(--ink-text)', fontWeight: 500 }}>{sip.name}</div>
                    <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--ink-text-muted)' }}>
                      {formatDate(sip.dueDate)}
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <span className="ledger-row-value value-neutral">{formatCurrency(sip.amount)}</span>
                    <span className="font-mono text-capitalize" style={{ fontSize: '0.78rem', color: STATUS_COLORS[sip.status], fontWeight: 600 }}>
                      {sip.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </Section>

          {/* EMIs */}
          <Section title="EMIs this month">
            {report.emis.length === 0 ? (
              <EmptyNote>No active EMIs.</EmptyNote>
            ) : (
              report.emis.map((emi, i) => (
                <div className="ledger-row" key={i}>
                  <div>
                    <div className="ledger-row-label" style={{ color: 'var(--ink-text)', fontWeight: 500 }}>{emi.name}</div>
                    <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--ink-text-muted)' }}>
                      {formatDate(emi.dueDate)}
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <span className="ledger-row-value value-neutral">{formatCurrency(emi.amount)}</span>
                    <span className="font-mono text-capitalize" style={{ fontSize: '0.78rem', color: STATUS_COLORS[emi.status], fontWeight: 600 }}>
                      {emi.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </Section>

          {/* Credit card bills */}
          <Section title="Credit card bills due this month">
            {report.creditCardBills.length === 0 ? (
              <EmptyNote>No credit card bills due this month.</EmptyNote>
            ) : (
              report.creditCardBills.map((bill, i) => (
                <div className="ledger-row" key={i}>
                  <div>
                    <div className="ledger-row-label" style={{ color: 'var(--ink-text)', fontWeight: 500 }}>{bill.cardName}</div>
                    <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--ink-text-muted)' }}>
                      {formatDate(bill.periodStart)} – {formatDate(bill.periodEnd)} · Due {formatDate(bill.dueDate)}
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <span className="ledger-row-value value-negative">{formatCurrency(bill.amount)}</span>
                    <span className="font-mono text-capitalize" style={{ fontSize: '0.78rem', color: STATUS_COLORS[bill.status], fontWeight: 600 }}>
                      {bill.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </Section>

          {/* Lending & Borrowing */}
          <Section title="Lending & borrowing activity">
            <div className="ledger-row">
              <span className="ledger-row-label">Repayments received (money lent, coming back)</span>
              <span className="ledger-row-value value-positive">{formatCurrency(report.lendingBorrowing.repaymentsReceived)}</span>
            </div>
            <div className="ledger-row">
              <span className="ledger-row-label">Repayments paid (money borrowed, paid back)</span>
              <span className="ledger-row-value value-negative">{formatCurrency(report.lendingBorrowing.repaymentsPaid)}</span>
            </div>
            {report.lendingBorrowing.newRecords.length > 0 && (
              <>
                <p style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--ink-text-muted)' }}>
                  New records created this month:
                </p>
                {report.lendingBorrowing.newRecords.map((record, i) => (
                  <div className="ledger-row" key={i}>
                    <span className="ledger-row-label">
                      {record.type === 'lend' ? `Lent to ${record.personName}` : `Borrowed from ${record.personName}`}
                    </span>
                    <span className={`ledger-row-value ${record.type === 'lend' ? 'value-positive' : 'value-negative'}`}>
                      {formatCurrency(record.amount)}
                    </span>
                  </div>
                ))}
              </>
            )}
          </Section>

          {/* All transactions */}
          <Section title="All transactions this month">
            {report.transactions.length === 0 ? (
              <EmptyNote>No transactions recorded this month.</EmptyNote>
            ) : (
              report.transactions.map((tx) => (
                <div className="ledger-row" key={tx._id}>
                  <div>
                    <div className="ledger-row-label" style={{ color: 'var(--ink-text)', fontWeight: 500 }}>
                      {tx.description || tx.category}
                    </div>
                    <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--ink-text-muted)' }}>
                      {formatDate(tx.date)} · {tx.type.replace('_', ' ')}
                    </div>
                  </div>
                  <span
                    className={`ledger-row-value ${
                      ['income', 'refund', 'transfer_in'].includes(tx.type) ? 'value-positive' : 'value-negative'
                    }`}
                  >
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))
            )}
          </Section>

          <p className="font-mono no-print" style={{ fontSize: '0.75rem', color: 'var(--ink-text-muted)', textAlign: 'center', marginTop: '2rem' }}>
            Generated by FinVault (https://rahultimbaliya14.github.io/FinVault/) on {formatDate(new Date())}
          </p>
        </div>
      )}
    </PageLayout>
  );
};

export default Reports;