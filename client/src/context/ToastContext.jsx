import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

// Any component can call showToast('Account added', 'success') from
// anywhere in the app - no need to pass state up/down through props.
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-dismiss after 3.5s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
          maxWidth: '340px',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="toast-ledger"
            onClick={() => dismissToast(toast.id)}
            style={{
              background: toast.type === 'error' ? 'var(--rust)' : 'var(--ink-navy)',
              color: 'var(--paper)',
              padding: '0.8rem 1.1rem',
              borderRadius: '2px',
              fontSize: '0.88rem',
              cursor: 'pointer',
              borderLeft: `3px solid ${toast.type === 'error' ? 'var(--rust-soft)' : 'var(--gold)'}`,
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};