import type { ReactNode } from 'react';
import { BarChart3 } from 'lucide-react';
import { Card, EmptyState, Skeleton } from '../ui';

/** Tarjeta de gráfico/tabla: título, descripción y (opcional) controles a la derecha. */
export function ChartCard({ title, description, aside, children }: {
  title: string;
  description: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card padding="lg">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-text">{title}</h3>
          <p className="mt-0.5 text-sm text-text-muted">{description}</p>
        </div>
        {aside}
      </div>
      {children}
    </Card>
  );
}

export function ChartSkeleton({ className = 'h-64' }: { className?: string }) {
  return (
    <div role="status" aria-label="Cargando">
      <Skeleton className={`w-full ${className}`} />
    </div>
  );
}

export function EmptyChart({ title = 'Sin conversaciones en este período' }: { title?: string }) {
  return (
    <EmptyState
      icon={BarChart3}
      title={title}
      description="Cuando haya actividad en las fechas elegidas, la verás aquí."
      headingLevel="h4"
    />
  );
}

/** Tooltip de recharts con los colores del panel. */
export function TooltipBox({ children }: { children: ReactNode }) {
  return <div className="min-w-[140px] rounded-control bg-text px-3 py-2 text-xs text-surface shadow-modal">{children}</div>;
}
