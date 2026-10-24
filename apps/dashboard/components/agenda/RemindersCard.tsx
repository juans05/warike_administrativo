'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BellRing } from 'lucide-react';
import Link from 'next/link';
import { agendaApi } from '../../lib/api-client';
import { Badge, Button, Card, Switch } from '../ui';

const STATE: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral'; help: string }> = {
  NO_WHATSAPP: { label: 'Sin WhatsApp', tone: 'neutral', help: 'Conecta el WhatsApp de tu negocio para enviar recordatorios desde tu número.' },
  NOT_CREATED: { label: 'Por activar', tone: 'warning', help: 'Crea las plantillas de recordatorio y de "listo para recoger" (mascotas y vehículos); Meta las revisa (minutos u horas).' },
  PENDING: { label: 'En revisión de Meta', tone: 'warning', help: 'Apenas Meta la apruebe, los recordatorios salen solos.' },
  APPROVED: { label: 'Activos', tone: 'success', help: 'Tus clientes reciben un WhatsApp 24 h y 2 h antes, con el enlace para cancelar.' },
  REJECTED: { label: 'Rechazada por Meta', tone: 'danger', help: 'Meta rechazó la plantilla. Escríbenos y la ajustamos.' },
};

/** Recordatorios automáticos de citas por WhatsApp (24 h y 2 h antes). */
export function RemindersCard({ placeId }: { placeId: string }) {
  const [state, setState] = useState<{ enabled: boolean; template: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => { agendaApi.reminders(placeId).then(setState).catch(() => setState(null)); }, [placeId]);
  useEffect(() => { load(); }, [load]);
  if (!state) return null;
  const s = STATE[state.template] ?? STATE.NO_WHATSAPP;

  const create = async () => {
    setBusy(true);
    try { const r = await agendaApi.createReminderTemplate(placeId); setState({ ...state, template: r.template }); toast.success('Plantilla enviada a revisión de Meta'); }
    catch (err: any) { toast.error(err.message); } finally { setBusy(false); }
  };
  const toggle = async (enabled: boolean) => {
    try { await agendaApi.setReminders(placeId, enabled); setState({ ...state, enabled }); } catch (err: any) { toast.error(err.message); }
  };

  return (
    <Card padding="md" className="flex flex-wrap items-center gap-4">
      <BellRing size={22} className="text-primary" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 font-semibold text-text">Recordatorios por WhatsApp <Badge tone={s.tone}>{s.label}</Badge></p>
        <p className="text-sm text-text-muted">{s.help}</p>
      </div>
      {state.template === 'NO_WHATSAPP' && <Link href="/whatsapp" className="text-sm font-medium text-primary-hover underline">Conectar WhatsApp</Link>}
      {state.template === 'NOT_CREATED' && <Button size="sm" loading={busy} onClick={create}>Activar recordatorios</Button>}
      {(state.template === 'APPROVED' || state.template === 'PENDING') && <Switch label="Enviar recordatorios" checked={state.enabled} onChange={toggle} />}
    </Card>
  );
}
