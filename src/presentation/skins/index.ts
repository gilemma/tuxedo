export type SkinId = 'tuxedo' | 'ledger';

export const SKINS: { id: SkinId; label: string; description: string }[] = [
  { id: 'tuxedo', label: 'Tuxedo', description: 'Navy chrome, blue accents, crisp white canvas.' },
  { id: 'ledger', label: 'Ledger', description: 'Warm paper, tan tabs, muted greens and reds.' },
];

const DEFAULT_SKIN: SkinId = 'tuxedo';
const STORAGE_KEY = 'tuxedo.skin';

function isSkinId(value: string | null): value is SkinId {
  return value !== null && SKINS.some((s) => s.id === value);
}

export function getInitialSkin(): SkinId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isSkinId(stored)) return stored;
  } catch {
    // localStorage blocked (private mode, etc.) — fall back to default
  }
  return DEFAULT_SKIN;
}

export function applySkin(id: SkinId): void {
  document.documentElement.setAttribute('data-skin', id);
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // localStorage blocked — data-skin still applied for this session
  }
}

export function getCurrentSkin(): SkinId {
  const attr = document.documentElement.getAttribute('data-skin');
  return isSkinId(attr) ? attr : DEFAULT_SKIN;
}
