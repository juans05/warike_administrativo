import { Bell, ChefHat, CheckCircle2, PackageCheck, Wallet, XCircle, type LucideIcon } from 'lucide-react';
import { STATUS_LABEL, type OrderStatus } from '../../lib/orders-format';

// Solo panel (Pedidos y Cocina). El estado se lee por color, ícono y texto: nunca solo por color.
export const STATUS_META: Record<OrderStatus, { icon: LucideIcon; className: string }> = {
  PENDIENTE_PAGO: { icon: Wallet, className: 'bg-background text-text border-border' },
  NUEVO: { icon: Bell, className: 'bg-primary-soft text-primary-hover border-primary/30' },
  EN_PREPARACION: { icon: ChefHat, className: 'bg-secondary/20 text-text border-secondary/60' },
  LISTO: { icon: CheckCircle2, className: 'bg-success/10 text-success border-success/30' },
  ENTREGADO: { icon: PackageCheck, className: 'bg-background text-text-muted border-border' },
  CANCELADO: { icon: XCircle, className: 'bg-danger/10 text-danger border-danger/30' },
};

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status];
  if (!meta) return <span className="text-base text-text">{status}</span>;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-base font-semibold ${meta.className}`}>
      <Icon size={20} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}
