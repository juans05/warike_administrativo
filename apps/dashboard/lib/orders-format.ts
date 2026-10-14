export type OrderStatus = 'PENDIENTE_PAGO' | 'NUEVO' | 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO' | 'CANCELADO';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDIENTE_PAGO: 'Pendiente de pago',
  NUEVO: 'Nuevo',
  EN_PREPARACION: 'En preparación',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

export const soles = (cents: number) => `S/ ${(cents / 100).toFixed(2)}`;

export const minutesSince = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
