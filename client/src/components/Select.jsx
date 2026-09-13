import { useState, useRef, useEffect } from 'react';

// Replaces the native <select> entirely so the OPEN dropdown list can
// actually be styled to match the app - native <select> option lists
// are rendered by the OS/browser and can't be skinned with CSS.
//
// Mimics the native select's onChange shape ({ target: { name, value } })
// so existing handleChange(e) functions across the app don't need to change.
const Select = ({ name, value, onChange, options, placeholder = 'Select…' }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find((opt) => opt.value === value);

  const handleSelect = (optValue) => {
    onChange({ target: { name, value: optValue } });
    setOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input-ledger"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          background: 'transparent',
        }}
      >
        <span style={{ color: selected ? 'var(--ink-text)' : 'var(--ink-text-muted)' }}>
          {selected ? selected.label : placeholder}
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--ink-text-muted)', marginLeft: '0.5rem' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div
          className="card-paper"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 50,
            maxHeight: '220px',
            overflowY: 'auto',
            boxShadow: '0 4px 14px rgba(16,27,45,0.15)',
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              style={{
                padding: '0.55rem 0.9rem',
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: opt.value === value ? 'var(--emerald-soft)' : 'transparent',
                color: opt.value === value ? 'var(--emerald)' : 'var(--ink-text)',
              }}
              onMouseEnter={(e) => {
                if (opt.value !== value) e.currentTarget.style.background = 'rgba(16,27,45,0.04)';
              }}
              onMouseLeave={(e) => {
                if (opt.value !== value) e.currentTarget.style.background = 'transparent';
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Select;