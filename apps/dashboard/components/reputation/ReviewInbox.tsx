'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Info, MessageSquare, Search } from 'lucide-react';
import { Badge, Button, Card, DataList, EmptyState, InboxLayout, Input, Select } from '../ui';
import { GBP_API_ENABLED, STARS, reviewDate, type GoogleReview } from './googleReviews';
import { InboxRow } from './InboxRow';
import { ReviewDetail, type AutoReply } from './ReviewDetail';
import { reputacionApi } from '../../lib/api-client';
import { ReviewerAvatar } from './ReviewerAvatar';
import { useCustomerLabels } from '../../hooks/useCustomerLabels';

type RatingFilter = 'all' | 'low' | 'high';
type StatusFilter = 'all' | 'unanswered' | 'answered';

/** Bandeja de reseñas de Google: filtros arriba, lista a la izquierda y detalle con respuesta a la derecha. */
export function ReviewInbox({ reviews, rating, total, placeId, isBusy, onConnect, onReplied }: {
  reviews: GoogleReview[];
  rating: number;
  total: number;
  placeId: string;
  isBusy: boolean;
  onConnect(): void;
  onReplied(reviewName: string, comment: string): void;
}) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const { customers } = useCustomerLabels();
  const [drafts, setDrafts] = useState<Record<string, string | undefined>>({});
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [autoReplies, setAutoReplies] = useState<Map<string, AutoReply>>(new Map());

  // Estado de las respuestas automáticas (programadas, publicadas, sin cupo, con error) por reseña.
  const loadAutoReplies = useCallback(() => {
    if (!GBP_API_ENABLED) return;
    reputacionApi.replies(placeId)
      .then((rows: AutoReply[]) => {
        // La lista viene de la más nueva a la más antigua: se queda la fila más reciente por reseña.
        const byName = new Map<string, AutoReply>();
        for (const r of rows ?? []) if (r.reviewName && !byName.has(r.reviewName)) byName.set(r.reviewName, r);
        setAutoReplies(byName);
      })
      .catch(() => setAutoReplies(new Map()));
  }, [placeId]);
  useEffect(loadAutoReplies, [loadAutoReplies]);

  // Con la API de Business Profile cada reseña trae `name` y se puede responder desde aquí.
  const canReply = reviews.some((r) => r.name);
  const counts = useMemo(() => ({
    unanswered: reviews.filter((r) => !r.reviewReply).length,
    low: reviews.filter((r) => (STARS[r.starRating] ?? 0) <= 3).length,
  }), [reviews]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = reviews.filter((r) => {
      const stars = STARS[r.starRating] ?? 0;
      if (ratingFilter === 'low' && stars > 3) return false;
      if (ratingFilter === 'high' && stars <= 3) return false;
      if (statusFilter === 'unanswered' && r.reviewReply) return false;
      if (statusFilter === 'answered' && !r.reviewReply) return false;
      return !q || `${r.reviewer?.displayName ?? ''} ${r.comment ?? ''}`.toLowerCase().includes(q);
    });
    // Primero las negativas sin responder: son las que más urgen.
    const urgent = (r: GoogleReview) => (!r.reviewReply && (STARS[r.starRating] ?? 5) <= 3 ? 0 : 1);
    return canReply ? [...list].sort((a, b) => urgent(a) - urgent(b)) : list;
  }, [reviews, ratingFilter, statusFilter, search, canReply]);

  const selected = reviews.find((r) => r.key === selectedKey) ?? null;
  const filtered = ratingFilter !== 'all' || statusFilter !== 'all' || search.trim() !== '';

  const list = (
    <>
      <div className="sticky top-0 z-10 border-b border-border bg-surface px-4 py-3">
        <p className="text-sm font-medium tabular-nums text-text">{visible.length} {visible.length === 1 ? 'reseña' : 'reseñas'}</p>
        <p className="text-xs text-text-muted">
          {rating > 0 ? `${rating.toFixed(1)} de 5` : 'Sin calificación'} · {total} en Google
        </p>
      </div>
      <DataList
        items={visible}
        empty={
          <EmptyState
            icon={Search}
            title={filtered ? 'Ninguna reseña coincide' : 'Aún no tienes reseñas en Google Maps'}
            description={filtered ? 'Prueba quitando algún filtro.' : `Cuando tus ${customers} te califiquen en Google, las verás aquí.`}
            headingLevel="h3"
          />
        }
        renderItem={(review) => {
          const stars = STARS[review.starRating] ?? 1;
          const name = review.reviewer?.displayName || 'Usuario de Google';
          return (
            <InboxRow
              avatar={<ReviewerAvatar name={name} photoUrl={review.reviewer?.profilePhotoUrl} />}
              name={name}
              date={reviewDate(review)}
              stars={stars}
              snippet={review.comment}
              badge={canReply ? (
                review.reviewReply
                  ? <Badge tone="success">Respondida</Badge>
                  : <Badge tone={stars <= 3 ? 'danger' : 'warning'}>Sin responder</Badge>
              ) : undefined}
              selected={review.key === selectedKey}
              onSelect={() => setSelectedKey(review.key)}
            />
          );
        }}
      />
    </>
  );

  const detail = selected && (
    <ReviewDetail
      key={selected.key}
      review={selected}
      placeId={placeId}
      draft={drafts[selected.key]}
      onDraft={(value) => setDrafts((prev) => ({ ...prev, [selected.key]: value }))}
      onReplied={(name, comment) => { onReplied(name, comment); loadAutoReplies(); }}
      autoReply={selected.name ? autoReplies.get(selected.name) : undefined}
      onAutoChanged={loadAutoReplies}
    />
  );

  return (
    <div className="space-y-4">
      {canReply ? (
        <Card padding="sm">
          <div className="grid gap-3 sm:grid-cols-3">
            <Select label="Calificación" value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value as RatingFilter)}>
              <option value="all">Todas ({reviews.length})</option>
              <option value="low">1 a 3 estrellas ({counts.low})</option>
              <option value="high">4 y 5 estrellas ({reviews.length - counts.low})</option>
            </Select>
            <Select label="Estado" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
              <option value="all">Todas</option>
              <option value="unanswered">Sin responder ({counts.unanswered})</option>
              <option value="answered">Respondidas ({reviews.length - counts.unanswered})</option>
            </Select>
            <Input label="Buscar" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nombre o comentario" />
          </div>
        </Card>
      ) : (
        reviews.length > 0 && (
          <Card padding="sm" className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-start gap-2 text-sm text-text">
              <Info size={20} aria-hidden className="mt-0.5 shrink-0 text-primary" />
              <span>
                Estas son las reseñas más relevantes de Google. Elige una: la IA te sugiere el texto, lo copiamos y abrimos Google para que lo pegues.
              </span>
            </p>
            {GBP_API_ENABLED && (
              <Button variant="secondary" size="sm" loading={isBusy} onClick={onConnect}>
                {isBusy ? 'Redirigiendo...' : 'Conectar con Google'}
              </Button>
            )}
          </Card>
        )
      )}

      <InboxLayout
        list={list}
        detail={detail || null}
        emptyDetail={
          <div className="flex h-full items-center justify-center">
            <EmptyState icon={MessageSquare} title="Selecciona una reseña" description="Verás el comentario completo y podrás responderlo con ayuda de la IA." />
          </div>
        }
        onCloseDetail={() => setSelectedKey(null)}
      />
    </div>
  );
}
