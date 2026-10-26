'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Repeat } from 'lucide-react';
import Link from 'next/link';
import { agendaApi, type RecallSettings } from '../../lib/api-client';
import { Badge, Button, Card, Switch } from '../ui';

const STATE: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral'; help: string }> = {
  NO_WHATSAPP: { label: 'Sin WhatsApp', tone: 'neutral', help: 'Conecta el WhatsApp de tu negocio para avisar desde tu número.' },
  NOT_CREATED: { label: 'Por activar', tone: 'warning', help: 'Crea la plantilla de aviso; Meta la revisa (minutos u horas).' },
  PENDING: { label: 'En revisión de Meta', tone: 'warning', help: 'Apenas Meta la apruebe, los avisos pueden salir.' },
  APPROVED: { label: 'Aprobada', tone: 'success', help: 'Avisamos a tus clientes unos días antes de que les toque su servicio de rutina.' },
  REJECTED: { label: 'Rechazada por Meta', tone: 'danger', help: 'Meta rechazó la plantilla. Escríbenos y la ajustamos.' },
};

/** Aviso de rutina ("ya se acerca tu próximo corte"): se activa aparte de los recordatorios de cita. */
export function RecallCard({ placeId }: { placeId: string }) {
  const [state, setState] = useState<RecallSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => { agendaApi.recall(placeId).then(setState).catch(() => setState(null)); }, [placeId]);
  useEffect(() => { load(); }, [load]);
  if (!state) return null;
  const s = STATE[state.template] ?? STATE.NO_WHATSAPP;
  const marketing = state.category === 'MARKETING';

  const create = async () => {
    setBusy(true);
    try { setState(await agendaApi.createRecallTemplate(placeId)); toast.success('Plantilla enviada a revisión de Meta'); }
    catch (err: any) { toast.error(err.message); } finally { setBusy(false); }
  };
  const toggle = async (enabled: boolean) => {
    try { setState(await agendaApi.setRecall(placeId, enabled)); } catch (err: any) { toast.error(err.message); }
  };

  return (
    <Card padding="md" className="flex flex-wrap items-center gap-4">
      <Repeat size={22} className="text-primary" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 font-semibold text-text">
          Aviso de rutina <Badge tone={s.tone}>{s.label}</Badge>
          {state.category && <Badge tone={marketing ? 'warning' : 'neutral'}>{marketing ? 'Marketing' : 'Utilidad'}</Badge>}
        </p>
        <p className="text-sm text-text-muted">
          {s.help} Configura en cada servicio cada cuántos días se repite.{' '}
          {state.category && `Cada aviso cuesta ~S/ ${marketing ? '0.23' : '0.10'} (tarifa de Meta para Perú).`}
        </p>
      </div>
      {state.template === 'NO_WHATSAPP' && <Link href="/whatsapp" className="text-sm font-medium text-primary-hover underline">Conectar WhatsApp</Link>}
      {state.template === 'NOT_CREATED' && <Button size="sm" loading={busy} onClick={create}>Crear plantilla</Button>}
      {(state.template === 'APPROVED' || state.template === 'PENDING') && <Switch label="Enviar avisos automáticos" checked={state.enabled} onChange={toggle} />}
    </Card>
  );
}
