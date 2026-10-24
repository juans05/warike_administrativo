'use client';

import { ASSET_META } from '../../lib/agenda';
import type { AssetKind } from '../../lib/modules';
import { Input } from '../ui';

export type AssetDraft = { name: string; data: Record<string, string> };
export const emptyAsset = (): AssetDraft => ({ name: '', data: {} });

/** Campos de una ficha: nombre de la mascota o placa, y sus datos. `compact` muestra solo los dos primeros datos. */
export function AssetFields({ kind, value, onChange, compact }: { kind: AssetKind; value: AssetDraft; onChange(v: AssetDraft): void; compact?: boolean }) {
  const meta = ASSET_META[kind];
  const fields = compact ? meta.fields.slice(0, 2) : meta.fields;
  return (
    <div className="space-y-3">
      <Input label={meta.nameLabel} value={value.name} maxLength={80} onChange={(e) => onChange({ ...value, name: e.target.value })}
        placeholder={kind === 'VEHICLE' ? 'ABC-123' : 'Firulais'} />
      <div className="grid grid-cols-2 gap-2">
        {fields.map(([key, label]) => (
          <Input key={key} label={label} value={value.data[key] ?? ''} maxLength={60}
            onChange={(e) => onChange({ ...value, data: { ...value.data, [key]: e.target.value } })} />
        ))}
      </div>
    </div>
  );
}
