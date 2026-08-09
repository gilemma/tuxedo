import { useEffect, useState } from 'react';
import { useCase } from '../../../shared/model/cases';
import { Button } from '../../../shared/ui/Button';
import { Pill } from '../../../shared/ui/Pill';
import type { CodeChangeInsert } from '../../../supabase/types';
import { useCodeChanges, useReplaceCodeChanges } from '../model/code_changes';

type Kind = 'dx' | 'px';
type PreAuditRow = { code: string; description: string; action: 'keep' | 'remove'; note: string };
type AddedRow = { code: string; note: string };

export function DxPxEditor({ caseId }: { caseId: string }) {
  const caseQ = useCase(caseId);
  const changesQ = useCodeChanges(caseId);
  const replace = useReplaceCodeChanges();

  const [dxRows, setDxRows] = useState<PreAuditRow[]>([]);
  const [pxRows, setPxRows] = useState<PreAuditRow[]>([]);
  const [dxAdded, setDxAdded] = useState<AddedRow[]>([]);
  const [pxAdded, setPxAdded] = useState<AddedRow[]>([]);
  const [dxPrincipal, setDxPrincipal] = useState<string | null>(null);
  const [pxPrincipal, setPxPrincipal] = useState<string | null>(null);
  const [dxPrincipalNote, setDxPrincipalNote] = useState('');
  const [pxPrincipalNote, setPxPrincipalNote] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated) return;
    if (!caseQ.data || !changesQ.data) return;

    const removed = { dx: new Map<string, string>(), px: new Map<string, string>() };
    const added: Record<Kind, AddedRow[]> = { dx: [], px: [] };
    const principal: Record<Kind, { code: string; note: string } | null> = { dx: null, px: null };
    for (const cc of changesQ.data) {
      if (cc.action === 'removed') removed[cc.kind].set(cc.code, cc.note ?? '');
      else if (cc.action === 'added') added[cc.kind].push({ code: cc.code, note: cc.note ?? '' });
      else if (cc.action === 'made_principal')
        principal[cc.kind] = { code: cc.code, note: cc.note ?? '' };
    }

    const buildRows = (pre: { code: string; description: string }[], kind: Kind): PreAuditRow[] =>
      pre.map((e) => ({
        code: e.code,
        description: e.description,
        action: removed[kind].has(e.code) ? 'remove' : 'keep',
        note: removed[kind].get(e.code) ?? '',
      }));

    setDxRows(buildRows(caseQ.data.diagnoses_pre ?? [], 'dx'));
    setPxRows(buildRows(caseQ.data.procedures_pre ?? [], 'px'));
    setDxAdded(added.dx);
    setPxAdded(added.px);
    setDxPrincipal(principal.dx?.code ?? null);
    setPxPrincipal(principal.px?.code ?? null);
    setDxPrincipalNote(principal.dx?.note ?? '');
    setPxPrincipalNote(principal.px?.note ?? '');
    setHydrated(true);
  }, [caseQ.data, changesQ.data, hydrated]);

  if (caseQ.isPending || changesQ.isPending) return <Msg>Loading…</Msg>;
  if (caseQ.error) return <Msg tone="error">Error: {caseQ.error.message}</Msg>;
  if (changesQ.error) return <Msg tone="error">Error: {changesQ.error.message}</Msg>;
  if (!caseQ.data) return <Msg>Case not found.</Msg>;

  const validateKind = (
    kind: Kind,
    rows: PreAuditRow[],
    added: AddedRow[],
    override: string | null,
  ): string | null => {
    const anyCodes = rows.length > 0 || added.some((a) => a.code.trim());
    if (!anyCodes) return null;
    const effective = effectivePrincipal(rows, override);
    if (!effective) {
      return `Pre-audit principal ${kind} was removed — designate a new principal by clicking ★ on a kept or added row.`;
    }
    const inKept = rows.some((r) => r.code === effective && r.action === 'keep');
    const inAdded = added.some((a) => a.code.trim() === effective);
    if (!inKept && !inAdded) {
      return `Designated principal ${kind} (${effective}) isn't in the effective code set.`;
    }
    return null;
  };

  const validate = (): string | null =>
    validateKind('dx', dxRows, dxAdded, dxPrincipal) ??
    validateKind('px', pxRows, pxAdded, pxPrincipal);

  const onSave = async () => {
    setSaveError(null);
    const err = validate();
    if (err) {
      setSaveError(err);
      return;
    }
    const changes: Omit<CodeChangeInsert, 'case_id'>[] = [];

    for (const r of dxRows)
      if (r.action === 'remove')
        changes.push({ kind: 'dx', action: 'removed', code: r.code, note: r.note.trim() || null });
    for (const r of pxRows)
      if (r.action === 'remove')
        changes.push({ kind: 'px', action: 'removed', code: r.code, note: r.note.trim() || null });
    for (const a of dxAdded)
      if (a.code.trim())
        changes.push({ kind: 'dx', action: 'added', code: a.code.trim(), note: a.note.trim() || null });
    for (const a of pxAdded)
      if (a.code.trim())
        changes.push({ kind: 'px', action: 'added', code: a.code.trim(), note: a.note.trim() || null });

    const pushPrincipal = (
      kind: Kind,
      rows: PreAuditRow[],
      override: string | null,
      note: string,
    ) => {
      const pre0 = rows[0]?.code ?? null;
      const effective = effectivePrincipal(rows, override);
      if (effective && effective !== pre0) {
        changes.push({
          kind,
          action: 'made_principal',
          code: effective,
          note: note.trim() || null,
        });
      }
    };
    pushPrincipal('dx', dxRows, dxPrincipal, dxPrincipalNote);
    pushPrincipal('px', pxRows, pxPrincipal, pxPrincipalNote);

    await replace.mutateAsync({ caseId, changes });
  };

  const dxEffectivePrincipal = effectivePrincipal(dxRows, dxPrincipal);
  const pxEffectivePrincipal = effectivePrincipal(pxRows, pxPrincipal);

  const setPrincipal = (kind: Kind) => (code: string) => {
    const rows = kind === 'dx' ? dxRows : pxRows;
    const setter = kind === 'dx' ? setDxPrincipal : setPxPrincipal;
    setter(rows[0]?.code === code ? null : code);
  };

  return (
    <div>
      <Section title="Diagnoses">
        <PreList
          rows={dxRows}
          principal={dxEffectivePrincipal}
          onToggle={(i) => setDxRows(toggle(dxRows, i))}
          onNote={(i, note) => setDxRows(patch(dxRows, i, { note }))}
          onSetPrincipal={setPrincipal('dx')}
        />
        <Additions
          label="diagnosis"
          rows={dxAdded}
          principal={dxEffectivePrincipal}
          onUpdate={(i, p) => setDxAdded(patch(dxAdded, i, p))}
          onRemove={(i) => setDxAdded(remove(dxAdded, i))}
          onAdd={() => setDxAdded([...dxAdded, { code: '', note: '' }])}
          onSetPrincipal={setPrincipal('dx')}
        />
        {dxPrincipal && (
          <PrincipalNote
            kind="dx"
            newPrincipal={dxPrincipal}
            note={dxPrincipalNote}
            onNoteChange={setDxPrincipalNote}
          />
        )}
      </Section>

      <div style={{ height: 12 }} />

      <Section title="Procedures">
        <PreList
          rows={pxRows}
          principal={pxEffectivePrincipal}
          onToggle={(i) => setPxRows(toggle(pxRows, i))}
          onNote={(i, note) => setPxRows(patch(pxRows, i, { note }))}
          onSetPrincipal={setPrincipal('px')}
        />
        <Additions
          label="procedure"
          rows={pxAdded}
          principal={pxEffectivePrincipal}
          onUpdate={(i, p) => setPxAdded(patch(pxAdded, i, p))}
          onRemove={(i) => setPxAdded(remove(pxAdded, i))}
          onAdd={() => setPxAdded([...pxAdded, { code: '', note: '' }])}
          onSetPrincipal={setPrincipal('px')}
        />
        {pxPrincipal && (
          <PrincipalNote
            kind="px"
            newPrincipal={pxPrincipal}
            note={pxPrincipalNote}
            onNoteChange={setPxPrincipalNote}
          />
        )}
      </Section>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
          marginTop: 16,
          alignItems: 'center',
        }}
      >
        {saveError && (
          <span style={{ color: 'var(--audit-red)', fontSize: '0.85rem' }}>{saveError}</span>
        )}
        {!saveError && replace.isSuccess && (
          <span style={{ color: 'var(--ink-3)', fontSize: '0.85rem' }}>Saved.</span>
        )}
        {!saveError && replace.error && (
          <span style={{ color: 'var(--audit-red)', fontSize: '0.85rem' }}>
            {replace.error.message}
          </span>
        )}
        <Button type="button" onClick={onSave} disabled={replace.isPending}>
          {replace.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}

