'use client';

import type { AgendaRange } from '../../lib/api-client';
import { longDate, monthGrid, todayLima } from '../../lib/agenda';
import { Card } from '../ui';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/** Mes: cuántas citas hay cada día y a cuántos clientes de rutina les toca sin haber reservado. Tocar un día abre su vista Día. */
export function MonthView({ date, range, onPickDay }: { date: string; range: AgendaRange; onPickDay(date: string): void }) {
  const days = monthGrid(date);
  const month = date.slice(0, 7);
  const today = todayLima();

  return (
    <Card padding="sm">
      <div className="grid grid-cols-7 gap-px text-center text-xs font-medium text-text-muted">
        {WEEKDAYS.map((d) => <div key={d} className="py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-control border border-border bg-border">
        {days.map((day) => {
          const counts = range.byDay[day];
          const due = range.recallDue[day] ?? 0;
          const outside = day.slice(0, 7) !== month;
          const label = [longDate(day), `${counts?.total ?? 0} citas`, counts?.reserved ? `${counts.reserved} por atender` : '', counts?.attended ? `${counts.attended} atendidas` : '', due ? `${due} clientes de rutina por volver` : ''].filter(Boolean).join(', ');
          return (
            <button key={day} type="button" onClick={() => onPickDay(day)} aria-label={label}
              className={`flex min-h-16 flex-col items-start gap-0.5 p-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:min-h-24 sm:p-2 ${outside ? 'bg-background text-text-muted' : 'bg-surface text-text hover:bg-primary-soft/40'}`}>
              <span className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${day === today ? 'bg-primary text-white' : ''}`}>{Number(day.slice(8, 10))}</span>
              {!!counts?.total && (
                <span className="text-xs tabular-nums">
                  <span className="font-semibold">{counts.total}</span><span className="hidden sm:inline"> cita{counts.total === 1 ? '' : 's'}</span>
                  {!!counts.attended && <span className="hidden text-success sm:block">{counts.attended} atendida{counts.attended === 1 ? '' : 's'}</span>}
                </span>
              )}
              {due > 0 && (
                <span className="mt-auto inline-flex items-center gap-1 text-[11px] text-text-muted" title={`${due} cliente(s) de rutina sin cita`}>
                  <span className="size-1.5 rounded-full bg-secondary" aria-hidden />{due}<span className="hidden sm:inline"> por volver</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
