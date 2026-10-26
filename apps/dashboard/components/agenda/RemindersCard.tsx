'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BellRing, X } from 'lucide-react';
import Link from 'next/link';
import { agendaApi } from '../../lib/api-client';
import { Badge, Button, Card, Switch } from '../ui';

const STATE: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral'; help: string }> = {
  NO_WHATSAPP: { label: 'Sin WhatsApp', tone: 'neutral', help: 'Conecta el WhatsApp de tu negocio para enviar recordatorios desde tu número.' },
  NOT_CREATED: { label: 'Por activar', tone: 'warning', help: 'Crea las plantillas de recordatorio y de "listo para recoger" (mascotas y vehículos); Meta las revisa (minutos u horas).' },
  PENDING: { label: 'En revisión de Meta', tone: 'warning', help: 'Apenas Meta la apruebe, los recordatorios salen solos.' },
  APPROVED: { label: 'Activos', tone: 'success', help: 'Tus clientes reciben un WhatsApp antes de su cita, con el enlace para cancelar.' },
  REJECTED: { label: 'Rechazada por Meta', tone: 'danger', help: 'Meta rechazó la plantilla. Escríbenos y la ajustamos.' },
};

// Mismos límites que el backend: de 30 min a 7 días, hasta 3 tiempos.
const PRESETS = [{ min: 60, label: '1 h antes' }, { min: 120, label: '2 h antes' }, { min: 1440, label: '1 día antes' }];
const MAX = 3;
const UNITS = { min: 1, h: 60, d: 1440 } as const;

/** "1 día antes", "3 h antes", "45 min antes". */
export const offsetLabel = (m: number) =>
  m % 1440 === 0 ? `${m / 1440} día${m === 1440 ? '' : 's'} antes` : m % 60 === 0 ? `${m / 60} h antes` : `${m} min antes`;

/** Recordatorios automáticos de citas por WhatsApp, en los tiempos que elige el local. */
export function RemindersCard({ placeId }: { placeId: string }) {
  const [state, setState] = useState<{ enabled: boolean; offsetsMin: number[]; template: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [custom, setCustom] = useState({ value: '', unit: 'h' as keyof typeof UNITS });
  const load = useCallback(() => { agendaApi.reminders(placeId).then(setState).catch(() => setState(null)); }, [placeId]);
  useEffect(() => { load(); }, [load]);
  if (!state) return null;
  const s = STATE[state.template] ?? STATE.NO_WHATSAPP;
  const active = state.template === 'APPROVED' || state.template === 'PENDING';
  const offsets = state.offsetsMin ?? [1440];

  const create = async () => {
    setBusy(true);
    try { const r = await agendaApi.createReminderTemplate(placeId); setState({ ...state, template: r.template }); toast.success('Plantilla enviada a revisión de Meta'); }
    catch (err: any) { toast.error(err.message); } finally { setBusy(false); }
  };
  const save = async (body: { enabled?: boolean; offsetsMin?: number[] }) => {
    try { setState(await agendaApi.setReminders(placeId, body)); } catch (err: any) { toast.error(err.message); }
  };
  const toggleOffset = (m: number) => {
    if (offsets.includes(m)) {
      if (offsets.length === 1) return toast.error('Deja al menos un recordatorio, o apágalos con el interruptor');
      return save({ offsetsMin: offsets.filter((o) => o !== m) });
    }
    if (offsets.length >= MAX) return toast.error(`Máximo ${MAX} recordatorios por cita`);
    save({ offsetsMin: [...offsets, m] });
  };
  const addCustom = () => {
    const m = Math.round(Number(custom.value) * UNITS[custom.unit]);
    if (!Number.isFinite(m) || m < 30 || m > 7 * 1440) return toast.error('Elige entre 30 minutos y 7 días antes');
    toggleOffset(m);
    setCustom({ ...custom, value: '' });
  };

  return (
    <Card padding="md" className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <BellRing size={22} className="text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 font-semibold text-text">Recordatorios por WhatsApp <Badge tone={s.tone}>{s.label}</Badge></p>
          <p className="text-sm text-text-muted">{s.help}</p>
        </div>
        {state.template === 'NO_WHATSAPP' && <Link href="/whatsapp" className="text-sm font-medium text-primary-hover underline">Conectar WhatsApp</Link>}
        {state.template === 'NOT_CREATED' && <Button size="sm" loading={busy} onClick={create}>Activar recordatorios</Button>}
        {active && <Switch label="Enviar recordatorios" checked={state.enabled} onChange={(enabled) => save({ enabled })} />}
      </div>

      {active && state.enabled && (
        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-sm font-medium text-text">¿Cuándo se envían? <span className="font-normal text-text-muted">(hasta {MAX})</span></p>
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((p) => {
              const on = offsets.includes(p.min);
              return (
                <button key={p.min} type="button" aria-pressed={on} onClick={() => toggleOffset(p.min)}
                  className={`min-h-9 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${on ? 'border-primary bg-primary-soft text-primary-hover' : 'border-border text-text-muted hover:text-text'}`}>
                  {p.label}
                </button>
              );
            })}
            {offsets.filter((o) => !PRESETS.some((p) => p.min === o)).map((o) => (
              <span key={o} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-primary bg-primary-soft pl-3 pr-1 text-sm font-medium text-primary-hover">
                {offsetLabel(o)}
                <button type="button" aria-label={`Quitar ${offsetLabel(o)}`} onClick={() => toggleOffset(o)} className="rounded-full p-1 hover:bg-primary/10"><X size={14} aria-hidden /></button>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-sm text-text-muted">
              <span className="sr-only">Otro tiempo</span>
              <input type="number" inputMode="decimal" min={1} placeholder="Otro" value={custom.value} onChange={(e) => setCustom({ ...custom, value: e.target.value })}
                className="min-h-9 w-24 rounded-control border border-border bg-surface px-2 text-sm text-text" />
            </label>
            <select aria-label="Unidad" value={custom.unit} onChange={(e) => setCustom({ ...custom, unit: e.target.value as keyof typeof UNITS })}
              className="min-h-9 rounded-control border border-border bg-surface px-2 text-sm text-text">
              <option value="min">minutos</option><option value="h">horas</option><option value="d">días</option>
            </select>
            <Button size="sm" variant="secondary" disabled={!custom.value || offsets.length >= MAX} onClick={addCustom}>Agregar</Button>
          </div>
          <p className="text-xs text-text-muted">Cada recordatorio cuesta ~S/ 0.10 por cita (tarifa de Meta para Perú); Meta lo cobra a tu cuenta de WhatsApp.</p>
        </div>
      )}
    </Card>
  );
}
