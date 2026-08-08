import { Link } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button';
import { Pill } from '../../../shared/ui/Pill';
import { fmtDate } from '../../../shared/fmt/date';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useCaseStats } from '../model/stats';
import { useCasesList } from '../model/cases';

export function Dashboard() {
  const { displayName } = useAuth();
  const stats = useCaseStats();
  const recent = useCasesList();

  return (
    <section style={{ maxWidth: 720, margin: '2rem auto', padding: '0 16px' }}>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--ink)',
          margin: '0 0 20px',
        }}
      >
        Hello, {displayName ?? '…'}
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatTile label="Open" value={stats.data?.open} pending={stats.isPending} error={stats.error} />
        <StatTile label="Closed" value={stats.data?.closed} pending={stats.isPending} error={stats.error} />
        <StatTile label="This week" value={stats.data?.thisWeek} pending={stats.isPending} error={stats.error} />
      </div>

      <div
        style={{
          background: 'var(--paper-2)',
          border: '1px solid var(--rule)',
          borderRadius: 4,
          boxShadow: 'var(--shadow-md)',
          marginBottom: 20,
        }}
      >
        <header
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--rule)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: 'var(--ink-3)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Recent
          </span>
          <Link to="/ledger" style={{ color: 'var(--ink-blue)', fontSize: '0.85rem', textDecoration: 'none' }}>
            All cases →
          </Link>
        </header>
        <div style={{ padding: '4px 16px 12px' }}>
          {recent.isPending && <p style={{ color: 'var(--ink-3)' }}>Loading…</p>}
          {recent.error && <p style={{ color: 'var(--audit-red)' }}>Error: {recent.error.message}</p>}
          {recent.data && recent.data.length === 0 && (
            <p style={{ color: 'var(--ink-3)' }}>No cases yet.</p>
          )}
          {recent.data?.slice(0, 5).map((c) => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderTop: '1px solid var(--rule)',
              }}
            >
              <div>
                <Link
                  to={`/cases/${c.id}`}
                  style={{ color: 'var(--ink-blue)', textDecoration: 'none' }}
                >
                  #{c.episode}
                </Link>
                <span style={{ color: 'var(--ink-3)', fontSize: '0.85rem', marginLeft: 8 }}>
                  {c.coder?.name ?? '—'} · {fmtDate(c.audit_date)}
                </span>
              </div>
              <Pill tone={c.status === 'closed' ? 'neutral' : 'green'}>{c.status}</Pill>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link to="/cases/new" style={{ textDecoration: 'none' }}>
          <Button type="button">New case</Button>
        </Link>
        <Link to="/ledger" style={{ textDecoration: 'none' }}>
          <Button type="button" variant="ghost">Ledger</Button>
        </Link>
        <Link to="/admin/coders" style={{ textDecoration: 'none' }}>
          <Button type="button" variant="ghost">Coders</Button>
        </Link>
      </div>
    </section>
  );
}

function StatTile({
  label,
  value,
  pending,
  error,
}: {
  label: string;
  value: number | undefined;
  pending: boolean;
  error: unknown;
}) {
  return (
    <div
      style={{
        background: 'var(--paper-2)',
        border: '1px solid var(--rule)',
        borderRadius: 4,
        padding: '14px 16px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          color: 'var(--ink-3)',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.75rem',
          color: error ? 'var(--audit-red)' : 'var(--ink)',
          marginTop: 4,
        }}
      >
        {error ? '—' : pending ? '…' : value ?? 0}
      </div>
    </div>
  );
}
