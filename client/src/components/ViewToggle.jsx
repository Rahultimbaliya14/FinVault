// A simple two-option segmented control, styled to match the ledger
// theme rather than a default toggle switch. Used to flip between
// "Ledger" (rows) and "Chart" views on the dashboard.
const ViewToggle = ({ value, onChange, options }) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        border: '1px solid var(--rule-strong)',
        borderRadius: '3px',
        overflow: 'hidden',
      }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '0.4rem 0.9rem',
            fontSize: '0.82rem',
            border: 'none',
            cursor: 'pointer',
            background: value === opt.value ? 'var(--ink-navy)' : 'transparent',
            color: value === opt.value ? 'var(--paper)' : 'var(--ink-text-muted)',
            transition: 'background 0.15s ease, color 0.15s ease',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

export default ViewToggle;