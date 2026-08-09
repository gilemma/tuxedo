import { useState, type FormEvent } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { supabase } from './supabase/client';
import { useAuth } from './shared/hooks/useAuth';
import { Button } from './shared/ui/Button';
import { CodersEditor } from './modules/admin';
import { NewCase, EditCase, CaseDetail } from './modules/intake';
import { CaseLedger, Dashboard } from './modules/ledger';
import { ReviewWorkspace } from './modules/review';

export default function App() {
  const { session, loading } = useAuth();

  if (loading) return <main style={{ padding: '2rem' }}>Loading…</main>;
  if (!session) return <SignIn />;

  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ledger" element={<CaseLedger />} />
          <Route path="/cases/new" element={<NewCase />} />
          <Route path="/cases/:id" element={<CaseDetail />} />
          <Route path="/cases/:id/edit" element={<EditCase />} />
          <Route path="/cases/:id/review" element={<ReviewWorkspace />} />
          <Route path="/admin/coders" element={<CodersEditor />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { displayName } = useAuth();
  return (
    <div style={{ minHeight: '100vh' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          borderBottom: '1px solid var(--rule)',
          background: 'var(--paper-2)',
        }}
      >
        <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link to="/" style={{ color: 'var(--ink)', textDecoration: 'none', fontFamily: 'var(--font-display)' }}>
            Tuxedo
          </Link>
          <Link to="/ledger" style={{ color: 'var(--ink-2)', textDecoration: 'none', fontSize: '0.9rem' }}>
            Ledger
          </Link>
          <Link to="/cases/new" style={{ color: 'var(--ink-2)', textDecoration: 'none', fontSize: '0.9rem' }}>
            New case
          </Link>
          <Link to="/admin/coders" style={{ color: 'var(--ink-2)', textDecoration: 'none', fontSize: '0.9rem' }}>
            Coders
          </Link>
        </nav>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ color: 'var(--ink-3)', fontSize: '0.9rem' }}>{displayName ?? '…'}</span>
          <Button variant="ghost" onClick={() => supabase.auth.signOut()}>
            Sign out
          </Button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setBusy(false);
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'var(--font-body)', maxWidth: 320, margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>Sign in</h2>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '6px 8px', border: '1px solid var(--rule)', background: 'var(--paper-inset)', color: 'var(--ink)' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '6px 8px', border: '1px solid var(--rule)', background: 'var(--paper-inset)', color: 'var(--ink)' }}
        />
        <Button type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      {error && <p style={{ color: 'var(--audit-red)' }}>{error}</p>}
    </main>
  );
}
