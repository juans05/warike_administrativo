import { useId, type ReactNode } from 'react';
import { Card } from '../ui';

/** Tarjeta con encabezado (título, detalle y una acción) y contenido a todo el ancho: listas y tablas. */
export function SectionCard({ title, subtitle, action, children }: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const titleId = useId();
  return (
    <Card role="region" aria-labelledby={titleId} className="overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 id={titleId} className="text-base font-semibold text-text">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </Card>
  );
}
