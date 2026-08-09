// AUD formatting. Uses narrowSymbol so we get "$" not "A$" — the app is
// AU-only and the dollar sign context is unambiguous.

const AUD = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  currencyDisplay: 'narrowSymbol',
});

export function fmtCurrency(n: number | null | undefined): string {
  if (n == null) return '—';
  return AUD.format(n);
}

export function fmtDelta(n: number | null | undefined): {
  text: string;
  tone: 'red' | 'green' | 'neutral';
} {
  if (n == null) return { text: '—', tone: 'neutral' };
  if (n === 0) return { text: AUD.format(0), tone: 'neutral' };
  const formatted = AUD.format(Math.abs(n));
  return {
    text: (n < 0 ? '−' : '+') + formatted,
    tone: n < 0 ? 'red' : 'green',
  };
}
