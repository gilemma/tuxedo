import { useState, type FormEvent } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { supabase } from './supabase/client';
import { useAuth } from './shared/hooks/useAuth';
import { Button } from './shared/ui/Button';
import { Shell } from './presentation/Shell';
import { AdminHome, CodersEditor, TemplatesEditor } from './modules/admin';
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
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/coders" element={<CodersEditor />} />
          <Route path="/admin/templates" element={<TemplatesEditor />} />
        </Routes>
      </Shell>
    </BrowserRouter>
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
