'use client';

import type { AgendaRange } from '../../lib/api-client';
import { STATUS, addDays, fromMin, shortDate, time12, toMin, todayLima } from '../../lib/agenda';
import { Card } from '../ui';

type Appt = AgendaRange['appointments'][number];
const PX_PER_MIN = 1;

/** Carriles por día: dos citas que se cruzan (distintos profesionales) van lado a lado, no encimadas. */
function lanes(list: Appt[]) {
  const ends: number[] = [];
  const placed = list.map((a) => {
    const start = toMin(a.time);
    let lane = ends.findIndex((end) => end <= start);
    if (lane === -1) { lane = ends.length; ends.push(0); }
    ends[lane] = start + a.durationMin;
    return { a, lane };
  });
  return { placed, count: Math.max(ends.length, 1) };
}

/** Semana: 7 columnas (lun–dom) con las citas en bloques por hora. Scroll horizontal solo dentro del calendario. */
export function WeekView({ start, range, onOpen, onPickDay }: { start: string; range: AgendaRange; onOpen(a: Appt): void; onPickDay(date: string): void }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const mins = range.appointments.flatMap((a) => [toMin(a.time), toMin(a.time) + a.durationMin]);
  const from = Math.min(8 * 60, ...mins.map((m) => Math.floor(m / 60) * 60));
  const to = Math.max(20 * 60, ...mins.map((m) => Math.ceil(m / 60) * 60));
  const hours = Array.from({ length: (to - from) / 60 }, (_, i) => from + i * 60);
  const today = todayLima();

  return (
    <Card padding="sm" className="overflow-x-auto">
      <div className="flex min-w-max">
        <div className="sticky left-0 z-10 w-12 shrink-0 bg-surface">
          <div className="h-12" />
          <div className="relative" style={{ height: (to - from) * PX_PER_MIN }}>
            {hours.map((h) => <span key={h} className="absolute -translate-y-2 text-xs tabular-nums text-text-muted" style={{ top: (h - from) * PX_PER_MIN }}>{time12(fromMin(h)).replace(':00', '')}</span>)}
          </div>
        </div>
        {days.map((day) => {
          const list = range.appointments.filter((a) => a.date === day);
          const { placed, count } = lanes(list);
          return (
            <div key={day} className="w-36 shrink-0 border-l border-border sm:w-auto sm:min-w-[8.5rem] sm:flex-1">
              <button type="button" onClick={() => onPickDay(day)}
                className={`flex h-12 w-full flex-col items-center justify-center text-sm capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${day === today ? 'font-semibold text-primary' : 'text-text'}`}>
                {shortDate(day)}
                <span className="text-xs font-normal text-text-muted">{range.byDay[day]?.total ?? 0} citas</span>
              </button>
              <div className="relative" style={{ height: (to - from) * PX_PER_MIN }}>
                {hours.map((h) => <div key={h} className="absolute inset-x-0 border-t border-border/60" style={{ top: (h - from) * PX_PER_MIN }} />)}
                {placed.map(({ a, lane }) => (
                  <button key={a.id} type="button" onClick={() => onOpen(a)}
                    className={`absolute z-20 overflow-hidden rounded-control border-l-4 px-1.5 py-0.5 text-left text-xs shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${STATUS[a.status]?.className ?? ''}`}
                    style={{ top: (toMin(a.time) - from) * PX_PER_MIN + 1, height: Math.max(a.durationMin * PX_PER_MIN - 2, 18), left: `calc(${(lane / count) * 100}% + 2px)`, width: `calc(${100 / count}% - 4px)` }}
                    aria-label={`${shortDate(day)} ${time12(a.time)} ${a.customerName}, ${a.serviceName}, ${a.professional?.name ?? ''}, ${STATUS[a.status]?.label}`}>
                    <span className="block truncate font-semibold">{time12(a.time)} {a.customerName}</span>
                    {a.durationMin >= 40 && <span className="block truncate">{a.serviceName}</span>}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
