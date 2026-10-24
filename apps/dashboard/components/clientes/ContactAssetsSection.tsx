'use client';

import { useEffect, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { agendaApi, type CustomerAsset } from '../../lib/api-client';
import { ASSET_META, assetSummary } from '../../lib/agenda';
import type { AssetKind } from '../../lib/modules';
import { AssetFields, emptyAsset, type AssetDraft } from '../agenda/AssetFields';
import { Button, Textarea } from '../ui';
import { SectionTitle } from './parts';

/** Mascotas o vehículos del cliente (por su teléfono): ver, agregar y editar sus datos. */
export function ContactAssetsSection({ placeId, kind, phone, customerName }: { placeId: string; kind: AssetKind; phone: string; customerName: string }) {
  const meta = ASSET_META[kind];
  const [assets, setAssets] = useState<CustomerAsset[] | null>(null);
  const [editing, setEditing] = useState<{ id: string | null; draft: AssetDraft; notes: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => agendaApi.assets(placeId, phone).then(setAssets).catch(() => setAssets([]));
  useEffect(() => { load(); }, [placeId, phone]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!editing?.draft.name.trim()) { toast.error(`Falta ${meta.nameLabel.toLowerCase()}`); return; }
    setSaving(true);
    try {
      await agendaApi.saveAsset(placeId, editing.id, { customerPhone: phone, customerName, name: editing.draft.name, data: editing.draft.data, notes: editing.notes || null });
      toast.success(`${meta.title} guardado`);
      setEditing(null);
      load();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionTitle>{kind === 'PET' ? 'Mascotas' : 'Vehículos'}</SectionTitle>
        {!editing && <Button size="sm" variant="ghost" icon={Plus} onClick={() => setEditing({ id: null, draft: emptyAsset(), notes: '' })}>Agregar</Button>}
      </div>
      {assets?.length === 0 && !editing && <p className="text-sm text-text-muted">Sin fichas todavía. Se crean solas al agendar una cita con {meta.nameLabel.toLowerCase()}.</p>}
      <ul className="divide-y divide-border">
        {assets?.map((a) => (
          <li key={a.id} className="flex items-start justify-between gap-3 py-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text">{assetSummary(a)}</p>
              <p className="text-xs text-text-muted">
                {meta.fields.slice(2).map(([k, label]) => (a.data?.[k] ? `${label}: ${a.data[k]}` : null)).filter(Boolean).join(' · ')}
                {a.notes ? ` · ${a.notes}` : ''}
              </p>
            </div>
            <Button size="sm" variant="ghost" icon={Pencil} aria-label={`Editar ${a.name}`}
              onClick={() => setEditing({ id: a.id, draft: { name: a.name, data: Object.fromEntries(Object.entries(a.data ?? {}).map(([k, v]) => [k, v ?? ''])) }, notes: a.notes ?? '' })}>
              Editar
            </Button>
          </li>
        ))}
      </ul>
      {editing && (
        <div className="space-y-3 rounded-control border border-border p-3">
          <AssetFields kind={kind} value={editing.draft} onChange={(draft) => setEditing({ ...editing, draft })} />
          <Textarea label="Notas" value={editing.notes} maxLength={1000} rows={2} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button className="flex-1" loading={saving} onClick={save}>Guardar</Button>
          </div>
        </div>
      )}
    </section>
  );
}
