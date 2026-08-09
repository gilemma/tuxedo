import { Link, useParams } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button';
import { Pill } from '../../../shared/ui/Pill';
import { fmtDate } from '../../../shared/fmt/date';
import type { CaseWithRefs, CodeEntry } from '../../../supabase/types';
import { useCase } from '../../../shared/model/cases';

export function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const query = useCase(id);

  if (!id) return <Msg>Missing case id.</Msg>;
  if (query.isPending) return <Msg>Loading…</Msg>;
  if (query.error) return <Msg tone="error">Error: {query.error.message}</Msg>;
  if (!query.data) return <Msg>Case not found.</Msg>;

  return <View c={query.data} id={id} />;
}

function View({ c, id }: { c: CaseWithRefs; id: string }) {
  return (
    <section
      style={{
        maxWidth: 640,
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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
          Case · {c.mrn}
        </span>
        <Pill tone={c.status === 'closed' ? 'neutral' : 'green'}>{c.status}</Pill>
      </header>

      <div style={{ padding: '12px 16px' }}>
        <Row label="Coder" value={c.coder?.name ?? '—'} />
        <Row label="Fund" value={c.fund?.name ?? '—'} />
        <Row label="MRN" value={c.mrn} />
        <Row label="Episode" value={c.episode} />
        <Row label="Admit" value={fmtDate(c.admit_date)} />
        <Row label="Discharge" value={fmtDate(c.discharge_date)} />
        <Row label="DRG version" value={c.drg_version} />
        <Row label="Pre-audit DRG" value={c.drg_pre} />

        <div style={{ height: 1, background: 'var(--rule)', margin: '14px 0 6px' }} />
        <CodeList label="Diagnoses" codes={c.diagnoses_pre ?? []} />
        <CodeList label="Procedures" codes={c.procedures_pre ?? []} />

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 16,
          }}
        >
          <Link to={`/cases/${id}/edit`} style={{ textDecoration: 'none' }}>
            <Button variant="ghost" type="button">
              Edit intake
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr',
        alignItems: 'baseline',
        gap: 12,
        padding: '3px 0',
      }}
    >
      <span style={{ color: 'var(--ink-3)', fontSize: '0.85rem' }}>{label}</span>
      <span style={{ color: 'var(--ink)' }}>{value}</span>
    </div>
  );
}

function CodeList({ label, codes }: { label: string; codes: CodeEntry[] }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ color: 'var(--ink-3)', fontSize: '0.85rem', marginBottom: 4 }}>{label}</div>
      {codes.length === 0 ? (
        <div style={{ color: 'var(--ink-3)', fontSize: '0.85rem' }}>None.</div>
      ) : (
        <ol style={{ margin: 0, paddingLeft: 20, color: 'var(--ink)' }}>
          {codes.map((row, i) => (
            <li key={i} style={{ padding: '2px 0' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{row.code}</span>
              {row.description && (
                <span style={{ color: 'var(--ink-2)' }}> — {row.description}</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Msg({ children, tone }: { children: React.ReactNode; tone?: 'error' }) {
  return (
    <p
      style={{
        maxWidth: 640,
        margin: '2rem auto',
        color: tone === 'error' ? 'var(--audit-red)' : 'var(--ink-3)',
      }}
    >
      {children}
    </p>
  );
}
