// Controlled modal - the parent page owns whether it's open and what
// happens on confirm. Usage: render <ConfirmDialog /> once per page,
// then call setConfirmState({ open: true, ... }) to trigger it.
const ConfirmDialog = ({ open, title, message, confirmLabel = 'Confirm', onConfirm, onCancel }) => {
  if (!open) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(16, 27, 45, 0.55)',
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card-paper"
        style={{ maxWidth: '380px', width: '100%', padding: '1.75rem' }}
      >
        <h3 className="font-display" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          {title}
        </h3>
        <p style={{ color: 'var(--ink-text-muted)', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
          {message}
        </p>
        <div className="d-flex justify-content-end gap-2">
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: '1px solid var(--rule-strong)',
              borderRadius: '2px',
              padding: '0.5rem 1.1rem',
              color: 'var(--ink-text)',
              fontSize: '0.88rem',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              background: 'var(--rust)',
              border: '1px solid var(--rust)',
              borderRadius: '2px',
              padding: '0.5rem 1.1rem',
              color: '#fff',
              fontSize: '0.88rem',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;