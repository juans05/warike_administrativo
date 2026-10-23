'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Ban, CalendarClock, CheckCircle2, MessageCircle, UserX } from 'lucide-react';
import { agendaApi } from '../../lib/api-client';
import { SOURCE_LABEL, STATUS, longDate, soles, time12 } from '../../lib/agenda';
import { Badge, Button, Input, Select, Sheet } from '../ui';

/** Detalle de una cita: marcar atendida / no asistió / cancelar, o reprogramar (otro día, hora o profesional). */
export function AppointmentSheet({ placeId, appt, professionals, onClose, onDone }: { placeId: string; appt: any; professionals: any[]; onClose(): void; onDone(): void }) {
  const [moving, setMoving] = useState(false);
  const [move, setMove] = useState({ date: appt.date, time: appt.time, professionalId: appt.professionalId });
  const [saving, setSaving] = useState(false);
  const phone = appt.customerPhone?.replace(/\D/g, '');

  const patch = async (body: Record<string, unknown>, ok: string) => {
    setSaving(true);
    try { await agendaApi.update(placeId, appt.id, body); toast.success(ok); onDone(); }
    catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <Sheet open onClose={onClose} title={appt.customerName}>
      <div className="space-y-5 p-4">
        <div className="space-y-1">
          <Badge tone={appt.status === 'ATENDIDA' ? 'success' : appt.status === 'RESERVADA' ? 'primary' : 'neutral'}>{STATUS[appt.status]?.label}</Badge>
          <p className="text-lg font-semibold text-text">{appt.serviceName} · {soles(appt.price)}</p>
          <p className="text-sm text-text">{longDate(appt.date)}, {time12(appt.time)} – {time12(appt.endTime)}</p>
          <p className="text-sm text-text">Con {appt.professional?.name}{appt.professional?.station ? ` · ${appt.professional.station}` : ''}</p>
          <p className="text-xs text-text-muted">Reservada por {SOURCE_LABEL[appt.source] ?? appt.source}{appt.notes ? ` · Nota: ${appt.notes}` : ''}</p>
        </div>

        {phone && (
          <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary-hover underline">
            <MessageCircle size={18} aria-hidden /> Escribir por WhatsApp ({appt.customerPhone})
          </a>
        )}

        {appt.status === 'RESERVADA' && !moving && (
          <div className="grid gap-2 sm:grid-cols-2">
            <Button icon={CheckCircle2} loading={saving} onClick={() => patch({ status: 'ATENDIDA' }, 'Cita atendida')}>Atendida</Button>
            <Button variant="secondary" icon={UserX} onClick={() => patch({ status: 'NO_ASISTIO' }, 'Marcada como no asistió')}>No asistió</Button>
            <Button variant="secondary" icon={CalendarClock} onClick={() => setMoving(true)}>Reprogramar</Button>
            <Button variant="secondary" icon={Ban} onClick={() => patch({ status: 'CANCELADA' }, 'Cita cancelada')}>Cancelar cita</Button>
          </div>
        )}
        {appt.status !== 'RESERVADA' && (
          <Button variant="secondary" onClick={() => patch({ status: 'RESERVADA' }, 'Cita reactivada')}>Volver a "Reservada"</Button>
        )}

        {moving && (
          <div className="space-y-3 rounded-control border border-border p-3">
            <p className="text-sm font-semibold text-text">Reprogramar</p>
            <Select label="Profesional" value={move.professionalId} onChange={(e) => setMove({ ...move, professionalId: e.target.value })}>
              {professionals.map((p) => <option key={p.id} value={p.id}>{p.name}{p.station ? ` · ${p.station}` : ''}</option>)}
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Input label="Día" type="date" value={move.date} onChange={(e) => setMove({ ...move, date: e.target.value })} />
              <Input label="Hora" type="time" step={900} value={move.time} onChange={(e) => setMove({ ...move, time: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setMoving(false)}>Cancelar</Button>
              <Button className="flex-1" loading={saving} onClick={() => patch(move, 'Cita reprogramada')}>Guardar cambio</Button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
