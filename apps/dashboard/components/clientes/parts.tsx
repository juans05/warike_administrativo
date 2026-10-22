'use client';

import type { ReactNode } from 'react';
import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Badge, Button, cn, type BadgeProps } from '../ui';
import { maskPhone } from '../../lib/mask';
import type { Contact, LoyaltyCard } from '../../lib/api-client';

export const SOURCE_LABEL: Record<Contact['source'], string> = {
  whatsapp: 'WhatsApp',
  feedback: 'Feedback',
  import: 'Importado',
  order: 'Pedido',
  loyalty: 'Tarjeta',
};

export const LEVEL_LABEL: Record<LoyaltyCard['level'], string> = { BRONCE: 'Bronce', PLATA: 'Plata', ORO: 'Oro', VIP: 'VIP' };
export const LEVEL_TONE: Record<LoyaltyCard['level'], NonNullable<BadgeProps['tone']>> = {
  BRONCE: 'neutral', PLATA: 'neutral', ORO: 'warning', VIP: 'primary',
};

export const formatDate = (iso: string, withTime = false) =>
  new Date(iso).toLocaleString('es-PE', {
    day: 'numeric', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });

/** Los montos de la API vienen en céntimos. */
export const formatSoles = (cents: number) => `S/ ${(cents / 100).toFixed(2)}`;

/** Lo que se muestra del cliente: su nombre o, sin nombre, el celular enmascarado. */
export const displayName = (name: string | null | undefined, phone: string | null | undefined) =>
  name?.trim() || (phone ? maskPhone(phone) : 'Sin nombre');

export function Avatar({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  return (
    <div
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary-hover',
        size === 'lg' ? 'h-14 w-14 text-xl' : 'h-10 w-10 text-base',
      )}
    >
      {(name.trim()[0] ?? '?').toUpperCase()}
    </div>
  );
}

export function ClientRow({ title, subtitle, selected, onSelect, aside }: {
  title: string;
  subtitle: string;
  selected: boolean;
  onSelect(): void;
  aside?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected || undefined}
      className={cn(
        'flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
        selected ? 'bg-primary-soft' : 'hover:bg-background',
      )}
    >
      <Avatar name={title} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-text">{title}</span>
        <span className="block truncate text-xs text-text-muted">{subtitle}</span>
      </span>
      {aside}
    </button>
  );
}

export function Pager({ page, totalPages, onPage }: { page: number; totalPages: number; onPage(page: number): void }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-2 border-t border-border p-3">
      <Button variant="secondary" size="sm" icon={ChevronLeft} disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Anterior
      </Button>
      <span className="text-sm tabular-nums text-text-muted">{page} / {totalPages}</span>
      <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
        Siguiente
        <ChevronRight size={16} aria-hidden />
      </Button>
    </nav>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-base font-semibold text-text">{children}</h3>;
}

/** `granted === null`: el cliente no tiene tarjeta. El estado va con ícono y texto, no solo con color. */
export function ConsentRow({ label, granted }: { label: string; granted: boolean | null }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3">
      <span className="text-sm text-text">{label}</span>
      {granted === null ? (
        <Badge>Sin tarjeta</Badge>
      ) : granted ? (
        <Badge tone="success"><Check size={16} aria-hidden />Acepta</Badge>
      ) : (
        <Badge><X size={16} aria-hidden />No acepta</Badge>
      )}
    </div>
  );
}

export function ClientHeader({ name, phone }: { name: string | null; phone: string | null }) {
  return (
    <header className="flex items-center gap-4">
      <Avatar name={name ?? ''} size="lg" />
      <div className="min-w-0">
        <h2 className="truncate text-xl font-semibold text-text">{name?.trim() || 'Sin nombre'}</h2>
        <p className="text-sm text-text-muted">{maskPhone(phone)}</p>
      </div>
    </header>
  );
}
