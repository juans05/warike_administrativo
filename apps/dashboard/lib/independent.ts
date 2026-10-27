import { toMin } from './agenda';

/** Cita del día tal como la devuelve `agendaApi.day` (solo lo que usa "Hoy"). */
export interface TodayAppt {
  id: string;
  time: string;
  endTime: string;
  status: string;
  serviceName?: string;
  customerName?: string;
  customerPhone?: string | null;
  price?: number;
  notes?: string | null;
  source?: string;
}

const CLOSED = ['ATENDIDA', 'NO_ASISTIO', 'CANCELADA'];

/**
 * Reparte las citas de hoy: la actual (la reservada cuya franja incluye ahora), las pendientes (las abiertas
 * que quedan, incluidas las atrasadas sin marcar y las LISTO por cerrar) y las cerradas.
 */
export function splitToday(appointments: TodayAppt[], nowMin: number): { current: TodayAppt | null; pending: TodayAppt[]; done: TodayAppt[] } {
  const sorted = [...appointments].sort((x, y) => toMin(x.time) - toMin(y.time));
  const done = sorted.filter((x) => CLOSED.includes(x.status));
  const open = sorted.filter((x) => !CLOSED.includes(x.status));
  const current = open.find((x) => x.status === 'RESERVADA' && toMin(x.time) <= nowMin && nowMin < toMin(x.endTime)) ?? null;
  return { current, pending: open.filter((x) => x !== current), done };
}
