'use client';

import { useState, type ReactNode } from 'react';
import { Check, Mail, MessageCircle, MessageSquare } from 'lucide-react';
import { Badge, Button, DataList, EmptyState, InboxLayout, buttonStyles } from '../ui';
import { InboxRow, shortDate } from '../reputation/InboxRow';
import { ReviewerAvatar } from '../reputation/ReviewerAvatar';
import { Stars } from '../reputation/Stars';
import { FeedbackReply } from './FeedbackReply';
import { useCustomerLabels } from '../../hooks/useCustomerLabels';

/** Estado de una queja (calificación de 1 a 3); las reseñas de 4 y 5 no llevan estado. */
function StatusBadge({ item }: { item: any }) {
  if (item.rating > 3) return null;
  if (item.status === 'resolved') return <Badge tone="success"><Check size={16} aria-hidden />Resuelta</Badge>;
  if (item.status === 'contacted') return <Badge>Contactado</Badge>;
  return <Badge tone="danger">Pendiente</Badge>;
}

/**
 * Bandeja de opiniones dejadas por QR/NFC: lista a la izquierda y, a la derecha, el detalle con la
 * respuesta (IA o a mano). `onResolve` solo se pasa en la bandeja de quejas.
 */
export function FeedbackInbox({ items, loading = false, placeId, onSaved, onResolve, emptyState }: {
  items: any[];
  loading?: boolean;
  placeId: string;
  onSaved(updated: any): void;
  onResolve?(id: string): void;
  emptyState: ReactNode;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { label, customer } = useCustomerLabels();
  const selected = items.find((i) => i.id === selectedId) ?? null;

  const list = (
    <DataList
      items={items}
      loading={loading}
      empty={emptyState}
      renderItem={(item) => (
        <InboxRow
          avatar={<ReviewerAvatar name={item.customerName} />}
          name={item.customerName || `${label} anónimo`}
          date={shortDate(item.createdAt)}
          stars={item.rating}
          snippet={item.comment}
          badge={item.rating <= 3 ? <StatusBadge item={item} /> : undefined}
          selected={item.id === selectedId}
          onSelect={() => setSelectedId(item.id)}
        />
      )}
    />
  );

  const contact: string | undefined = selected?.customerContact;
  const detail = selected && (
    <div key={selected.id} className="space-y-5 p-5">
      <header className="flex items-start gap-4">
        <ReviewerAvatar name={selected.customerName} size="lg" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <h2 className="truncate text-xl font-semibold text-text">{selected.customerName || `${label} anónimo`}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Stars value={selected.rating} />
            <span className="text-sm text-text-muted">{shortDate(selected.createdAt)}</span>
            <StatusBadge item={selected} />
          </div>
        </div>
      </header>

      <p className="rounded-card bg-background p-4 text-sm leading-relaxed text-text">
        {selected.comment || `El ${customer} no dejó ningún comentario.`}
      </p>

      <FeedbackReply placeId={placeId} feedback={selected} onSaved={onSaved} />

      {onResolve && (contact || selected.status === 'pending') && (
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          {contact && (
            <a
              href={contact.includes('@') ? `mailto:${contact}` : `https://wa.me/${contact.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles('secondary', 'md')}
            >
              {contact.includes('@') ? <Mail size={20} aria-hidden /> : <MessageCircle size={20} aria-hidden />}
              Contactar
            </a>
          )}
          {selected.status === 'pending' && (
            <Button variant="secondary" icon={Check} onClick={() => onResolve(selected.id)}>Marcar como resuelta</Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <InboxLayout
      list={list}
      detail={detail || null}
      emptyDetail={
        <div className="flex h-full items-center justify-center">
          <EmptyState icon={MessageSquare} title="Selecciona una opinión" description="Verás el comentario completo y podrás responder con ayuda de la IA." />
        </div>
      }
      onCloseDetail={() => setSelectedId(null)}
    />
  );
}
