'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CalendarPlus } from 'lucide-react';
import { agendaApi } from '../../lib/api-client';
import { soles, time12 } from '../../lib/agenda';
import { Button, Input, Select, Sheet } from '../ui';
import { SlotPicker } from './SlotPicker';

/** Cita manual (llamada, cliente en el local): servicio → profesional o cualquiera → hora libre → cliente. */
export function NewAppointmentSheet({ placeId, services, professionals, initial, onClose, onDone }: {
  placeId: string;
  services: any[];
  professionals: any[];
  initial: { date: string; professionalId?: string; time?: string };
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
      const a = await agendaApi.book(placeId, { serviceId, professionalId: proId || null, date, time, ...form });
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
        <Input label="Nota (opcional)" value={form.notes} maxLength={300} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <Button className="w-full" icon={CalendarPlus} loading={saving} disabled={!time || form.customerName.trim().length < 2} onClick={save}>
          {time ? `Agendar a las ${time12(time)}` : 'Agendar cita'}
        </Button>
      </div>
    </Sheet>
  );
}
