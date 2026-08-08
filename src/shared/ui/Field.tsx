import type { InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string };

export function Field({ label, id, style, ...rest }: Props) {
  const inputId = id ?? `f-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr',
        alignItems: 'center',
        gap: 12,
        padding: '4px 0',
      }}
    >
      <label htmlFor={inputId} style={{ color: 'var(--ink-3)', fontSize: '0.85rem' }}>
        {label}
      </label>
      <input
        id={inputId}
        {...rest}
        style={{
          background: 'var(--paper-inset)',
          color: 'var(--ink)',
          border: '1px solid var(--rule)',
          borderRadius: 3,
          padding: '6px 8px',
          fontFamily: 'var(--font-body)',
          fontSize: '0.9rem',
          ...style,
        }}
      />
    </div>
  );
}
