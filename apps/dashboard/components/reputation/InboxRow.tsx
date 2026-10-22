import type { ReactNode } from 'react';
import { cn } from '../ui';
import { Stars } from './Stars';

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });

/** Fila de una bandeja de opiniones: quién, cuándo, cuántas estrellas y el inicio del comentario. */
export function InboxRow({ avatar, name, date, stars, snippet, badge, selected, onSelect }: {
  avatar: ReactNode;
  name: string;
  date: string;
  stars: number;
  snippet?: string | null;
  badge?: ReactNode;
  selected: boolean;
  onSelect(): void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected || undefined}
      className={cn(
        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-200 motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
        selected ? 'bg-primary-soft' : 'hover:bg-background',
      )}
    >
      {avatar}
      <span className="min-w-0 flex-1 space-y-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium text-text">{name}</span>
          <span className="shrink-0 text-xs text-text-muted">{date}</span>
        </span>
        <Stars value={stars} />
        <span className="block truncate text-sm text-text-muted">{snippet || 'Sin comentario'}</span>
        {badge && <span className="block pt-0.5">{badge}</span>}
      </span>
    </button>
  );
}
