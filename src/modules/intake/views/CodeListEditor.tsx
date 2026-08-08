import type { CodeEntry } from '../../../supabase/types';
import { Button } from '../../../shared/ui/Button';

type Props = {
  label: string;
  value: CodeEntry[];
  onChange: (next: CodeEntry[]) => void;
};

export function CodeListEditor({ label, value, onChange }: Props) {
  const update = (i: number, patch: Partial<CodeEntry>) => {
    const next = value.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i: number) => {
    const next = value.slice();
    next.splice(i, 1);
    onChange(next);
  };
  const add = () => onChange([...value, { code: '', description: '' }]);

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ color: 'var(--ink-3)', fontSize: '0.85rem', marginBottom: 6 }}>{label}</div>
      {value.length === 0 && (
        <div style={{ color: 'var(--ink-3)', fontSize: '0.8rem', paddingBottom: 6 }}>
          None yet.
        </div>
      )}
      {value.map((row, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '24px 110px 1fr auto',
            gap: 8,
            alignItems: 'center',
            padding: '3px 0',
          }}
        >
          <span style={{ color: 'var(--ink-3)', fontSize: '0.75rem' }}>{i + 1}</span>
          <input
            aria-label={`${label} code ${i + 1}`}
            value={row.code}
            onChange={(e) => update(i, { code: e.target.value })}
            placeholder="code"
            style={cellStyle()}
          />
          <input
            aria-label={`${label} description ${i + 1}`}
            value={row.description}
            onChange={(e) => update(i, { description: e.target.value })}
            placeholder="description"
            style={cellStyle()}
          />
          <Button type="button" variant="ghost" onClick={() => remove(i)}>
            ✕
          </Button>
        </div>
      ))}
      <div style={{ marginTop: 6 }}>
        <Button type="button" variant="ghost" onClick={add}>
          + Add {label.toLowerCase()}
        </Button>
      </div>
    </div>
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
