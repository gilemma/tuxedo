import { Link } from 'react-router-dom';
import { useCoders } from '../model/coders';
import { useFunds } from '../model/funds';
import { useTemplates } from '../model/templates';
import { SkinPicker } from '../../../presentation/SkinPicker';

export function AdminHome() {
  const coders = useCoders();
  const funds = useFunds();
  const templates = useTemplates();

  return (
    <section
      style={{
        maxWidth: 760,
        margin: '2rem auto',
        background: 'var(--paper-2)',
        border: '1px solid var(--rule)',
        borderRadius: 4,
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <header
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--rule)',
          fontFamily: 'var(--font-display)',
          color: 'var(--ink)',
        }}
      >
        Admin
      </header>

      <p
        style={{
          padding: '10px 16px 0',
          margin: 0,
          color: 'var(--ink-3)',
          fontSize: '0.85rem',
        }}
      >
        Reference data the rest of the app draws from.
      </p>

      <ul style={{ listStyle: 'none', padding: '8px 8px 12px', margin: 0 }}>
        <Row
          label="Coders"
          to="/admin/coders"
          count={coders.data?.length}
          loading={coders.isPending}
          error={coders.error?.message}
        />
        <Row
          label="Correspondence templates"
          to="/admin/templates"
          count={templates.data?.length}
          loading={templates.isPending}
          error={templates.error?.message}
        />
        <Row
          label="Funds"
          to={undefined}
          count={funds.data?.length}
          loading={funds.isPending}
          error={funds.error?.message}
          note="edit via SQL for now"
        />
        <Row label="Contracts" to={undefined} placeholder="Later phase" />
        <Row label="Saved analyses" to={undefined} placeholder="Later phase" />
      </ul>

      <div style={{ borderTop: '1px solid var(--rule)' }}>
        <SkinPicker />
      </div>
    </section>
  );
}

function Row({
  label,
  to,
  count,
  loading,
  error,
  placeholder,
  note,
}: {
  label: string;
  to: string | undefined;
  count?: number;
  loading?: boolean;
  error?: string;
  placeholder?: string;
  note?: string;
}) {
  const right = error
    ? <span style={{ color: 'var(--audit-red)', fontSize: '0.8rem' }}>{error}</span>
    : loading
    ? <span style={{ color: 'var(--ink-3)', fontSize: '0.8rem' }}>…</span>
    : placeholder
    ? <span style={{ color: 'var(--ink-3)', fontSize: '0.8rem', fontStyle: 'italic' }}>{placeholder}</span>
    : (
        <span style={{ color: 'var(--ink-2)', fontSize: '0.9rem' }}>
          {count ?? 0}
          {note && <span style={{ color: 'var(--ink-3)', fontSize: '0.75rem', marginLeft: 8 }}>({note})</span>}
        </span>
      );

  const inner = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderBottom: '1px solid var(--rule)',
      }}
    >
      <span
        style={{
          color: to ? 'var(--ink)' : 'var(--ink-3)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.95rem',
        }}
      >
        {label}
      </span>
      {right}
    </div>
  );

  return (
    <li>
      {to ? (
        <Link
          to={to}
          style={{ textDecoration: 'none', display: 'block' }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'var(--paper-inset)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {inner}
        </Link>
      ) : (
        inner
      )}
    </li>
  );
}
