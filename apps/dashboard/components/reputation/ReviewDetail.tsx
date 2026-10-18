'use client';

import { useState } from 'react';
import { Copy, Pencil, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { businessApi } from '../../lib/api-client';
import { copyText } from '../../lib/clipboard';
import { Badge, Button, Textarea } from '../ui';
import { GOOGLE_REVIEWS_URL, STARS, reviewDate, type GoogleReview } from './googleReviews';
import { ReviewerAvatar } from './ReviewerAvatar';
import { Stars } from './Stars';
import { useCustomerLabels } from '../../hooks/useCustomerLabels';

function Sentiment({ stars }: { stars: number }) {
  if (stars >= 4) return <Badge tone="success">Positiva</Badge>;
  if (stars === 3) return <Badge>Neutral</Badge>;
  return <Badge tone="danger">Negativa</Badge>;
}

/**
 * Detalle de una reseña de Google: comentario, respuesta publicada y editor de respuesta.
 * El borrador vive en la bandeja (`draft`) para no perderlo al cambiar de reseña.
 */
export function ReviewDetail({ review, placeId, draft, onDraft, onReplied }: {
  review: GoogleReview;
  placeId: string;
  /** `undefined`: sin edición en curso (solo si ya hay una respuesta publicada). */
  draft: string | undefined;
  onDraft(value: string | undefined): void;
  onReplied(reviewName: string, comment: string): void;
}) {
  const stars = STARS[review.starRating] ?? 1;
  const { customer } = useCustomerLabels();
  const name = review.reviewer?.displayName || 'Usuario de Google';
  const [busy, setBusy] = useState<'suggest' | 'publish' | null>(null);
  const editing = draft !== undefined || !review.reviewReply;
  const text = draft ?? '';

  const suggest = async () => {
    setBusy('suggest');
    try {
      const res = await businessApi.suggestGoogleReply(placeId, {
        comment: review.comment,
        stars,
        reviewerName: review.reviewer?.isAnonymous ? undefined : review.reviewer?.displayName,
      });
      onDraft(res.reply);
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo generar la sugerencia');
    }
    setBusy(null);
  };

  // Sin API: copiar en el mismo clic y luego abrir Google (el foco cambia de pestaña).
  const copyAndOpen = () => {
    const ok = copyText(text.trim());
    window.open(GOOGLE_REVIEWS_URL, '_blank', 'noopener,noreferrer');
    if (ok) {
      toast.success(`Respuesta copiada. En Google busca la reseña de ${review.reviewer?.displayName || `tu ${customer}`}, toca Responder y pega.`, { duration: 8000 });
    } else {
      toast.error('No pudimos copiar el texto. Selecciónalo y cópialo manualmente.');
    }
  };

  const publish = async () => {
    setBusy('publish');
    try {
      await businessApi.replyGoogleReview(placeId, review.name!, text.trim());
      onReplied(review.name!, text.trim());
      onDraft(undefined);
      toast.success('Respuesta publicada en Google');
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo publicar la respuesta');
    }
    setBusy(null);
  };

  return (
    <div className="space-y-5 p-5">
      <header className="flex items-start gap-4">
        <ReviewerAvatar name={name} photoUrl={review.reviewer?.profilePhotoUrl} size="lg" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <h2 className="truncate text-xl font-semibold text-text">{name}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Stars value={stars} />
            <Sentiment stars={stars} />
            <Badge tone="neutral">Google Maps</Badge>
          </div>
          {reviewDate(review) && <p className="text-sm text-text-muted">{reviewDate(review)}</p>}
        </div>
      </header>

      <p className="rounded-card bg-background p-4 text-sm leading-relaxed text-text">
        {review.comment || `El ${customer} no dejó ningún comentario.`}
      </p>

      {review.reviewReply && !editing && (
        <div className="space-y-3">
          <div className="space-y-1 border-l-4 border-primary pl-4">
            <p className="text-xs font-medium text-primary-hover">Tu respuesta</p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-text">{review.reviewReply.comment}</p>
          </div>
          <Button variant="secondary" icon={Pencil} onClick={() => onDraft(review.reviewReply!.comment)}>
            Editar respuesta
          </Button>
        </div>
      )}

      {editing && (
        <div className="space-y-3">
          <Textarea
            label="Respuesta"
            value={text}
            onChange={(e) => onDraft(e.target.value)}
            maxLength={4000}
            rows={6}
            placeholder="Escribe tu respuesta pública..."
            hint={review.name ? 'Se publica en Google con el nombre de tu negocio.' : 'Aún no publicamos directo en Google: copiamos tu respuesta y abrimos Google para que la pegues.'}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={Sparkles} loading={busy === 'suggest'} disabled={busy !== null} onClick={suggest}>
              {busy === 'suggest' ? 'Pensando...' : 'Generar respuesta con IA'}
            </Button>
            {review.name ? (
              <Button icon={Send} loading={busy === 'publish'} disabled={busy !== null || !text.trim()} onClick={publish}>
                {busy === 'publish' ? 'Publicando...' : 'Publicar en Google'}
              </Button>
            ) : (
              <Button icon={Copy} disabled={busy !== null || !text.trim()} onClick={copyAndOpen}>
                Copiar y abrir Google
              </Button>
            )}
            {review.reviewReply && (
              <Button variant="ghost" disabled={busy !== null} onClick={() => onDraft(undefined)}>
                Cancelar
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
