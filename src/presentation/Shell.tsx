import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { useAuth } from '../shared/hooks/useAuth';
import { BowTie } from './BowTie';
import './Shell.css';

const NAV_LINKS = [
  { to: '/ledger', label: 'Ledger' },
  { to: '/cases/new', label: 'New case' },
  { to: '/admin', label: 'Admin' },
];

export function Shell({ children }: { children: ReactNode }) {
  const { displayName } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="shell">
      <header className="shell__header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/" className="shell__brand">
            <BowTie className="shell__brand-mark" />
            <span>Tuxedo</span>
          </Link>
          <nav className="shell__nav" aria-label="Primary">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="shell__right">
          <span className="shell__user">{displayName ?? '…'}</span>
          <button
            type="button"
            className="shell__signout"
            onClick={() => supabase.auth.signOut()}
            style={{
              background: 'transparent',
              color: 'var(--shell-fg)',
              border: '1px solid var(--shell-rule)',
              borderRadius: 4,
              padding: '4px 10px',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
          <button
            type="button"
            className="shell__hamburger"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="shell-mobile-sheet"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg
              className="shell__hamburger-icon"
              viewBox="0 0 18 14"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              focusable="false"
            >
              {menuOpen ? (
                <path
                  d="M2 2 L16 12 M16 2 L2 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
              ) : (
                <path
                  d="M2 2 H16 M2 7 H16 M2 12 H16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
              )}
            </svg>
          </button>
        </div>

        <div
          id="shell-mobile-sheet"
          className="shell__sheet"
          data-open={menuOpen ? 'true' : 'false'}
        >
          <div className="shell__sheet-inner">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to}>
                {l.label}
              </NavLink>
            ))}
            <div className="shell__sheet-user">Signed in as {displayName ?? '…'}</div>
            <button type="button" onClick={() => supabase.auth.signOut()}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="shell__main">{children}</main>
    </div>
  );
}
