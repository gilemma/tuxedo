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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    if (!caseQ.data || !changesQ.data) return;

    const removed = { dx: new Map<string, string>(), px: new Map<string, string>() };
    const added: Record<Kind, AddedRow[]> = { dx: [], px: [] };
    for (const cc of changesQ.data) {
      if (cc.action === 'removed') removed[cc.kind].set(cc.code, cc.note ?? '');
      else added[cc.kind].push({ code: cc.code, note: cc.note ?? '' });
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
    setHydrated(true);
  }, [caseQ.data, changesQ.data, hydrated]);

  if (caseQ.isPending || changesQ.isPending) return <Msg>Loading…</Msg>;
  if (caseQ.error) return <Msg tone="error">Error: {caseQ.error.message}</Msg>;
  if (changesQ.error) return <Msg tone="error">Error: {changesQ.error.message}</Msg>;
  if (!caseQ.data) return <Msg>Case not found.</Msg>;

  const onSave = async () => {
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
    await replace.mutateAsync({ caseId, changes });
  };

  return (
    <div>
      <Section title="Diagnoses">
        <PreList
          rows={dxRows}
          onToggle={(i) => setDxRows(toggle(dxRows, i))}
          onNote={(i, note) => setDxRows(patch(dxRows, i, { note }))}
        />
        <Additions
          label="diagnosis"
          rows={dxAdded}
          onUpdate={(i, p) => setDxAdded(patch(dxAdded, i, p))}
          onRemove={(i) => setDxAdded(remove(dxAdded, i))}
          onAdd={() => setDxAdded([...dxAdded, { code: '', note: '' }])}
        />
      </Section>

      <div style={{ height: 12 }} />

      <Section title="Procedures">
        <PreList
          rows={pxRows}
          onToggle={(i) => setPxRows(toggle(pxRows, i))}
          onNote={(i, note) => setPxRows(patch(pxRows, i, { note }))}
        />
        <Additions
          label="procedure"
          rows={pxAdded}
          onUpdate={(i, p) => setPxAdded(patch(pxAdded, i, p))}
          onRemove={(i) => setPxAdded(remove(pxAdded, i))}
          onAdd={() => setPxAdded([...pxAdded, { code: '', note: '' }])}
        />
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
        {replace.isSuccess && (
          <span style={{ color: 'var(--ink-3)', fontSize: '0.85rem' }}>Saved.</span>
        )}
        {replace.error && (
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

function PreList({
  rows,
  onToggle,
  onNote,
}: {
  rows: PreAuditRow[];
  onToggle: (i: number) => void;
  onNote: (i: number, note: string) => void;
}) {
  if (rows.length === 0)
    return (
      <div style={{ color: 'var(--ink-3)', fontSize: '0.85rem', padding: '4px 0' }}>
        No pre-audit rows.
      </div>
    );
  return (
    <ol style={{ margin: 0, padding: '4px 0 0 0', listStyle: 'none' }}>
      {rows.map((r, i) => (
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
            <div style={{ padding: '4px 0 4px 44px' }}>
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
      ))}
    </ol>
  );
}

function Additions({
  label,
  rows,
  onUpdate,
  onRemove,
  onAdd,
}: {
  label: string;
  rows: AddedRow[];
  onUpdate: (i: number, p: Partial<AddedRow>) => void;
  onRemove: (i: number) => void;
  onAdd: () => void;
}) {
  return (
    <div style={{ marginTop: 6 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ padding: '4px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 20 }} />
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
      ))}
      <div style={{ marginTop: 4, paddingLeft: 32 }}>
        <Button type="button" variant="ghost" onClick={onAdd}>
          + Add {label}
        </Button>
      </div>
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
