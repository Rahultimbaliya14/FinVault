// Shared visual shell for Login and Register. Dark ink panel on the left
// carries the brand and the one deliberate animated moment (a hand-drawn
// ledger line); the form itself always sits on plain paper on the right
// so the eye has a calm place to actually fill things in.
const AuthLayout = ({ eyebrow, title, tagline, children }) => {
  return (
    <div className="d-flex flex-column flex-md-row" style={{ minHeight: '100vh' }}>
      {/* Full brand panel - desktop and tablet only */}
      <div
        className="d-none d-md-flex flex-column justify-content-between p-5"
        style={{ background: 'var(--ink-navy)', color: 'var(--paper)', width: '42%' }}
      >
        <div>
          <span className="eyebrow-tab">{eyebrow}</span>
          <h1 className="font-display mt-4" style={{ fontSize: '2.6rem', lineHeight: 1.15 }}>
            {title}
          </h1>
          <p className="mt-3" style={{ color: 'rgba(239,234,224,0.7)', maxWidth: '340px' }}>
            {tagline}
          </p>
        </div>

        <svg width="100%" height="120" viewBox="0 0 400 120" fill="none">
          <path
            className="ink-line-path"
            d="M10 90 C 80 20, 140 110, 210 60 S 340 10, 390 50"
            stroke="var(--gold)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        <p className="font-mono" style={{ fontSize: '0.75rem', color: 'rgba(239,234,224,0.4)' }}>
          FinVault — every rupee, accounted for.
        </p>
      </div>

      {/* Compact header - mobile only, replaces the hidden panel so the brand doesn't just vanish */}
      <div
        className="d-flex d-md-none align-items-center justify-content-between px-4 py-3"
        style={{ background: 'var(--ink-navy)', color: 'var(--paper)' }}
      >
        <span className="font-display" style={{ fontSize: '1.2rem' }}>Cash Ledger</span>
        <span className="eyebrow-tab">{eyebrow}</span>
      </div>

      <div
        className="d-flex align-items-center justify-content-center flex-grow-1"
        style={{ background: 'var(--paper)' }}
      >
        <div style={{ width: '100%', maxWidth: '380px', padding: '2rem' }}>{children}</div>
      </div>
    </div>
  );
};

export default AuthLayout;