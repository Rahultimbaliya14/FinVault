import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer,
  PieChart, Pie, Legend,
} from 'recharts';

const formatCurrency = (amount) => `₹${Math.round(amount || 0).toLocaleString('en-IN')}`;

const COLORS = {
  positive: '#1F6F54',
  negative: '#A23B2E',
  neutral: '#101B2D',
  soon: '#A23B2E',
  gold: '#B98F3D',
};

const CATEGORY_PALETTE = ['#101B2D', '#1F6F54', '#B98F3D', '#A23B2E', '#6b6455', '#3d5a73', '#8a6d3b', '#7a3b33'];

// A custom tooltip so the popup matches the ledger's paper/ink theme
// instead of recharts' default white box.
const LedgerTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: 'var(--ink-navy)', color: 'var(--paper)', padding: '0.5rem 0.8rem', borderRadius: '3px', fontSize: '0.82rem' }}>
      <div style={{ marginBottom: '0.2rem', opacity: 0.7 }}>{label}</div>
      <div className="font-mono">{formatCurrency(payload[0].value)}</div>
    </div>
  );
};

// ---- Position overview: horizontal bar chart, one bar per metric ----
export const PositionChart = ({ rows }) => {
  const data = rows.map((r) => ({ name: r.label, value: r.value, tone: r.tone }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--rule)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--ink-text-muted)' }} tickFormatter={(v) => `₹${v / 1000}k`} />
        <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: 'var(--ink-text-muted)' }} />
        <Tooltip content={<LedgerTooltip />} cursor={{ fill: 'rgba(16,27,45,0.04)' }} />
        <Bar dataKey="value" radius={[0, 3, 3, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={COLORS[entry.tone] || COLORS.neutral} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

// ---- Upcoming dues: vertical bar chart, colored by urgency ----
export const DuesChart = ({ dues }) => {
  const data = dues.slice(0, 8).map((d) => ({
    name: d.label.length > 12 ? d.label.slice(0, 12) + '…' : d.label,
    value: d.amount,
    urgent: d.daysUntilDue !== null && d.daysUntilDue <= 3,
  }));

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--rule)" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--ink-text-muted)' }} angle={-25} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--ink-text-muted)' }} tickFormatter={(v) => `₹${v / 1000}k`} />
        <Tooltip content={<LedgerTooltip />} cursor={{ fill: 'rgba(16,27,45,0.04)' }} />
        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.urgent ? COLORS.negative : COLORS.gold} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

// ---- Category spend: donut chart ----
export const CategoryChart = ({ categoryData }) => {
  const data = Object.entries(categoryData).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value,
  }));

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={2}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip content={<LedgerTooltip />} />
        <Legend
          formatter={(value) => <span style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)', textTransform: 'capitalize' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// ---- High-level overview: one donut showing the big picture -----------
// Available funds vs. everything already committed, out of your total
// bank balance. This is the "describe everything in one glance" chart.
export const OverviewChart = ({ availableFunds, totalPlannedCommitments }) => {
  const safeAvailable = Math.max(availableFunds, 0);
  const data = [
    { name: 'Available', value: safeAvailable },
    { name: 'Committed', value: totalPlannedCommitments },
  ];

  if (safeAvailable === 0 && totalPlannedCommitments === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
          <Cell fill={COLORS.positive} />
          <Cell fill={COLORS.negative} />
        </Pie>
        <Tooltip content={<LedgerTooltip />} />
        <Legend
          formatter={(value) => <span style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// ---- Recent transactions: bar chart by date, colored by in/out ----
export const TransactionsChart = ({ transactions }) => {
  const CREDIT_TYPES = ['income', 'refund'];
  const data = [...transactions]
    .slice(0, 8)
    .reverse()
    .map((tx) => ({
      name: new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      value: tx.amount,
      credit: CREDIT_TYPES.includes(tx.type),
      label: tx.description || tx.category,
    }));

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--rule)" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--ink-text-muted)' }} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--ink-text-muted)' }} tickFormatter={(v) => `₹${v}`} />
        <Tooltip content={<LedgerTooltip />} cursor={{ fill: 'rgba(16,27,45,0.04)' }} />
        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.credit ? COLORS.positive : COLORS.negative} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};