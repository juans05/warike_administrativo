import { chartColors } from './chartColors';

export type ConversationStatus = 'attended' | 'unassigned' | 'pending' | 'resolved';

// Un color de token fijo por estado, en el mismo orden en todas las vistas (donut, gráfico por día,
// filtros). Nunca reordenar ni reasignar por dato o filtro: la identidad tiene que ser consistente.
export const STATUS_COLORS: Record<ConversationStatus, string> = {
  attended: chartColors.textMuted,
  unassigned: chartColors.primary,
  pending: chartColors.secondary,
  resolved: chartColors.success,
};

export const STATUS_LABELS: Record<ConversationStatus, string> = {
  attended: 'Atendidas',
  unassigned: 'Sin asignar',
  pending: 'Pendientes',
  resolved: 'Resueltas',
};

// Mismo estado, mismo tono de Badge (la leyenda siempre lleva texto, no solo color).
export const STATUS_TONE = {
  attended: 'neutral',
  unassigned: 'primary',
  pending: 'warning',
  resolved: 'success',
} as const;
