import { useState, type FormEvent } from 'react';
import { Button } from '../../../shared/ui/Button';
import { Field } from '../../../shared/ui/Field';
import { Pill } from '../../../shared/ui/Pill';
import type { Coder } from '../../../supabase/types';
import { useCoders, useCreateCoder, useSetCoderActive, useUpdateCoder } from '../model/coders';

export function CodersEditor() {
  const coders = useCoders();
  const create = useCreateCoder();
  const setActive = useSetCoderActive();

  const [name, setName] = useState('');
  const [team, setTeam] = useState('');
  const [contact, setContact] = useState('');
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
        team: team.trim() || null,
        contact: contact.trim() || null,
      });
      setName('');
      setTeam('');
      setContact('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <section
      style={{
        maxWidth: 560,
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
        Coders
      </header>

      <div style={{ padding: '12px 16px' }}>
        {coders.isPending && <p style={{ color: 'var(--ink-3)' }}>Loading…</p>}
        {coders.error && (
          <p style={{ color: 'var(--audit-red)' }}>Error: {coders.error.message}</p>
        )}
        {coders.data?.length === 0 && (
          <p style={{ color: 'var(--ink-3)' }}>No coders yet. Add the first one below.</p>
        )}
        {coders.data?.map((c) => <CoderRow key={c.id} coder={c} onToggle={setActive.mutate} />)}

      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--rule)' }}>
        <div style={{ color: 'var(--ink-3)', fontSize: '0.85rem', marginBottom: 6 }}>
          New coder
        </div>
        <form onSubmit={onSave}>
          <Field
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Field
            label="Team"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
          />
          <Field
            label="Contact"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: 10,
            }}
          >
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Saving…' : 'Save coder'}
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

function CoderRow({
  coder,
  onToggle,
}: {
  coder: Coder;
  onToggle: (args: { id: string; active: boolean }) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <CoderRowEdit coder={coder} onDone={() => setEditing(false)} />;
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 0',
      }}
    >
      <div>
        <div style={{ color: 'var(--ink)' }}>{coder.name}</div>
        {(coder.team || coder.contact) && (
          <div style={{ color: 'var(--ink-3)', fontSize: '0.8rem' }}>
            {[coder.team, coder.contact].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Pill tone={coder.active ? 'green' : 'neutral'}>
          {coder.active ? 'active' : 'archived'}
        </Pill>
        <Button variant="ghost" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button
          variant="ghost"
          onClick={() => onToggle({ id: coder.id, active: !coder.active })}
        >
          {coder.active ? 'Archive' : 'Restore'}
        </Button>
      </div>
    </div>
  );
}

function CoderRowEdit({ coder, onDone }: { coder: Coder; onDone: () => void }) {
  const update = useUpdateCoder();
  const [name, setName] = useState(coder.name);
  const [team, setTeam] = useState(coder.team ?? '');
  const [contact, setContact] = useState(coder.contact ?? '');
  const [error, setError] = useState<string | null>(null);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    try {
      await update.mutateAsync({
        id: coder.id,
        patch: {
          name: name.trim(),
          team: team.trim() || null,
          contact: contact.trim() || null,
        },
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <form
      onSubmit={onSave}
      style={{
        padding: '8px 10px',
        margin: '4px 0',
        background: 'var(--paper-inset)',
        border: '1px solid var(--rule)',
        borderRadius: 3,
      }}
    >
      <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Field label="Team" value={team} onChange={(e) => setTeam(e.target.value)} />
      <Field label="Contact" value={contact} onChange={(e) => setContact(e.target.value)} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
        <Button type="button" variant="ghost" onClick={onDone} disabled={update.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
      {error && <p style={{ color: 'var(--audit-red)', marginTop: 8 }}>{error}</p>}
    </form>
  );
}
