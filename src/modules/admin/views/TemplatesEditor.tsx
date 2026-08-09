import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '../../../shared/ui/Button';
import { Field } from '../../../shared/ui/Field';
import { Pill } from '../../../shared/ui/Pill';
import { TOKENS, render, type Token, type RenderContext } from '../../../shared/token';
import type { Template } from '../../../supabase/types';
import {
  useCaseChanges,
  useCreateTemplate,
  useDeleteTemplate,
  useRecentPreviewCases,
  useTemplates,
  useUpdateTemplate,
  type PreviewCaseRow,
} from '../model/templates';

export function TemplatesEditor() {
  const templates = useTemplates();
  const create = useCreateTemplate();

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError('Name is required.');
      return;
    }
    try {
      await create.mutateAsync({
        name: name.trim(),
        subject: subject.trim(),
        body,
      });
      setName('');
      setSubject('');
      setBody('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <section
      style={{
        maxWidth: 760,
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
          fontFamily: 'var(--font-display)',
          color: 'var(--ink)',
        }}
      >
        Templates
      </header>

      <div style={{ padding: '12px 16px' }}>
        {templates.isPending && <p style={{ color: 'var(--ink-3)' }}>Loading…</p>}
        {templates.error && (
          <p style={{ color: 'var(--audit-red)' }}>Error: {templates.error.message}</p>
        )}
        {templates.data?.length === 0 && (
          <p style={{ color: 'var(--ink-3)' }}>No templates yet. Add the first one below.</p>
        )}
        {templates.data?.map((t) => <TemplateRow key={t.id} template={t} />)}
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--rule)' }}>
        <div style={{ color: 'var(--ink-3)', fontSize: '0.85rem', marginBottom: 6 }}>
          New template
        </div>
        <form onSubmit={onSave}>
          <Field
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Field
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <BodyField value={body} onChange={setBody} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Saving…' : 'Save template'}
            </Button>
          </div>
          {formError && (
            <p style={{ color: 'var(--audit-red)', marginTop: 8 }}>{formError}</p>
          )}
        </form>
      </div>
    </section>
  );
}

