import { useNavigate } from 'react-router-dom';
import { CaseForm } from './CaseForm';
import { useCreateCase } from '../model/cases';

export function NewCase() {
  const create = useCreateCase();
  const navigate = useNavigate();

  return (
    <CaseForm
      title="New audit case"
      submitLabel="Save case"
      busy={create.isPending}
      onSubmit={async (payload) => {
        const created = await create.mutateAsync(payload);
        navigate(`/cases/${created.id}`);
      }}
    />
  );
}
