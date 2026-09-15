import { useState, useEffect } from 'react';
import { fetchDashboard } from '../api/dashboard';
import { fetchDues } from '../api/dues';
import PageLayout from '../components/PageLayout';
import ViewToggle from '../components/ViewToggle';
import MonthSelector from '../components/MonthSelector';
import { PositionChart, DuesChart, CategoryChart, OverviewChart, TransactionsChart } from '../components/DashboardCharts';

const formatCurrency = (amount) => `₹${Math.round(amount || 0).toLocaleString('en-IN')}`;

const now = new Date();
const DEFAULT_MONTH_VALUE = `${now.getFullYear()}-${now.getMonth() + 1}`;

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('ledger'); // 'ledger' | 'chart'
  const [duesMonth, setDuesMonth] = useState(DEFAULT_MONTH_VALUE);
  const [duesOverride, setDuesOverride] = useState(null); // null = use the dashboard's own current-month dues
  const [duesLoading, setDuesLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchDashboard();
        setData(res.data);
      } catch (err) {
        setError('Could not load your dashboard. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Only fetch separately when the user picks a month OTHER than the
  // current one - the main dashboard call already gives us this month's
  // dues for free, no need to refetch that.
  useEffect(() => {
    if (duesMonth === DEFAULT_MONTH_VALUE) {
      setDuesOverride(null);
      return;
    }
    const loadDuesForMonth = async () => {
      setDuesLoading(true);
      try {
        const [year, month] = duesMonth.split('-').map(Number);
        const res = await fetchDues(month, year);
        setDuesOverride(res.data.dues);
      } catch (err) {
        setDuesOverride([]);
      } finally {
        setDuesLoading(false);
      }
    };
    loadDuesForMonth();
  }, [duesMonth]);

  if (loading) {
    return (
      <PageLayout>
        <p className="font-mono" style={{ color: 'var(--ink-text-muted)' }}>Opening your ledger…</p>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <p style={{ color: 'var(--rust)' }}>{error}</p>
      </PageLayout>
    );
  }

  const {
    totalBankBalance,
    totalMonthlyIncome,
    totalMonthlyExpenses,
    totalPlannedCommitments,
    creditCardOutstanding,
    moneyToReceive,
    moneyToPay,
    availableFunds,
    categoryWiseExpenses,
    upcomingDues,
    recentTransactions,
    insights,
  } = data;

  const positionRows = [
    { label: 'Total bank balance', value: totalBankBalance, tone: 'neutral' },
    { label: "This month's income", value: totalMonthlyIncome, tone: 'positive' },
    { label: "This month's expenses", value: totalMonthlyExpenses, tone: 'negative' },
    { label: 'Planned commitments', value: totalPlannedCommitments, tone: 'negative' },
    { label: 'Credit card outstanding', value: creditCardOutstanding, tone: 'negative' },
    { label: 'Money to receive', value: moneyToReceive, tone: 'positive' },
    { label: 'Money to pay', value: moneyToPay, tone: 'negative' },
  ];

  return (
    <PageLayout>
      <div className="mb-5">
          <span className="eyebrow-tab">Available now</span>
          <h1 className="font-display font-mono mt-3" style={{ fontSize: '3rem', color: 'var(--ink-navy)' }}>
            {formatCurrency(availableFunds)}
          </h1>
          <p style={{ color: 'var(--ink-text-muted)' }}>
            What's left after every commitment you already owe.
          </p>
        </div>

        <div className="d-flex justify-content-end mb-3">
          <ViewToggle
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'ledger', label: 'Ledger' },
              { value: 'chart', label: 'Chart' },
            ]}
          />
        </div>

        {/* High-level summary chart - one glance at everything, chart mode only */}
        {viewMode === 'chart' && (
          <div className="card-paper p-4 mb-4">
            <h2 className="font-display" style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>
              Overview
            </h2>
            <p style={{ color: 'var(--ink-text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              How much of your money is free to spend versus already spoken for.
            </p>
            <OverviewChart availableFunds={availableFunds} totalPlannedCommitments={totalPlannedCommitments} />
          </div>
        )}

        <div className="row g-4">
          {/* Financial position */}
          <div className="col-lg-6">
            <div className="card-paper p-4">
              <h2 className="font-display" style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>
                Your position
              </h2>
              {viewMode === 'chart' ? (
                <PositionChart rows={positionRows} />
              ) : (
                positionRows.map((row, i) => (
                  <div
                    className="ledger-row write-in"
                    key={row.label}
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <span className="ledger-row-label">{row.label}</span>
                    <span className={`ledger-row-value value-${row.tone}`}>
                      {formatCurrency(row.value)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming dues */}
          <div className="col-lg-6">
            <div className="card-paper p-4">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <h2 className="font-display" style={{ fontSize: '1.15rem', margin: 0 }}>
                  Upcoming dues
                </h2>
                <MonthSelector value={duesMonth} onChange={(e) => setDuesMonth(e.target.value)} />
              </div>
              {(() => {
                const displayedDues = duesOverride !== null ? duesOverride : upcomingDues;
                if (duesLoading) {
                  return <p style={{ color: 'var(--ink-text-muted)', fontSize: '0.9rem' }}>Loading…</p>;
                }
                if (!displayedDues || displayedDues.length === 0) {
                  return <p style={{ color: 'var(--ink-text-muted)', fontSize: '0.9rem' }}>Nothing due. Clean slate.</p>;
                }
                return viewMode === 'chart' ? (
                  <DuesChart dues={displayedDues} />
                ) : (
                  displayedDues.slice(0, 7).map((due, i) => (
                    <div className="ledger-row write-in" key={due.refId} style={{ animationDelay: `${i * 0.06}s` }}>
                      <div>
                        <div className="ledger-row-label">{due.label}</div>
                        <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--ink-text-muted)' }}>
                          {due.dueDate ? new Date(due.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No date set'}
                        </div>
                      </div>
                      <span className="ledger-row-value value-negative">{formatCurrency(due.amount)}</span>
                    </div>
                  ))
                );
              })()}
            </div>
          </div>

          {/* Insights */}
          {insights && insights.length > 0 && (
            <div className="col-12">
              <div className="p-4" style={{ background: 'var(--ink-navy)', color: 'var(--paper)', borderRadius: '3px' }}>
                <h2 className="font-display" style={{ fontSize: '1.1rem', marginBottom: '0.8rem' }}>Notes on your ledger</h2>
                <ul style={{ paddingLeft: '1.1rem', margin: 0 }}>
                  {insights.map((line, i) => (
                    <li key={i} style={{ marginBottom: '0.4rem', color: 'rgba(239,234,224,0.85)', fontSize: '0.92rem' }}>
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Category breakdown */}
          <div className="col-lg-6">
            <div className="card-paper p-4">
              <h2 className="font-display" style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>
                Spending by category
              </h2>
              {categoryWiseExpenses && Object.keys(categoryWiseExpenses).length > 0 ? (
                viewMode === 'chart' ? (
                  <CategoryChart categoryData={categoryWiseExpenses} />
                ) : (
                  Object.entries(categoryWiseExpenses)
                    .sort((a, b) => b[1] - a[1])
                    .map(([category, amount], i) => (
                      <div className="ledger-row write-in" key={category} style={{ animationDelay: `${i * 0.06}s` }}>
                        <span className="ledger-row-label text-capitalize">{category.replace('_', ' ')}</span>
                        <span className="ledger-row-value value-neutral">{formatCurrency(amount)}</span>
                      </div>
                    ))
                )
              ) : (
                <p style={{ color: 'var(--ink-text-muted)', fontSize: '0.9rem' }}>Nothing logged this month yet.</p>
              )}
            </div>
          </div>

          {/* Recent transactions */}
          <div className="col-lg-6">
            <div className="card-paper p-4">
              <h2 className="font-display" style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>
                Recent entries
              </h2>
              {recentTransactions && recentTransactions.length > 0 ? (
                viewMode === 'chart' ? (
                  <TransactionsChart transactions={recentTransactions} />
                ) : (
                  recentTransactions.slice(0, 7).map((tx, i) => (
                    <div className="ledger-row write-in" key={tx._id} style={{ animationDelay: `${i * 0.06}s` }}>
                      <div>
                        <div className="ledger-row-label">{tx.description || tx.category}</div>
                        <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--ink-text-muted)' }}>
                          {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      <span className="ledger-row-value value-neutral">{formatCurrency(tx.amount)}</span>
                    </div>
                  ))
                )
              ) : (
                <p style={{ color: 'var(--ink-text-muted)', fontSize: '0.9rem' }}>No transactions recorded yet.</p>
              )}
            </div>
          </div>
        </div>
    </PageLayout>
  );
};

export default Dashboard;