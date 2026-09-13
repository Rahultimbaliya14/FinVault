import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

// Every authenticated page (Accounts, Transactions, Cards, etc.) wraps
// its content in this so the sidebar/mobile-menu behavior lives in
// exactly one place instead of being copy-pasted per page.
const PageLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="d-flex flex-column flex-md-row" style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <div
        className="d-flex d-md-none align-items-center justify-content-between px-4 py-3"
        style={{ background: 'var(--ink-navy)', color: 'var(--paper)', position: 'sticky', top: 0, zIndex: 20 }}
      >
        <span className="font-display" style={{ fontSize: '1.2rem' }}>FinVault</span>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          style={{ background: 'none', border: '1px solid rgba(239,234,224,0.3)', borderRadius: '3px', color: 'var(--paper)', padding: '0.35rem 0.6rem' }}
        >
          ☰ Menu
        </button>
      </div>

      <Sidebar user={user} logout={logout} menuOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="flex-grow-1 p-4 p-md-5" style={{ maxWidth: '1000px' }}>
        {children}
      </main>
    </div>
  );
};

export default PageLayout;