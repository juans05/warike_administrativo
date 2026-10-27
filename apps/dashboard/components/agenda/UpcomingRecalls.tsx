'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Repeat } from 'lucide-react';
import { agendaApi, type RecallClient } from '../../lib/api-client';
import { shortDate, todayLima } from '../../lib/agenda';
import { Badge, Button, Card, EmptyState, Skeleton } from '../ui';

const daysFrom = (from: string, to: string) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400_000);
const dueText = (due: string) => {
  const n = daysFrom(todayLima(), due);
  return n > 1 ? `en ${n} días` : n === 1 ? 'mañana' : n === 0 ? 'hoy' : `hace ${-n} día${n === -1 ? '' : 's'}`;
};

/** Vista "Por volver": clientes a los que les toca su servicio de rutina pronto o ya les tocó. */
export function UpcomingRecalls({ placeId, onSchedule }: { placeId: string; onSchedule(c: RecallClient): void }) {
  const [rows, setRows] = useState<RecallClient[] | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const load = useCallback(() => { agendaApi.recallUpcoming(placeId).then(setRows).catch((err: Error) => { toast.error(err.message); setRows([]); }); }, [placeId]);
  useEffect(() => { load(); }, [load]);

  const notify = async (c: RecallClient) => {
    setSending(c.appointmentId);
    try { await agendaApi.recallNotify(placeId, c.appointmentId); toast.success(`Aviso enviado a ${c.customerName}`); load(); }
    catch (err: any) { toast.error(err.message); } finally { setSending(null); }
  };

  if (!rows) return <Skeleton className="h-64 rounded-card" />;
  if (!rows.length) {
    return (
      <Card>
        <EmptyState icon={Repeat} title="Nadie por volver en estos días" description='Aquí aparecen los clientes a los que les toca su servicio de rutina en las próximas 2 semanas. Configura en cada servicio "Repetir cada (días)".' />
      </Card>
    );
  }

  return (
    <Card padding="sm" className="divide-y divide-border">
      {rows.map((c) => {
        const overdue = c.dueDate < todayLima();
        return (
          <div key={c.appointmentId} className="flex flex-wrap items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-text">{c.customerName} <span className="font-normal text-text-muted">· {c.serviceName}</span></p>
              <p className="text-sm text-text-muted">
                Última visita {shortDate(c.lastVisit)} · le toca <span className={overdue ? 'font-medium text-danger' : 'font-medium text-text'}>{dueText(c.dueDate)}</span> ({shortDate(c.dueDate)})
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {c.hasFuture && <Badge tone="success">Ya tiene cita</Badge>}
                {c.notifiedAt && <Badge tone="neutral">Avisado {shortDate(c.notifiedAt.slice(0, 10))}</Badge>}
                {c.optedOut && <Badge tone="danger">Pidió no recibir mensajes</Badge>}
              </div>
            </div>
            <div className="flex gap-2">
              {c.canNotify && <Button size="sm" variant="secondary" loading={sending === c.appointmentId} onClick={() => notify(c)}>Avisar ahora</Button>}
              {!c.hasFuture && <Button size="sm" onClick={() => onSchedule(c)}>Agendar</Button>}
            </div>
          </div>
        );
      })}
    </Card>
  );
}
