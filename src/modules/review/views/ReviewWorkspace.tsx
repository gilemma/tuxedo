import { Link, useParams } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button';
import { CloseCaseAction } from './CloseCaseAction';
import { DrgEntry } from './DrgEntry';
import { DxPxEditor } from './DxPxEditor';
import { ImpactForm } from './ImpactForm';

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
        <Divider />
        <DrgEntry caseId={id} />
        <Divider />
        <ImpactForm caseId={id} />
        <Divider />
        <CloseCaseAction caseId={id} />
      </div>
    </section>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--rule)', margin: '18px 0' }} />;
}

function Msg({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ maxWidth: 640, margin: '2rem auto', color: 'var(--ink-3)' }}>{children}</p>
  );
}
