import { useState, useEffect, type FormEvent } from 'react';
import { createClient, type Session } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  const supabase = createClient(url, key);
  // 1. Listen for auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch display_name when user is authenticated (id = auth.uid())
  useEffect(() => {
    if (!session?.user) return;
    const userId = session.user.id;
    supabase.from('profiles').select('display_name').eq('id', userId).single()
      .then(({ data, error }) => {
        if (error) console.error('Error fetching profile:', error);
        else if (data) setDisplayName(data.display_name);
      });
  }, [session]);

  // 3. Handle email/password sign-in
  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };
  // 4. Render welcome page post-sign-in
  if (session) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1>Hello, {displayName ?? 'Loading...'}</h1>
        <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
      </main>
    );
  }

  // 5. Render sign-in form
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '320px' }}>
      <h2>Sign In</h2>
      <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </main>
  );
}