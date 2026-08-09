import { useEffect, useState } from 'react';
import { useCase, useUpdateCase } from '../../../shared/model/cases';
import { Button } from '../../../shared/ui/Button';
import { Pill } from '../../../shared/ui/Pill';
import { fmtDelta } from '../../../shared/fmt/currency';

export function ImpactForm({ caseId }: { caseId: string }) {
  const caseQ = useCase(caseId);
  const update = useUpdateCase();

  const [pre, setPre] = useState('');
  const [post, setPost] = useState('');
  const [note, setNote] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated || !caseQ.data) return;
    setPre(caseQ.data.reimbursement_pre?.toString() ?? '');
    setPost(caseQ.data.reimbursement_post?.toString() ?? '');
    setNote(caseQ.data.impact_note ?? '');
    setHydrated(true);
  }, [caseQ.data, hydrated]);

  if (caseQ.isPending) return <Msg>Loading…</Msg>;
  if (caseQ.error) return <Msg tone="error">Error: {caseQ.error.message}</Msg>;
  if (!caseQ.data) return <Msg>Case not found.</Msg>;

  const parseNum = (s: string): number | null | 'invalid' => {
    const trimmed = s.trim();
    if (trimmed === '') return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : 'invalid';
  };

  const preN = parseNum(pre);
  const postN = parseNum(post);
  const delta =
    typeof preN === 'number' && typeof postN === 'number' ? postN - preN : null;
  const deltaFmt = fmtDelta(delta);

  const onSave = async () => {
    setSaveError(null);
    if (preN === 'invalid' || postN === 'invalid') {
      setSaveError('Reimbursement values must be numbers.');
      return;
    }
    await update.mutateAsync({
      id: caseId,
      patch: {
        reimbursement_pre: preN,
        reimbursement_post: postN,
        impact_note: note.trim() || null,
      },
    });
  };

  return (
    <div>
      <Field label="Pre-audit reimbursement">
        <span style={{ color: 'var(--ink-3)', marginRight: 6 }}>$</span>
        <input
          aria-label="Pre-audit reimbursement"
          value={pre}
          onChange={(e) => setPre(e.target.value)}
          placeholder="0.00"
          inputMode="decimal"
          style={{ ...cellStyle(), width: 140, textAlign: 'right' }}
        />
      </Field>
      <Field label="Post-audit reimbursement">
        <span style={{ color: 'var(--ink-3)', marginRight: 6 }}>$</span>
        <input
          aria-label="Post-audit reimbursement"
          value={post}
          onChange={(e) => setPost(e.target.value)}
          placeholder="0.00"
          inputMode="decimal"
          style={{ ...cellStyle(), width: 140, textAlign: 'right' }}
        />
      </Field>
      <Field label="Impact (post − pre)">
        <Pill tone={deltaFmt.tone === 'neutral' ? 'neutral' : deltaFmt.tone}>{deltaFmt.text}</Pill>
        <span style={{ color: 'var(--ink-3)', fontSize: '0.8rem', marginLeft: 10 }}>
          auto · persisted by DB on save
        </span>
      </Field>
      <Field label="Note (optional)">
        <textarea
          aria-label="Impact note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="contract version, overrides, etc."
          style={{ ...cellStyle(), width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
        />
      </Field>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
          marginTop: 12,
          alignItems: 'center',
        }}
      >
        {saveError && (
          <span style={{ color: 'var(--audit-red)', fontSize: '0.85rem' }}>{saveError}</span>
        )}
        {!saveError && update.isSuccess && (
          <span style={{ color: 'var(--ink-3)', fontSize: '0.85rem' }}>Saved.</span>
        )}
        {!saveError && update.error && (
          <span style={{ color: 'var(--audit-red)', fontSize: '0.85rem' }}>
            {update.error.message}
          </span>
        )}
        <Button type="button" onClick={onSave} disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '180px 1fr',
        alignItems: 'center',
        padding: '4px 0',
      }}
    >
      <span style={{ color: 'var(--ink-3)', fontSize: '0.85rem' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center' }}>{children}</div>
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