function TemplateRow({ template }: { template: Template }) {
  const [editing, setEditing] = useState(false);

  if (editing) return <TemplateRowEdit template={template} onDone={() => setEditing(false)} />;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 0',
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ color: 'var(--ink)' }}>{template.name}</div>
        {template.subject && (
          <div
            style={{
              color: 'var(--ink-3)',
              fontSize: '0.8rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {template.subject}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button variant="ghost" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </div>
    </div>
  );
}

type CaretTarget = { field: 'subject' | 'body'; pos: number };

function TemplateRowEdit({ template, onDone }: { template: Template; onDone: () => void }) {
  const update = useUpdateTemplate();
  const del = useDeleteTemplate();
  const [name, setName] = useState(template.name);
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [caret, setCaret] = useState<CaretTarget>({ field: 'body', pos: template.body.length });

  const insertToken = (token: Token) => {
    const marker = `{{${token}}}`;
    if (caret.field === 'subject') {
      const next = insertAt(subject, marker, Math.min(caret.pos, subject.length));
      setSubject(next);
      setCaret({ field: 'subject', pos: Math.min(caret.pos, subject.length) + marker.length });
    } else {
      const next = insertAt(body, marker, Math.min(caret.pos, body.length));
      setBody(next);
      setCaret({ field: 'body', pos: Math.min(caret.pos, body.length) + marker.length });
    }
  };

  const trackCaret = (field: 'subject' | 'body') =>
    (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const el = e.currentTarget;
      setCaret({ field, pos: el.selectionStart ?? el.value.length });
    };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    try {
      await update.mutateAsync({
        id: template.id,
        patch: { name: name.trim(), subject, body },
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const onDelete = async () => {
    if (!confirm(`Delete template "${template.name}"? This cannot be undone.`)) return;
    setError(null);
    try {
      await del.mutateAsync(template.id);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <form
      onSubmit={onSave}
      style={{
        padding: '10px 12px',
        margin: '4px 0',
        background: 'var(--paper-inset)',
        border: '1px solid var(--rule)',
        borderRadius: 3,
      }}
    >
      <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Field
        label="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        onFocus={trackCaret('subject')}
        onSelect={trackCaret('subject')}
        onKeyUp={trackCaret('subject')}
        onClick={trackCaret('subject')}
      />
      <BodyField
        value={body}
        onChange={setBody}
        onFocus={trackCaret('body')}
        onSelect={trackCaret('body')}
        onKeyUp={trackCaret('body')}
        onClick={trackCaret('body')}
      />

      <TokenPalette
        onPick={insertToken}
        hint={`Inserting into: ${caret.field}`}
      />

      {preview && (
        <PreviewPanel subject={subject} body={body} onClose={() => setPreview(false)} />
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          marginTop: 12,
        }}
      >
        <Button
          type="button"
          variant="ghost"
          onClick={onDelete}
          disabled={del.isPending}
          style={{ color: 'var(--audit-red)' }}
        >
          Delete
        </Button>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="button" variant="ghost" onClick={() => setPreview((p) => !p)}>
            {preview ? 'Hide preview' : 'Preview on case'}
          </Button>
          <Button type="button" variant="ghost" onClick={onDone} disabled={update.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
      {error && <p style={{ color: 'var(--audit-red)', marginTop: 8 }}>{error}</p>}
    </form>
  );
}

function BodyField({
  value,
  onChange,
  onFocus,
  onSelect,
  onKeyUp,
  onClick,
}: {
  value: string;
  onChange: (v: string) => void;
  onFocus?: React.FocusEventHandler<HTMLTextAreaElement>;
  onSelect?: React.ReactEventHandler<HTMLTextAreaElement>;
  onKeyUp?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  onClick?: React.MouseEventHandler<HTMLTextAreaElement>;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr',
        alignItems: 'start',
        gap: 12,
        padding: '4px 0',
      }}
    >
      <label style={{ color: 'var(--ink-3)', fontSize: '0.85rem', paddingTop: 6 }}>Body</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onSelect={onSelect}
        onKeyUp={onKeyUp}
        onClick={onClick}
        rows={8}
        style={{
          background: 'var(--paper-inset)',
          color: 'var(--ink)',
          border: '1px solid var(--rule)',
          borderRadius: 3,
          padding: '6px 8px',
          fontFamily: 'var(--font-body)',
          fontSize: '0.9rem',
          resize: 'vertical',
          minHeight: 120,
        }}
      />
    </div>
  );
}

function TokenPalette({ onPick, hint }: { onPick: (t: Token) => void; hint?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 4,
        padding: '6px 0',
        alignItems: 'center',
      }}
    >
      <span style={{ color: 'var(--ink-3)', fontSize: '0.75rem', marginRight: 4 }}>
        Tokens{hint ? ` · ${hint}` : ''}:
      </span>
      {TOKENS.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onPick(t)}
          title={`Insert {{${t}}}`}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.72rem',
            padding: '2px 8px',
            border: '1px solid var(--rule)',
            borderRadius: 999,
            background: 'var(--paper-2)',
            color: 'var(--ink-2)',
            cursor: 'pointer',
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function PreviewPanel({
  subject,
  body,
  onClose,
}: {
  subject: string;
  body: string;
  onClose: () => void;
}) {
  const cases = useRecentPreviewCases(20);
  const [caseId, setCaseId] = useState<string | undefined>(undefined);
  const changes = useCaseChanges(caseId);
  const [changeId, setChangeId] = useState<string | undefined>(undefined);

  const activeCase = useMemo(
    () => cases.data?.find((c) => c.id === caseId),
    [cases.data, caseId],
  );
  const activeChange = useMemo(
    () => changes.data?.find((c) => c.id === changeId) ?? changes.data?.[0],
    [changes.data, changeId],
  );

  const ctx: RenderContext = useMemo(() => {
    const out: RenderContext = {};
    if (activeCase) {
      out.case = {
        mrn: activeCase.mrn,
        episode: activeCase.episode,
        drg_pre: activeCase.drg_pre,
        drg_post: activeCase.drg_post,
      };
      if (activeCase.coder) out.coder = { name: activeCase.coder.name };
    }
    if (activeChange) {
      out.change = {
        code: activeChange.code,
        note: activeChange.note,
        action: activeChange.action,
        kind: activeChange.kind,
      };
    }
    return out;
  }, [activeCase, activeChange]);

  return (
    <div
      style={{
        marginTop: 12,
        padding: '10px 12px',
        background: 'var(--paper-2)',
        border: '1px solid var(--rule)',
        borderRadius: 3,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Pill>preview</Pill>
          <CasePicker
            cases={cases.data}
            loading={cases.isPending}
            value={caseId}
            onChange={(id) => {
              setCaseId(id);
              setChangeId(undefined);
            }}
          />
          {caseId && (
            <ChangePicker
              changes={changes.data}
              loading={changes.isPending}
              value={changeId ?? changes.data?.[0]?.id}
              onChange={setChangeId}
            />
          )}
        </div>
        <Button type="button" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>

      {!caseId && (
        <p style={{ color: 'var(--ink-3)', fontSize: '0.85rem' }}>
          Pick a case to see the rendered output.
        </p>
      )}

      {caseId && (
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ color: 'var(--ink-3)', fontSize: '0.75rem' }}>Subject</div>
          <div
            style={{
              padding: '6px 8px',
              background: 'var(--paper-inset)',
              border: '1px solid var(--rule)',
              borderRadius: 3,
              color: 'var(--ink)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.9rem',
              minHeight: '1.4em',
            }}
          >
            {render(subject, ctx)}
          </div>
          <div style={{ color: 'var(--ink-3)', fontSize: '0.75rem', marginTop: 6 }}>Body</div>
          <pre
            style={{
              margin: 0,
              padding: '8px 10px',
              background: 'var(--paper-inset)',
              border: '1px solid var(--rule)',
              borderRadius: 3,
              color: 'var(--ink)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.9rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              minHeight: '1.4em',
            }}
          >
            {render(body, ctx)}
          </pre>
        </div>
      )}
    </div>
  );
}

function CasePicker({
  cases,
  loading,
  value,
  onChange,
}: {
  cases: PreviewCaseRow[] | undefined;
  loading: boolean;
  value: string | undefined;
  onChange: (id: string) => void;
}) {
  if (loading) {
    return <span style={{ color: 'var(--ink-3)', fontSize: '0.85rem' }}>Loading cases…</span>;
  }
  if (!cases || cases.length === 0) {
    return <span style={{ color: 'var(--ink-3)', fontSize: '0.85rem' }}>No cases available</span>;
  }
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      style={pickerStyle}
    >
      <option value="">Pick a case…</option>
      {cases.map((c) => (
        <option key={c.id} value={c.id}>
          {c.mrn} · {c.episode} · DRG {c.drg_pre}
          {c.drg_post ? `→${c.drg_post}` : ''}
          {c.coder ? ` · ${c.coder.name}` : ''}
        </option>
      ))}
    </select>
  );
}

function ChangePicker({
  changes,
  loading,
  value,
  onChange,
}: {
  changes: { id: string; kind: 'dx' | 'px'; action: string; code: string }[] | undefined;
  loading: boolean;
  value: string | undefined;
  onChange: (id: string) => void;
}) {
  if (loading) {
    return <span style={{ color: 'var(--ink-3)', fontSize: '0.85rem' }}>Loading changes…</span>;
  }
  if (!changes || changes.length === 0) {
    return <span style={{ color: 'var(--ink-3)', fontSize: '0.85rem' }}>No changes on this case</span>;
  }
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      style={pickerStyle}
    >
      {changes.map((c) => (
        <option key={c.id} value={c.id}>
          {c.kind} {c.action} · {c.code}
        </option>
      ))}
    </select>
  );
}

const pickerStyle: React.CSSProperties = {
  background: 'var(--paper-inset)',
  color: 'var(--ink)',
  border: '1px solid var(--rule)',
  borderRadius: 3,
  padding: '4px 6px',
  fontFamily: 'var(--font-body)',
  fontSize: '0.85rem',
};

function insertAt(source: string, insertion: string, at: number): string {
  return source.slice(0, at) + insertion + source.slice(at);
}
