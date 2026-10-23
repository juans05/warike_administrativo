'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CalendarDays, ChevronLeft, ChevronRight, Link2, Plus, Users } from 'lucide-react';
import { agendaApi, type Professional } from '../../../lib/api-client';
import { useRestaurant } from '../../../context/RestaurantContext';
import { STATUS, addDays, fromMin, longDate, time12, toMin, todayLima } from '../../../lib/agenda';
import { Button, Card, EmptyState, PageHeader, Skeleton } from '../../../components/ui';
import { NewAppointmentSheet } from '../../../components/agenda/NewAppointmentSheet';
import { AppointmentSheet } from '../../../components/agenda/AppointmentSheet';
import { Avatar, ProfessionalsSheet } from '../../../components/agenda/ProfessionalsSheet';
import { BookingLinkModal } from '../../../components/agenda/BookingLinkModal';
import { RemindersCard } from '../../../components/agenda/RemindersCard';

const PX_PER_MIN = 1.4; // 1 hora = 84 px: una cita de 15 min todavía se lee.
const COL_W = 'min-w-[11rem] flex-1';

export default function AgendaPage() {
  const { activePlaceId } = useRestaurant();
  const [date, setDate] = useState(todayLima());
  const [day, setDay] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [pros, setPros] = useState<Professional[]>([]);
  const [creating, setCreating] = useState<{ professionalId?: string; time?: string } | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [managing, setManaging] = useState(false);
  const [sharing, setSharing] = useState(false);

  const load = useCallback(() => {
    if (!activePlaceId) return;
    agendaApi.day(activePlaceId, date).then(setDay).catch((err: Error) => { toast.error(err.message); setDay((d: any) => d ?? { professionals: [], appointments: [] }); });
  }, [activePlaceId, date]);
  const loadSetup = useCallback(() => {
    if (!activePlaceId) return;
    agendaApi.services(activePlaceId).then(setServices).catch(() => setServices([]));
    agendaApi.professionals(activePlaceId).then(setPros).catch(() => setPros([]));
  }, [activePlaceId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadSetup(); }, [loadSetup]);
  // Citas que entran por el bot o el link público: se refresca cada 30 s y al volver a la pestaña.
  useEffect(() => {
    const id = setInterval(() => !document.hidden && load(), 30_000);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(id); window.removeEventListener('focus', onFocus); };
  }, [load]);

  const cols: any[] = day?.professionals ?? [];
  const opens = cols.filter((c) => c.open).map((c) => toMin(c.open));
  const closes = cols.filter((c) => c.close).map((c) => toMin(c.close));
  const start = opens.length ? Math.floor(Math.min(...opens) / 60) * 60 : 9 * 60;
  const end = closes.length ? Math.ceil(Math.max(...closes) / 60) * 60 : 20 * 60;
  const hours = Array.from({ length: (end - start) / 60 }, (_, i) => start + i * 60);
  const y = (t: string) => (toMin(t) - start) * PX_PER_MIN;
  const nowMin = date === todayLima() ? toMin(new Date(Date.now() - 5 * 3600_000).toISOString().slice(11, 16)) : null;

  const clickColumn = (e: React.MouseEvent<HTMLDivElement>, pro: any) => {
    const offset = e.clientY - e.currentTarget.getBoundingClientRect().top;
    const minute = start + Math.floor(offset / PX_PER_MIN / 15) * 15;
    setCreating({ professionalId: pro.id, time: fromMin(minute) });
  };
  const done = () => { setCreating(null); setSelected(null); load(); };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Agenda"
        subtitle="Citas por profesional. Toca un espacio libre para agendar o una cita para verla."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" icon={Link2} onClick={() => setSharing(true)}>Link de reservas</Button>
            <Button variant="secondary" icon={Users} onClick={() => setManaging(true)}>Profesionales</Button>
            <Button icon={Plus} disabled={!services.length || !pros.length} onClick={() => setCreating({})}>Nueva cita</Button>
          </div>
        }
      />

      {activePlaceId && pros.length > 0 && <RemindersCard placeId={activePlaceId} />}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" aria-label="Día anterior" onClick={() => setDate(addDays(date, -1))}><ChevronLeft size={18} aria-hidden /></Button>
        <Button variant={date === todayLima() ? 'primary' : 'secondary'} size="sm" onClick={() => setDate(todayLima())}>Hoy</Button>
        <Button variant="secondary" size="sm" aria-label="Día siguiente" onClick={() => setDate(addDays(date, 1))}><ChevronRight size={18} aria-hidden /></Button>
        <input type="date" aria-label="Ir a la fecha" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="min-h-9 rounded-control border border-border bg-surface px-2 text-sm" />
        <h2 className="text-lg font-semibold capitalize text-text">{longDate(date)}</h2>
        {day && <span className="text-sm text-text-muted">· {day.appointments.filter((a: any) => a.status !== 'CANCELADA').length} citas</span>}
      </div>

      {!day ? (
        <Skeleton className="h-96 rounded-card" />
      ) : !pros.length ? (
        <Card><EmptyState icon={Users} title="Agrega a tu equipo de atención" description="Registra a cada profesional con su silla, sus servicios y su horario. Luego tus clientes pueden reservar con quien prefieran." action={<Button onClick={() => setManaging(true)}>Agregar profesional</Button>} /></Card>
      ) : !services.length ? (
        <Card><EmptyState icon={CalendarDays} title="Agrega tus servicios" description="En Servicios crea cada servicio con su precio y duración (por ejemplo: Corte, 30 min). Con eso se calculan los horarios libres." /></Card>
      ) : (
        <Card padding="sm" className="overflow-x-auto">
          <div className="flex min-w-max">
            {/* Columna de horas */}
            <div className="sticky left-0 z-10 w-14 shrink-0 bg-surface">
              <div className="h-16" />
              <div className="relative" style={{ height: (end - start) * PX_PER_MIN }}>
                {hours.map((h) => (
                  <span key={h} className="absolute -translate-y-2 text-xs tabular-nums text-text-muted" style={{ top: (h - start) * PX_PER_MIN }}>{time12(fromMin(h)).replace(':00', '')}</span>
                ))}
              </div>
            </div>

            {cols.map((pro) => (
              <div key={pro.id} className={`${COL_W} border-l border-border`}>
                <div className="flex h-16 items-center gap-2 px-2">
                  <Avatar name={pro.name} photo={pro.photoUrl} size={36} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text">{pro.name}</p>
                    <p className="truncate text-xs text-text-muted">{pro.station || '—'} · {pro.open ? `${time12(pro.open)}–${time12(pro.close)}` : 'Libre hoy'}</p>
                  </div>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`Agendar con ${pro.name}`}
                  onClick={(e) => pro.open && clickColumn(e, pro)}
                  onKeyDown={(e) => e.key === 'Enter' && pro.open && setCreating({ professionalId: pro.id })}
                  className={`relative ${pro.open ? 'cursor-pointer' : 'cursor-not-allowed'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary`}
                  style={{ height: (end - start) * PX_PER_MIN }}
                >
                  {hours.map((h) => <div key={h} className="absolute inset-x-0 border-t border-border/60" style={{ top: (h - start) * PX_PER_MIN }} />)}
                  {/* Fuera de su horario: gris */}
                  {!pro.open && <div className="absolute inset-0 bg-background/80" />}
                  {pro.open && <div className="absolute inset-x-0 top-0 bg-background/80" style={{ height: y(pro.open) }} />}
                  {pro.close && <div className="absolute inset-x-0 bottom-0 bg-background/80" style={{ top: y(pro.close) }} />}
                  {nowMin !== null && nowMin >= start && nowMin <= end && <div className="absolute inset-x-0 z-10 border-t-2 border-danger" style={{ top: (nowMin - start) * PX_PER_MIN }} aria-hidden />}
                  {day.appointments.filter((a: any) => a.professionalId === pro.id).map((a: any) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelected(a); }}
                      className={`absolute inset-x-1 z-20 overflow-hidden rounded-control border-l-4 px-2 py-1 text-left text-xs shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${STATUS[a.status]?.className ?? ''}`}
                      style={{ top: y(a.time) + 1, height: Math.max(a.durationMin * PX_PER_MIN - 2, 20) }}
                      aria-label={`${time12(a.time)} ${a.customerName}, ${a.serviceName}, ${STATUS[a.status]?.label}`}
                    >
                      <span className="block truncate font-semibold">{time12(a.time)} · {a.customerName}</span>
                      {a.durationMin >= 25 && <span className="block truncate">{a.serviceName}</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {creating && activePlaceId && (
        <NewAppointmentSheet placeId={activePlaceId} services={services} professionals={pros.filter((p) => p.active)} initial={{ date, ...creating }} onClose={() => setCreating(null)} onDone={done} />
      )}
      {selected && activePlaceId && (
        <AppointmentSheet placeId={activePlaceId} appt={selected} professionals={pros.filter((p) => p.active)} onClose={() => setSelected(null)} onDone={done} />
      )}
      {managing && activePlaceId && (
        <ProfessionalsSheet placeId={activePlaceId} professionals={pros} services={services} onClose={() => setManaging(false)} onChanged={() => { loadSetup(); load(); }} />
      )}
      {sharing && activePlaceId && <BookingLinkModal placeId={activePlaceId} onClose={() => setSharing(false)} />}
    </div>
  );
}
