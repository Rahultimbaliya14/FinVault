import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Accounts', path: '/accounts' },
  { label: 'Transactions', path: '/transactions' },
  { label: 'Credit Cards', path: '/cards' },
  { label: 'SIPs & EMIs', path: '/commitments' },
  { label: 'Lending', path: '/lending' },
  { label: 'Dues', path: '/dues' },
];

// Same nav content, two behaviors:
// - Desktop (md+): a normal fixed-width column, always visible.
// - Mobile (< md): hidden by default, slides in as an overlay when
//   menuOpen is true, with a backdrop that closes it on tap.
const Sidebar = ({ user, logout, menuOpen, onClose }) => {
  return (
    <>
      {/* Backdrop - mobile only, shown behind the open drawer */}
      {menuOpen && (
        <div
          onClick={onClose}
          className="d-md-none"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(16, 27, 45, 0.5)',
            zIndex: 30,
          }}
        />
      )}

      <aside
        className={`sidebar-ledger d-flex flex-column p-4 ${menuOpen ? 'sidebar-open' : ''}`}
        style={{ width: '230px', flexShrink: 0 }}
      >
        <div className="d-flex align-items-center justify-content-between mb-5">
          <span className="font-display" style={{ fontSize: '1.4rem' }}>Cash Ledger</span>
          <button
            onClick={onClose}
            className="d-md-none"
            aria-label="Close menu"
            style={{ background: 'none', border: 'none', color: 'var(--paper)', fontSize: '1.3rem' }}
          >
            ×
          </button>
        </div>

        <nav className="flex-grow-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid rgba(239,234,224,0.1)', paddingTop: '1rem' }}>
          <p className="font-mono" style={{ fontSize: '0.75rem', color: 'rgba(239,234,224,0.5)', marginBottom: '0.6rem' }}>
            {user?.email}
          </p>
          <button
            onClick={logout}
            style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.85rem', padding: 0, cursor: 'pointer' }}
          >
            Log out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;