function effectivePrincipal(rows: PreAuditRow[], override: string | null): string | null {
  if (override) return override;
  const pre0 = rows[0];
  if (!pre0 || pre0.action === 'remove') return null;
  return pre0.code;
}

function toggle(rows: PreAuditRow[], i: number): PreAuditRow[] {
  const next = rows.slice();
  next[i] = { ...next[i], action: next[i].action === 'keep' ? 'remove' : 'keep' };
  return next;
}

function patch<T>(rows: T[], i: number, p: Partial<T>): T[] {
  const next = rows.slice();
  next[i] = { ...next[i], ...p };
  return next;
}

function remove<T>(rows: T[], i: number): T[] {
  const next = rows.slice();
  next.splice(i, 1);
  return next;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          color: 'var(--ink-3)',
          fontSize: '0.85rem',
          marginTop: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function PrincipalStar({
  active,
  disabled,
  onClick,
  label,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={active ? 'Principal (click pre-audit #1 to reset)' : 'Make principal'}
      style={{
        background: 'transparent',
        border: 'none',
        padding: '0 4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: active ? 'var(--tab)' : 'var(--ink-3)',
        opacity: disabled ? 0.35 : 1,
        fontSize: '1rem',
        lineHeight: 1,
      }}
    >
      {active ? '★' : '☆'}
    </button>
  );
}

function PreList({
  rows,
  principal,
  onToggle,
  onNote,
  onSetPrincipal,
}: {
  rows: PreAuditRow[];
  principal: string | null;
  onToggle: (i: number) => void;
  onNote: (i: number, note: string) => void;
  onSetPrincipal: (code: string) => void;
}) {
  if (rows.length === 0)
    return (
      <div style={{ color: 'var(--ink-3)', fontSize: '0.85rem', padding: '4px 0' }}>
        No pre-audit rows.
      </div>
    );
  return (
    <ol style={{ margin: 0, padding: '4px 0 0 0', listStyle: 'none' }}>
      {rows.map((r, i) => {
        const isPrincipal = r.code === principal && r.action === 'keep';
        return (
          <li key={i} style={{ padding: '4px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  color: 'var(--ink-3)',
                  fontSize: '0.75rem',
                  width: 20,
                  textAlign: 'right',
                }}
              >
                {i + 1}
              </span>
              <PrincipalStar
                active={isPrincipal}
                disabled={r.action === 'remove'}
                onClick={() => onSetPrincipal(r.code)}
                label={isPrincipal ? `${r.code} is principal` : `Make ${r.code} principal`}
              />
              <span
                style={{
                  color: r.action === 'remove' ? 'var(--ink-3)' : 'var(--ink)',
                  textDecoration: r.action === 'remove' ? 'line-through' : 'none',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  minWidth: 110,
                }}
              >
                {r.code}
              </span>
              <span
                style={{
                  color: r.action === 'remove' ? 'var(--ink-3)' : 'var(--ink-2)',
                  flex: 1,
                  fontSize: '0.85rem',
                }}
              >
                {r.description}
              </span>
              <button
                type="button"
                onClick={() => onToggle(i)}
                aria-label={`Toggle ${r.code} between keep and remove`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                <Pill tone={r.action === 'remove' ? 'red' : 'neutral'}>
                  {r.action === 'remove' ? 'remove' : 'keep'}
                </Pill>
              </button>
            </div>
            {r.action === 'remove' && (
              <div style={{ padding: '4px 0 4px 56px' }}>
                <input
                  aria-label={`Note for removed ${r.code}`}
                  value={r.note}
                  onChange={(e) => onNote(i, e.target.value)}
                  placeholder="note (optional) — evidence / rationale"
                  style={{ ...cellStyle(), width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Additions({
  label,
  rows,
  principal,
  onUpdate,
  onRemove,
  onAdd,
  onSetPrincipal,
}: {
  label: string;
  rows: AddedRow[];
  principal: string | null;
  onUpdate: (i: number, p: Partial<AddedRow>) => void;
  onRemove: (i: number) => void;
  onAdd: () => void;
  onSetPrincipal: (code: string) => void;
}) {
  return (
    <div style={{ marginTop: 6 }}>
      {rows.map((r, i) => {
        const trimmed = r.code.trim();
        const isPrincipal = !!trimmed && trimmed === principal;
        return (
          <div key={i} style={{ padding: '4px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 20 }} />
              <PrincipalStar
                active={isPrincipal}
                disabled={!trimmed}
                onClick={() => trimmed && onSetPrincipal(trimmed)}
                label={
                  isPrincipal
                    ? `${trimmed} is principal`
                    : trimmed
                    ? `Make ${trimmed} principal`
                    : 'Enter a code first'
                }
              />
              <Pill tone="green">+ add</Pill>
              <input
                aria-label={`Added ${label} code ${i + 1}`}
                value={r.code}
                onChange={(e) => onUpdate(i, { code: e.target.value })}
                placeholder="code"
                style={{ ...cellStyle(), width: 130, fontFamily: 'var(--font-mono)' }}
              />
              <input
                aria-label={`Added ${label} note ${i + 1}`}
                value={r.note}
                onChange={(e) => onUpdate(i, { note: e.target.value })}
                placeholder="note (optional)"
                style={{ ...cellStyle(), flex: 1 }}
              />
              <Button type="button" variant="ghost" onClick={() => onRemove(i)}>
                ✕
              </Button>
            </div>
          </div>
        );
      })}
      <div style={{ marginTop: 4, paddingLeft: 52 }}>
        <Button type="button" variant="ghost" onClick={onAdd}>
          + Add {label}
        </Button>
      </div>
    </div>
  );
}

function PrincipalNote({
  kind,
  newPrincipal,
  note,
  onNoteChange,
}: {
  kind: Kind;
  newPrincipal: string;
  note: string;
  onNoteChange: (v: string) => void;
}) {
  return (
    <div
      style={{
        marginTop: 8,
        padding: '8px 10px',
        border: '1px solid var(--rule)',
        borderRadius: 3,
        background: 'var(--paper-inset)',
      }}
    >
      <div style={{ color: 'var(--ink-3)', fontSize: '0.8rem', marginBottom: 4 }}>
        Principal {kind} reassigned → {newPrincipal}
      </div>
      <input
        aria-label={`Reason for ${kind} principal reassignment`}
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="reason (optional)"
        style={{ ...cellStyle(), width: '100%', boxSizing: 'border-box' }}
      />
    </div>
  );
}

function Msg({ children, tone }: { children: React.ReactNode; tone?: 'error' }) {
  return (
    <p
      style={{
        margin: '1rem 0',
        color: tone === 'error' ? 'var(--audit-red)' : 'var(--ink-3)',
      }}
    >
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
