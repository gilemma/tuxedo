import { useState } from 'react';
import { useCase, useUpdateCase } from '../../../shared/model/cases';
import { Button } from '../../../shared/ui/Button';
import { Pill } from '../../../shared/ui/Pill';

export function CloseCaseAction({ caseId }: { caseId: string }) {
  const caseQ = useCase(caseId);
  const update = useUpdateCase();
  const [confirming, setConfirming] = useState(false);

  if (caseQ.isPending || !caseQ.data) return null;

  const c = caseQ.data;
  const isClosed = c.status === 'closed';
  const canClose = !!c.drg_post && !!c.drg_change_reason;

  const doClose = async () => {
    await update.mutateAsync({ id: caseId, patch: { status: 'closed' } });
    setConfirming(false);
  };

  const doReopen = async () => {
    await update.mutateAsync({ id: caseId, patch: { status: 'in_review' } });
  };

  if (isClosed) {
    return (
      <Bar>
        <Pill tone="neutral">closed</Pill>
        <span style={{ color: 'var(--ink-3)', fontSize: '0.85rem', flex: 1 }}>
          Reopen to make further changes.
        </span>
        {update.error && (
          <span style={{ color: 'var(--audit-red)', fontSize: '0.85rem' }}>
            {update.error.message}
          </span>
        )}
        <Button variant="ghost" onClick={doReopen} disabled={update.isPending}>
          {update.isPending ? 'Reopening…' : 'Reopen'}
        </Button>
      </Bar>
    );
  }

  if (confirming) {
    return (
      <Bar>
        <span style={{ color: 'var(--ink)', flex: 1, fontSize: '0.9rem' }}>
          Close this case? DRG {c.drg_post} · reason {c.drg_change_reason}.
        </span>
        {update.error && (
          <span style={{ color: 'var(--audit-red)', fontSize: '0.85rem' }}>
            {update.error.message}
          </span>
        )}
        <Button variant="ghost" onClick={() => setConfirming(false)} disabled={update.isPending}>
          Cancel
        </Button>
        <Button onClick={doClose} disabled={update.isPending}>
          {update.isPending ? 'Closing…' : 'Confirm close'}
        </Button>
      </Bar>
    );
  }

  return (
    <Bar>
      <Pill tone="green">in review</Pill>
      {!canClose && (
        <span style={{ color: 'var(--ink-3)', fontSize: '0.85rem', flex: 1 }}>
          Set post-audit DRG + reason before closing.
        </span>
      )}
      {canClose && <span style={{ flex: 1 }} />}
      <Button onClick={() => setConfirming(true)} disabled={!canClose}>
        Close case
      </Button>
    </Bar>
  );
}

function Bar({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        border: '1px solid var(--rule)',
        borderRadius: 3,
        background: 'var(--paper-inset)',
      }}
    >
      {children}
    </div>
  );
}
