import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pill } from '../../../shared/ui/Pill';
import { fmtDate } from '../../../shared/fmt/date';
import { useCoders } from '../../admin';
import { useCasesList, type CaseFilters } from '../model/cases';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'in_review', label: 'In review' },
  { value: 'closed', label: 'Closed' },
];

const EMPTY_FILTERS: CaseFilters = {
  search: '',
  status: '',
  coderId: '',
  from: '',
  to: '',
};

export function CaseLedger() {
  const [filters, setFilters] = useState<CaseFilters>(EMPTY_FILTERS);
  const coders = useCoders();
  const cases = useCasesList(filters);

  const set = <K extends keyof CaseFilters>(k: K, v: CaseFilters[K]) =>
    setFilters((f) => ({ ...f, [k]: v }));

  const hasFilters =
    filters.search || filters.status || filters.coderId || filters.from || filters.to;

  return (
    <section
      style={{
        maxWidth: 960,
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
        Case ledger
      </header>

      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--rule)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <input
          type="search"
          placeholder="Search MRN or episode"
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
          style={{ ...cellStyle(), minWidth: 200, flex: '1 1 200px' }}
        />
        <select
          value={filters.status}
          onChange={(e) => set('status', e.target.value)}
          style={cellStyle()}
          aria-label="Status filter"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={filters.coderId}
          onChange={(e) => set('coderId', e.target.value)}
          disabled={coders.isPending}
          style={cellStyle()}
          aria-label="Coder filter"
        >
          <option value="">All coders</option>
          {coders.data?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => set('from', e.target.value)}
          aria-label="Audit date from"
          style={cellStyle()}
        />
        <span style={{ color: 'var(--ink-3)', fontSize: '0.85rem' }}>→</span>
        <input
          type="date"
          value={filters.to}
          onChange={(e) => set('to', e.target.value)}
          aria-label="Audit date to"
          style={cellStyle()}
        />
        {hasFilters && (
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTERS)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ink-blue)',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Clear
          </button>
        )}
      </div>

      <div style={{ padding: '4px 16px 12px' }}>
        {cases.isPending && <p style={{ color: 'var(--ink-3)' }}>Loading…</p>}
        {cases.error && (
          <p style={{ color: 'var(--audit-red)' }}>Error: {cases.error.message}</p>
        )}
        {cases.data && cases.data.length === 0 && (
          <p style={{ color: 'var(--ink-3)' }}>No cases match those filters.</p>
        )}
        {cases.data && cases.data.length > 0 && (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.9rem',
            }}
          >
            <thead>
              <tr>
                <Th>Episode</Th>
                <Th>MRN</Th>
                <Th>Coder</Th>
                <Th>Fund</Th>
                <Th>Admit</Th>
                <Th>Audit</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {cases.data.map((c) => (
                <tr key={c.id} style={{ borderTop: '1px solid var(--rule)' }}>
                  <Td>
                    <Link
                      to={`/cases/${c.id}`}
                      style={{ color: 'var(--ink-blue)', textDecoration: 'none' }}
                    >
                      {c.episode}
                    </Link>
                  </Td>
                  <Td>{c.mrn}</Td>
                  <Td>{c.coder?.name ?? '—'}</Td>
                  <Td>{c.fund?.name ?? '—'}</Td>
                  <Td>{fmtDate(c.admit_date)}</Td>
                  <Td>{fmtDate(c.audit_date)}</Td>
                  <Td>
                    <Pill tone={c.status === 'closed' ? 'neutral' : 'green'}>
                      {c.status}
                    </Pill>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: 'left',
        padding: '8px 6px',
        color: 'var(--ink-3)',
        fontWeight: 500,
        fontSize: '0.8rem',
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        borderBottom: '1px solid var(--rule-2)',
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td style={{ padding: '8px 6px', color: 'var(--ink)' }}>{children}</td>
  );
}

function cellStyle(): React.CSSProperties {
  return {
    background: 'var(--paper-inset)',
    color: 'var(--ink)',
    border: '1px solid var(--rule)',
    borderRadius: 3,
    padding: '5px 8px',
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
  };
}
