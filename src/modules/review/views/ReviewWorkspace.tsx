import { Link, useParams } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button';
import { DxPxEditor } from './DxPxEditor';

export function ReviewWorkspace() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Msg>Missing case id.</Msg>;

  return (
    <section
      style={{
        maxWidth: 720,
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
        <span style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>Review · case</span>
        <Link to={`/cases/${id}`} style={{ textDecoration: 'none' }}>
          <Button variant="ghost" type="button">
            Back to detail
          </Button>
        </Link>
      </header>

      <div style={{ padding: '12px 16px' }}>
        <DxPxEditor caseId={id} />

        <div style={{ height: 12 }} />
        <Placeholder title="Post-audit DRG" hint="Scene 05 — DRG entry + reason dropdown" />
        <Placeholder title="Financial impact" hint="Scene 06 — reimbursement pre/post + note" />
      </div>
    </section>
  );
}

function Placeholder({ title, hint }: { title: string; hint: string }) {
  return (
    <div
      style={{
        border: '1px dashed var(--rule)',
        borderRadius: 3,
        padding: '12px 14px',
        margin: '10px 0',
      }}
    >
      <div style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>{title}</div>
      <div style={{ color: 'var(--ink-3)', fontSize: '0.85rem', marginTop: 4 }}>{hint}</div>
    </div>
  );
}

function Msg({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ maxWidth: 640, margin: '2rem auto', color: 'var(--ink-3)' }}>{children}</p>
  );
}
