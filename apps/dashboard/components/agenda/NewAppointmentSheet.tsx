'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CalendarPlus } from 'lucide-react';
import { agendaApi, type CustomerAsset } from '../../lib/api-client';
import type { AssetKind } from '../../lib/modules';
import { AssetFields, emptyAsset } from './AssetFields';
import { ASSET_META, assetSummary, soles, time12 } from '../../lib/agenda';
import { Button, Input, Select, Sheet } from '../ui';
import { SlotPicker } from './SlotPicker';

/** Cita manual (llamada, cliente en el local): servicio → profesional o cualquiera → hora libre → cliente. */
export function NewAppointmentSheet({ placeId, services, professionals, initial, assetKind, onClose, onDone }: {
  placeId: string;
  services: any[];
  professionals: any[];
  initial: { date: string; professionalId?: string; time?: string };
  /** Rubros con ficha (veterinaria, taller): la cita indica qué mascota o vehículo se atiende. */
  assetKind?: AssetKind | null;
  onClose(): void;
  onDone(): void;
}) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? '');
  const [proId, setProId] = useState(initial.professionalId ?? '');
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState<string | null>(initial.time ?? null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', notes: '' });
  const [saving, setSaving] = useState(false);
  // Fichas del cliente (por teléfono): elegir una ('' = nueva) o crearla aquí mismo.
  const [assets, setAssets] = useState<CustomerAsset[]>([]);
  const [assetId, setAssetId] = useState('');
  const [newAsset, setNewAsset] = useState(emptyAsset());
  const phoneDigits = form.customerPhone.replace(/\D/g, '');
  useEffect(() => {
    if (!assetKind || phoneDigits.length < 7) { setAssets([]); setAssetId(''); return; }
    const t = setTimeout(() => {
      agendaApi.assets(placeId, form.customerPhone)
        .then((list) => { setAssets(list); setAssetId(list[0]?.id ?? ''); })
        .catch(() => setAssets([]));
    }, 400);
    return () => clearTimeout(t);
  }, [placeId, assetKind, phoneDigits]); // eslint-disable-line react-hooks/exhaustive-deps

  const able = professionals.filter((p) => !p.serviceIds?.length || p.serviceIds.includes(serviceId));
  useEffect(() => {
    if (!serviceId || !date) return;
    setLoading(true);
    agendaApi.availability(placeId, serviceId, date, proId || null)
      .then((a: any) => {
        const list: string[] = proId ? a.professionals[0]?.slots ?? [] : a.any;
        setSlots(list);
        setTime((t) => (t && list.includes(t) ? t : null));
      })
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [placeId, serviceId, proId, date]);

  const save = async () => {
    if (!time) { toast.error('Elige un horario'); return; }
    setSaving(true);
    try {
      const asset = !assetKind ? {} : assetId ? { assetId }
        : newAsset.name.trim() ? { assetName: newAsset.name, assetData: newAsset.data } : {};
      const a = await agendaApi.book(placeId, { serviceId, professionalId: proId || null, date, time, ...form, ...asset });
      toast.success(`Cita agendada: ${a.professional?.name ?? ''} a las ${time12(time)}`);
      onDone();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <Sheet open onClose={onClose} title="Nueva cita">
      <div className="space-y-5 p-4">
        <Select label="Servicio" value={serviceId} onChange={(e) => { setServiceId(e.target.value); setProId(''); }}>
          {services.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.durationMin} min · {soles(s.price)}</option>)}
        </Select>
        <Select label="Profesional" value={proId} onChange={(e) => setProId(e.target.value)}>
          <option value="">Cualquiera disponible</option>
          {able.map((p) => <option key={p.id} value={p.id}>{p.name}{p.station ? ` · ${p.station}` : ''}</option>)}
        </Select>
        <Input label="Día" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <div className="space-y-2">
          <p className="text-sm font-medium text-text">Horario</p>
          <SlotPicker slots={slots} value={time} onChange={setTime} loading={loading} />
        </div>
        <Input label="Nombre del cliente" value={form.customerName} maxLength={120} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
        <Input label="Teléfono (opcional)" type="tel" value={form.customerPhone} maxLength={30} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
        {assetKind && (
          <fieldset className="space-y-3 rounded-control border border-border p-3">
            <legend className="px-1 text-sm font-medium text-text">{ASSET_META[assetKind].title}</legend>
            {phoneDigits.length < 7 && <p className="text-sm text-text-muted">Con el teléfono del cliente se cargan sus fichas; la ficha nueva se guarda con ese número.</p>}
            {assets.length > 0 && (
              <Select label={`${ASSET_META[assetKind].title} del cliente`} value={assetId} onChange={(e) => setAssetId(e.target.value)}>
                {assets.map((x) => <option key={x.id} value={x.id}>{assetSummary(x)}</option>)}
                <option value="">+ Nueva</option>
              </Select>
            )}
            {!assetId && phoneDigits.length >= 7 && <AssetFields kind={assetKind} value={newAsset} onChange={setNewAsset} compact />}
          </fieldset>
        )}
        <Input label="Nota (opcional)" value={form.notes} maxLength={300} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <Button className="w-full" icon={CalendarPlus} loading={saving} disabled={!time || form.customerName.trim().length < 2} onClick={save}>
          {time ? `Agendar a las ${time12(time)}` : 'Agendar cita'}
        </Button>
      </div>
    </Sheet>
  );
}
