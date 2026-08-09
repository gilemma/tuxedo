import { useNavigate, useParams } from 'react-router-dom';
import { CaseForm } from './CaseForm';
import { useCase, useUpdateCase } from '../../../shared/model/cases';
import type { CaseInsert } from '../../../supabase/types';

export function EditCase() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const query = useCase(id);
  const update = useUpdateCase();

  if (!id) return <Message>Missing case id.</Message>;
  if (query.isPending) return <Message>Loading…</Message>;
  if (query.error) return <Message tone="error">Error: {query.error.message}</Message>;
  if (!query.data) return <Message>Case not found.</Message>;

  const c = query.data;
  const initial: CaseInsert = {
    coder_id: c.coder_id,
    fund_id: c.fund_id,
    mrn: c.mrn,
    episode: c.episode,
    admit_date: c.admit_date,
    discharge_date: c.discharge_date,
    drg_version: c.drg_version,
    drg_pre: c.drg_pre,
    diagnoses_pre: c.diagnoses_pre ?? [],
    procedures_pre: c.procedures_pre ?? [],
  };

  return (
    <CaseForm
      title={`Edit case · ${c.mrn}`}
      initial={initial}
      submitLabel="Save changes"
      busy={update.isPending}
      onCancel={() => navigate(`/cases/${id}`)}
      onSubmit={async (payload) => {
        await update.mutateAsync({ id, patch: payload });
        navigate(`/cases/${id}`);
      }}
    />
  );
}

function Message({ children, tone }: { children: React.ReactNode; tone?: 'error' }) {
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
