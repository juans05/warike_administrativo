'use client';

import { Input, Switch } from '../ui';

export interface DaySchedule {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export const DEFAULT_SCHEDULES: DaySchedule[] = [
  { day: 'Lunes', isOpen: true, openTime: '12:00', closeTime: '23:00' },
  { day: 'Martes', isOpen: true, openTime: '12:00', closeTime: '23:00' },
  { day: 'Miércoles', isOpen: true, openTime: '12:00', closeTime: '23:00' },
  { day: 'Jueves', isOpen: true, openTime: '12:00', closeTime: '23:00' },
  { day: 'Viernes', isOpen: true, openTime: '12:00', closeTime: '23:00' },
  { day: 'Sábado', isOpen: true, openTime: '12:00', closeTime: '23:00' },
  { day: 'Domingo', isOpen: false, openTime: '12:00', closeTime: '23:00' },
];

export function ScheduleEditor({ schedules, onChange }: { schedules: DaySchedule[]; onChange: (schedules: DaySchedule[]) => void }) {
  const patch = (index: number, change: Partial<DaySchedule>) =>
    onChange(schedules.map((s, i) => (i === index ? { ...s, ...change } : s)));

  return (
    <ul className="divide-y divide-border">
      {schedules.map((schedule, idx) => (
        <li key={schedule.day} className="grid grid-cols-1 items-end gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]">
          <Switch label={schedule.day} checked={schedule.isOpen} onChange={(isOpen) => patch(idx, { isOpen })} />
          {schedule.isOpen ? (
            <>
              <Input label="Apertura" aria-label={`Apertura ${schedule.day}`} type="time" value={schedule.openTime} onChange={(e) => patch(idx, { openTime: e.target.value })} />
              <Input label="Cierre" aria-label={`Cierre ${schedule.day}`} type="time" value={schedule.closeTime} onChange={(e) => patch(idx, { closeTime: e.target.value })} />
            </>
          ) : (
            <p className="text-sm text-text-muted sm:col-span-2 sm:pb-3">Cerrado</p>
          )}
        </li>
      ))}
    </ul>
  );
}
