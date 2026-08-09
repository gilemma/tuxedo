import { useEffect, useState } from 'react';
import { useCase, useUpdateCase } from '../../../shared/model/cases';
import { Button } from '../../../shared/ui/Button';
import { DRG_CHANGE_REASONS, type DrgChangeReason } from '../../../supabase/types';

const REASON_LABEL: Record<DrgChangeReason, string> = {
  adrg_change: 'Change of ADRG',
  split_change: 'Change of split',
  px_change_no_drg_shift: 'Px change (no DRG shift)',
  dx_change_only_no_drg_shift: 'Dx change only (no DRG shift)',
  no_change: 'No change',
};

export function DrgEntry({ caseId }: { caseId: string }) {
  const caseQ = useCase(caseId);
  const update = useUpdateCase();

  const [drgPost, setDrgPost] = useState('');
  const [reason, setReason] = useState<DrgChangeReason | ''>('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hydrated || !caseQ.data) return;
    setDrgPost(caseQ.data.drg_post ?? '');
    setReason(caseQ.data.drg_change_reason ?? '');
    setHydrated(true);
  }, [caseQ.data, hydrated]);

  if (caseQ.isPending) return <Msg>Loading…</Msg>;
  if (caseQ.error) return <Msg tone="error">Error: {caseQ.error.message}</Msg>;
  if (!caseQ.data) return <Msg>Case not found.</Msg>;

  const onSave = () =>
    update.mutateAsync({
      id: caseId,
      patch: {
        drg_post: drgPost.trim() || null,
        drg_change_reason: reason || null,
      },
    });

  return (
    <div>
      <Row label="Pre-audit DRG" value={caseQ.data.drg_pre} mono />
      <Field label="Post-audit DRG">
        <input
          aria-label="Post-audit DRG"
          value={drgPost}
          onChange={(e) => setDrgPost(e.target.value)}
          placeholder="e.g. F62B"
          style={{ ...cellStyle(), width: 180, fontFamily: 'var(--font-mono)' }}
        />
      </Field>
      <Field label="Reason">
        <select
          aria-label="DRG change reason"
          value={reason}
          onChange={(e) => setReason(e.target.value as DrgChangeReason | '')}
          style={{ ...cellStyle(), width: 300 }}
        >
          <option value="">—</option>
          {DRG_CHANGE_REASONS.map((r) => (
            <option key={r} value={r}>
              {REASON_LABEL[r]}
            </option>
          ))}
        </select>
      </Field>

      <SaveBar
        isPending={update.isPending}
        isSuccess={update.isSuccess}
        error={update.error?.message ?? null}
        onSave={onSave}
      />
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '150px 1fr',
        alignItems: 'baseline',
        padding: '4px 0',
      }}
    >
      <span style={{ color: 'var(--ink-3)', fontSize: '0.85rem' }}>{label}</span>
      <span
        style={{
          color: 'var(--ink)',
          fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
          fontSize: '0.9rem',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '150px 1fr',
        alignItems: 'center',
        padding: '4px 0',
      }}
    >
      <span style={{ color: 'var(--ink-3)', fontSize: '0.85rem' }}>{label}</span>
      <div>{children}</div>
    </div>
  );
}

function SaveBar({
  isPending,
  isSuccess,
  error,
  onSave,
}: {
  isPending: boolean;
  isSuccess: boolean;
  error: string | null;
  onSave: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 12,
        alignItems: 'center',
      }}
    >
      {error && <span style={{ color: 'var(--audit-red)', fontSize: '0.85rem' }}>{error}</span>}
      {!error && isSuccess && (
        <span style={{ color: 'var(--ink-3)', fontSize: '0.85rem' }}>Saved.</span>
      )}
      <Button type="button" onClick={onSave} disabled={isPending}>
        {isPending ? 'Saving…' : 'Save'}
      </Button>
    </div>
  );
}

function Msg({ children, tone }: { children: React.ReactNode; tone?: 'error' }) {
  return (
    <p style={{ margin: '1rem 0', color: tone === 'error' ? 'var(--audit-red)' : 'var(--ink-3)' }}>
      {children}
    </p>
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
