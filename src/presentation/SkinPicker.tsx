import { useState } from 'react';
import { SKINS, applySkin, getCurrentSkin, type SkinId } from './skins';

export function SkinPicker() {
  const [skin, setSkin] = useState<SkinId>(getCurrentSkin());

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '10px 12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label
          htmlFor="skin-picker"
          style={{ color: 'var(--ink-2)', fontSize: '0.9rem', fontFamily: 'var(--font-body)' }}
        >
          Visual skin
        </label>
        <select
          id="skin-picker"
          value={skin}
          onChange={(e) => {
            const next = e.target.value as SkinId;
            setSkin(next);
            applySkin(next);
          }}
          style={{
            background: 'var(--paper-inset)',
            color: 'var(--ink)',
            border: '1px solid var(--rule)',
            borderRadius: 3,
            padding: '4px 8px',
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
          }}
        >
          {SKINS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <p style={{ margin: 0, color: 'var(--ink-3)', fontSize: '0.8rem' }}>
        {SKINS.find((s) => s.id === skin)?.description}
      </p>
    </div>
  );
}
