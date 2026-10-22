import type { BadgeProps } from '../../ui';

export const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible',
  ASSIGNED: 'Asignado',
  SUSPENDED: 'Suspendido',
  DISABLED: 'Desactivado',
};

export const STATUS_TONES: Record<string, NonNullable<BadgeProps['tone']>> = {
  AVAILABLE: 'neutral',
  ASSIGNED: 'success',
  SUSPENDED: 'warning',
  DISABLED: 'danger',
};

export const DESTINATION_LABELS: Record<string, string> = {
  REPUTATION: 'Reputación (Google)',
  MENU: 'Menú digital',
  CUSTOM_URL: 'URL personalizada',
};

export type PhysicalType = 'QR' | 'NFC' | 'TABLET';
