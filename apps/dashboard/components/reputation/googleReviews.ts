// Leer/responder todas las reseñas usa la API de Google Business Profile, que requiere
// aprobación de Google. Hasta entonces se usa Places API (5 reseñas) y el dueño publica
// su respuesta pegándola en Google. Encender con NEXT_PUBLIC_GBP_API_ENABLED=true.
export const GBP_API_ENABLED = process.env.NEXT_PUBLIC_GBP_API_ENABLED === 'true';
export const GOOGLE_REVIEWS_URL = 'https://business.google.com/reviews';

export const STARS: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

export type GoogleReview = {
  /** Clave estable en la lista: el id de Google o, sin él, la posición. */
  key: string;
  /** Solo existe con la API de Business Profile: sin él no se puede publicar la respuesta. */
  name?: string;
  reviewer?: { displayName?: string; profilePhotoUrl?: string; isAnonymous?: boolean };
  starRating: string;
  comment?: string;
  relativeTimeDescription?: string;
  createTime?: string;
  reviewReply?: { comment: string; updateTime?: string } | null;
};

export function numberToStarRating(n: number) {
  return ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'][Math.min(Math.max(Math.round(n), 1), 5) - 1];
}

export function withKeys(list: Omit<GoogleReview, 'key'>[]): GoogleReview[] {
  return list.map((r, i) => ({ ...r, key: r.name || `r${i}` }));
}

export function reviewDate(review: GoogleReview) {
  if (review.relativeTimeDescription) return review.relativeTimeDescription;
  if (!review.createTime) return '';
  return new Date(review.createTime).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
}
