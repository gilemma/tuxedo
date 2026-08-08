import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

export function Button({ variant = 'primary', style, ...rest }: Props) {
  const base: React.CSSProperties = {
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
    padding: '0.4rem 0.9rem',
    borderRadius: 3,
    border: '1px solid var(--rule-2)',
    cursor: rest.disabled ? 'not-allowed' : 'pointer',
    opacity: rest.disabled ? 0.6 : 1,
    boxShadow: 'var(--shadow-sm)',
  };
  const skin: React.CSSProperties =
    variant === 'primary'
      ? { background: 'var(--tab)', color: 'var(--paper-inset)', borderColor: 'var(--tab-2)' }
      : { background: 'var(--paper-inset)', color: 'var(--ink-2)' };

  return <button {...rest} style={{ ...base, ...skin, ...style }} />;
}
