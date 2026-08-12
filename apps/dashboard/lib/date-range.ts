export type DateRangePreset = 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
}

export const PRESET_LABELS: Record<DateRangePreset, string> = {
  today: 'Hoy',
  yesterday: 'Ayer',
  last7: 'Últimos 7 días',
  last30: 'Últimos 30 días',
  thisMonth: 'Este mes',
  lastMonth: 'Mes anterior',
  custom: 'Personalizado',
};

export const PRESET_ORDER: DateRangePreset[] = ['today', 'yesterday', 'last7', 'last30', 'thisMonth', 'lastMonth', 'custom'];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function computeRangeForPreset(preset: DateRangePreset, customFrom?: string, customTo?: string): DateRange {
  const now = new Date();
  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case 'last7': {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return { from: startOfDay(from), to: endOfDay(now) };
    }
    case 'last30': {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      return { from: startOfDay(from), to: endOfDay(now) };
    }
    case 'thisMonth': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: startOfDay(from), to: endOfDay(now) };
    }
    case 'lastMonth': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: startOfDay(from), to: endOfDay(to) };
    }
    case 'custom':
    default:
      return {
        from: customFrom ? startOfDay(new Date(customFrom)) : startOfDay(now),
        to: customTo ? endOfDay(new Date(customTo)) : endOfDay(now),
      };
  }
}

export function formatDateInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatDateLabel(d: Date) {
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

export function formatSeconds(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '—';
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m} min ${sec} seg`;
  return `${sec} seg`;
}
