'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CalendarDays, Clock, Lock, Plus } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { agendaApi } from '../../lib/api-client';
import { SOURCE_LABEL, STATUS, fromMin, longDate, soles, time12, todayLima } from '../../lib/agenda';
import { splitToday, type TodayAppt } from '../../lib/independent';
import { AppointmentSheet } from '../agenda/AppointmentSheet';
import { NewAppointmentSheet } from '../agenda/NewAppointmentSheet';
import { Badge, Button, Card, EmptyState, PageHeader, Skeleton, buttonStyles, cn } from '../ui';

/** Minutos desde medianoche en Lima (UTC−5), sin depender de la zona del navegador. */
const nowLimaMin = () => {
  const d = new Date(Date.now() - 5 * 3600_000);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
};

const isPlanError = (message: string) => /plan|suscripci/i.test(message);

/** "Hoy" del barbero independiente: su cita actual y las pendientes del día. */
export default function IndependentToday() {
  const { activePlaceId, activePlace } = useRestaurant();
  const [appointments, setAppointments] = useState<TodayAppt[] | null>(null);
  const [error, setError] = useState<'plan' | 'other' | null>(null);
  const [nowMin, setNowMin] = useState(nowLimaMin);
  const [selected, setSelected] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [pros, setPros] = useState<any[]>([]);

  const load = useCallback(() => {
    if (!activePlaceId) return;
    agendaApi.day(activePlaceId, todayLima())
      .then((res) => { setAppointments(res?.appointments ?? []); setError(null); setNowMin(nowLimaMin()); })
      // Un refresco fallido conserva la lista que ya se veía.
      .catch((err) => { setError(isPlanError(err?.message ?? '') ? 'plan' : 'other'); setAppointments((prev) => prev ?? []); });
  }, [activePlaceId]);

  useEffect(() => {
    setAppointments(null);
    load();
    const timer = setInterval(() => { if (!document.hidden) load(); }, 60_000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!activePlaceId) return;
    agendaApi.services(activePlaceId).then(setServices).catch(() => setServices([]));
    agendaApi.professionals(activePlaceId).then(setPros).catch(() => setPros([]));
  }, [activePlaceId]);

  const done = () => { setSelected(null); setCreating(false); load(); };
  const first = activePlace?.name?.split(' ')[0];

  if (error === 'plan') {
    return (
      <EmptyState
        icon={Lock}
        title="Activa tu plan para usar tu agenda"
        description="Con tu plan activo ves tus citas de hoy, recibes reservas y registras tus cobros."
        action={<Link href="/suscripcion" className={buttonStyles('primary')}>Ver planes</Link>}
      />
    );
  }

  const { current, pending } = splitToday(appointments ?? [], nowMin);

  return (
    <div className="space-y-6">
      <PageHeader title={`Hola${first ? `, ${first}` : ''}`} subtitle={longDate(todayLima())} />

      {error === 'other' && (
        <p role="alert" className="flex items-center gap-2 rounded-control bg-danger/10 p-3 text-sm font-medium text-danger">
          <AlertCircle size={16} aria-hidden /> No pudimos cargar tus citas. <button type="button" className="min-h-11 underline" onClick={load}>Reintentar</button>
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button className="h-12" icon={Plus} onClick={() => setCreating(true)} disabled={!activePlaceId}>Nueva cita</Button>
        <Link href="/agenda" className={buttonStyles('secondary', 'md', 'h-12')}><CalendarDays size={18} aria-hidden /> Ver agenda</Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 md:items-start">
        <section aria-labelledby="ahora" className="space-y-3 md:order-2">
          <h2 id="ahora" className="text-base font-semibold text-text">Ahora</h2>
          {appointments === null ? (
            <Skeleton className="h-40 rounded-card" />
          ) : current ? (
            <Card padding="lg" className="space-y-3 border-primary">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-2xl font-bold text-text"><Clock size={22} aria-hidden /> {time12(current.time)}</span>
                <StatusBadge status={current.status} />
              </div>
              <div>
                <p className="text-lg font-semibold text-text">{current.customerName}</p>
                <p className="text-sm text-text-muted">{current.serviceName}{current.price ? ` · ${soles(current.price)}` : ''}</p>
              </div>
              <Button className="h-12 w-full" onClick={() => setSelected(current)}>Ver cita</Button>
            </Card>
          ) : (
            <Card padding="lg" className="text-center">
              <p className="text-base font-semibold text-text">No tienes a nadie ahora</p>
              <p className="text-sm text-text-muted">
                {pending.length ? `Tu próxima cita es a las ${time12(pending[0].time)}.` : 'No te quedan citas hoy.'}
              </p>
            </Card>
          )}
        </section>

        <section aria-labelledby="pendientes" className="space-y-3 md:order-1">
          <h2 id="pendientes" className="text-base font-semibold text-text">Pendientes de hoy ({pending.length})</h2>
          {appointments === null ? (
            <Skeleton className="h-48 rounded-card" />
          ) : pending.length === 0 ? (
            <p className="rounded-card border border-dashed border-border p-4 text-center text-sm text-text-muted">Nada pendiente por hoy.</p>
          ) : (
            <ul className="divide-y divide-border rounded-card border border-border bg-surface">
              {pending.map((appt) => (
                <li key={appt.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(appt)}
                    className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                  >
                    <span className={cn('w-20 shrink-0 text-sm font-semibold', appt.status === 'RESERVADA' && appt.endTime <= fromMin(nowMin) ? 'text-danger' : 'text-text')}>
                      {time12(appt.time)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-text">{appt.customerName}</span>
                      <span className="block truncate text-xs text-text-muted">
                        {appt.serviceName}{appt.source ? ` · ${SOURCE_LABEL[appt.source] ?? appt.source}` : ''}
                      </span>
                    </span>
                    <StatusBadge status={appt.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {selected && activePlaceId && (
        <AppointmentSheet placeId={activePlaceId} appt={selected} professionals={pros.filter((p) => p.active)} onClose={() => setSelected(null)} onDone={done} />
      )}
      {creating && activePlaceId && (
        <NewAppointmentSheet
          placeId={activePlaceId}
          services={services}
          professionals={pros.filter((p) => p.active)}
          initial={{ date: todayLima() }}
          assetKind={activePlace?.verticalConfig?.assetKind ?? null}
          onClose={() => setCreating(false)}
          onDone={done}
        />
      )}
    </div>
  );
}


function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status];
  return s ? <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', s.className)}>{s.label}</span> : <Badge>{status}</Badge>;
}
