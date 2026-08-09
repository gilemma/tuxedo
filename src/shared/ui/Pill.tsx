import type { ReactNode } from 'react';

type Tone = 'green' | 'red' | 'neutral';

export function Pill({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  const skin: React.CSSProperties =
    tone === 'green'
      ? { background: 'color-mix(in srgb, var(--ledger-green) 18%, transparent)', color: 'var(--ledger-green)' }
      : tone === 'red'
      ? { background: 'color-mix(in srgb, var(--audit-red) 18%, transparent)', color: 'var(--audit-red)' }
      : { background: 'var(--paper-2)', color: 'var(--ink-3)' };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: '0.75rem',
        fontFamily: 'var(--font-body)',
        border: '1px solid var(--rule)',
        ...skin,
      }}
    >
      {children}
    </span>
  );
}
