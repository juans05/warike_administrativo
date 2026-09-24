'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRestaurant } from '../context/RestaurantContext';
import { businessApi } from '../lib/api-client';
import { toast } from 'sonner';

type Step = 'loading' | 'not_connected' | 'pick_location' | 'connected' | 'error';
type Filter = 'all' | 'unanswered' | 'negative';

const STARS: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

// Errores devueltos por el callback de OAuth (?error=...) o por el backend (code).
const ERROR_TEXT: Record<string, string> = {
  access_denied: 'Cancelaste la conexión con Google.',
  invalid_state: 'El enlace de conexión expiró. Vuelve a intentarlo.',
  forbidden: 'Este local no pertenece a tu cuenta.',
  token_failed: 'Google no entregó el acceso. Vuelve a intentarlo.',
};
// Errores que se resuelven volviendo a conectar la cuenta.
const RECONNECT_CODES = new Set(['token_expired', 'not_connected', 'permission_denied']);

function numberToStarRating(n: number) {
  return ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'][Math.min(Math.max(Math.round(n), 1), 5) - 1];
}

function formatDate(review: any) {
  if (review.relativeTimeDescription) return review.relativeTimeDescription;
  if (!review.createTime) return '';
  return new Date(review.createTime).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function GoogleReviews({ refreshKey }: { refreshKey?: number }) {
  const { activePlaceId } = useRestaurant();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>('loading');
  const [reviews, setReviews] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [rating, setRating] = useState(0);
  const [total, setTotal] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (!activePlaceId) return;
    const oauthError = searchParams.get('error');
    if (oauthError) {
      toast.error(ERROR_TEXT[oauthError] || 'No se pudo conectar con Google.');
      router.replace('/reputacion');
    }
    if (searchParams.get('connected') === 'true') {
      router.replace('/reputacion');
      loadLocations();
    } else {
      checkConnectionAndLoad();
    }
  }, [activePlaceId, refreshKey]);

  const fail = (e: any) => {
    setError({ code: e?.code, message: e?.message || 'No se pudieron cargar las reseñas de Google.' });
    setStep('error');
  };

  const checkConnectionAndLoad = async () => {
    setStep('loading');
    try {
      const profile = await businessApi.getProfile(activePlaceId!);
      if (profile.googleLocationName) {
        await fetchAllReviews(profile);
      } else if (profile.googleConnected) {
        await loadLocations();
      } else if (profile.googlePlaceId) {
        await fetchPersistedReviews(profile);
      } else {
        setStep('not_connected');
      }
    } catch (e) {
      fail(e);
    }
  };

  // Solo lectura: reseñas de Places API (máx. 5), sin posibilidad de responder.
  const fetchPersistedReviews = async (profile: any) => {
    const rows = await businessApi.getPersistedGoogleReviews(activePlaceId!);
    if (!rows || rows.length === 0) { setStep('not_connected'); return; }
    setReviews(rows.map((r: any) => ({
      reviewer: { displayName: r.authorName, profilePhotoUrl: r.authorPhotoUrl },
      starRating: numberToStarRating(r.rating),
      comment: r.text,
      relativeTimeDescription: r.relativeTimeDescription,
    })));
    setRating(profile.googleRating ? parseFloat(profile.googleRating) : 0);
    setTotal(profile.googleTotalReviews || rows.length);
    setStep('connected');
  };

  const loadLocations = async () => {
    setStep('loading');
    try {
      const res = await businessApi.getGoogleLocations(activePlaceId!);
      if (res.locations?.length) {
        setLocations(res.locations);
        setStep('pick_location');
      } else {
        fail({ code: 'permission_denied', message: 'Tu cuenta de Google no administra ningún negocio verificado.' });
      }
    } catch (e) {
      fail(e);
    }
  };

  const fetchAllReviews = async (profile?: any) => {
    setStep('loading');
    try {
      const res = await businessApi.getAllGoogleReviews(activePlaceId!);
      setReviews(res.reviews || []);
      setTotal(res.total || 0);
      if (res.averageRating) {
        setRating(res.averageRating);
      } else {
        const p = profile ?? await businessApi.getProfile(activePlaceId!);
        setRating(p.googleRating ? parseFloat(p.googleRating) : 0);
      }
      setStep('connected');
    } catch (e) {
      fail(e);
    }
  };

  const handleConnect = async () => {
    setIsBusy(true);
    try {
      const res = await businessApi.getGoogleAuthUrl(activePlaceId!);
      window.location.href = res.url;
    } catch (e: any) {
      toast.error(e?.message || 'Error al generar el enlace de Google');
      setIsBusy(false);
    }
  };

  const handlePickLocation = async (locationName: string) => {
    setIsBusy(true);
    try {
      await businessApi.setGoogleLocation(activePlaceId!, locationName);
      await fetchAllReviews();
    } catch {
      toast.error('Error al guardar la ubicación');
    }
    setIsBusy(false);
  };

  const onReplied = (reviewName: string, comment: string) => {
    setReviews((prev) => prev.map((r) =>
      r.name === reviewName ? { ...r, reviewReply: { comment, updateTime: new Date().toISOString() } } : r));
  };

  const canReply = reviews.some((r) => r.name);
  const counts = useMemo(() => ({
    unanswered: reviews.filter((r) => !r.reviewReply).length,
    negative: reviews.filter((r) => (STARS[r.starRating] ?? 0) <= 3).length,
  }), [reviews]);

  const visible = useMemo(() => {
    const list = reviews.filter((r) =>
      filter === 'unanswered' ? !r.reviewReply
        : filter === 'negative' ? (STARS[r.starRating] ?? 0) <= 3
          : true);
    // Primero las negativas sin responder: son las que más urgen.
    const urgent = (r: any) => (!r.reviewReply && (STARS[r.starRating] ?? 5) <= 3 ? 0 : 1);
    return canReply ? [...list].sort((a, b) => urgent(a) - urgent(b)) : list;
  }, [reviews, filter, canReply]);

  const header = (subtitle: React.ReactNode) => (
    <div>
      <h2 className="text-3xl font-black text-[var(--text)] font-warike italic">Reseñas de Google</h2>
      {subtitle}
    </div>
  );

  // ── LOADING ──────────────────────────────────────────────────────────────
  if (step === 'loading') return (
    <div className="text-center py-10 font-bold text-gray-400">Cargando reseñas de Google...</div>
  );

  // ── ERROR ────────────────────────────────────────────────────────────────
  if (step === 'error') return (
    <div className="space-y-8">
      {header(null)}
      <div className="bg-red-50 border border-red-200 rounded-[2rem] p-8 space-y-4">
        <p className="font-black text-red-700 text-sm">{error?.message}</p>
        <div className="flex flex-wrap gap-3">
          {RECONNECT_CODES.has(error?.code || '') || error?.code === 'location_missing' ? (
            <button
              onClick={error?.code === 'location_missing' ? loadLocations : handleConnect}
              disabled={isBusy}
              className="flex items-center gap-3 py-3 px-5 bg-white border border-gray-300 rounded-2xl shadow-sm hover:shadow-md disabled:opacity-50"
            >
              <GoogleIcon />
              <span className="text-sm font-black text-[#3c4043]">
                {error?.code === 'location_missing' ? 'Elegir mi negocio' : isBusy ? 'Redirigiendo...' : 'Volver a conectar Google'}
              </span>
            </button>
          ) : (
            <button onClick={checkConnectionAndLoad} className="py-3 px-5 rounded-2xl bg-white border border-red-200 text-sm font-black text-red-700">
              Reintentar
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ── NOT CONNECTED ────────────────────────────────────────────────────────
  if (step === 'not_connected') return (
    <div className="space-y-8">
      {header(<p className="text-[var(--text-muted)] font-bold text-sm mt-1">Conecta tu cuenta para ver y responder todas tus reseñas</p>)}

      <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-8 space-y-4">
        <div className="flex items-start gap-4">
          <span className="text-3xl">⚠️</span>
          <div className="space-y-2">
            <p className="font-black text-amber-800 text-sm">Tu negocio debe estar verificado en Google</p>
            <p className="text-amber-700 font-bold text-xs leading-relaxed">
              Para acceder a todas tus reseñas, necesitas ser el propietario verificado del negocio en Google Business Profile.
            </p>
            <ol className="text-amber-700 font-bold text-xs leading-loose list-decimal pl-4 space-y-1">
              <li>Ir a <span className="font-black">business.google.com</span></li>
              <li>Iniciar sesión con la cuenta Google del negocio</li>
              <li>Verificar el negocio (carta postal, llamada o SMS)</li>
              <li>Una vez verificado, conectar aquí abajo</li>
            </ol>
          </div>
        </div>
        <a
          href="https://business.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-[10px] font-black text-amber-600 uppercase tracking-widest hover:underline"
        >
          Abrir Google Business Profile →
        </a>
      </div>

      <button
        onClick={handleConnect}
        disabled={isBusy}
        className="flex items-center justify-center gap-3 w-full py-5 px-6 bg-white border border-gray-300 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
      >
        <GoogleIcon />
        <span className="text-sm font-black text-[#3c4043]">
          {isBusy ? 'Redirigiendo...' : 'Conectar con Google Business'}
        </span>
      </button>
    </div>
  );

  // ── PICK LOCATION ────────────────────────────────────────────────────────
  if (step === 'pick_location') return (
    <div className="space-y-8">
      {header(<p className="text-[var(--text-muted)] font-bold text-sm mt-1">Selecciona cuál es tu negocio</p>)}

      <div className="bg-white border border-border rounded-[2rem] divide-y divide-gray-100 overflow-hidden">
        {locations.map((loc) => (
          <button
            key={loc.locationName}
            onClick={() => handlePickLocation(loc.locationName)}
            disabled={isBusy}
            className="w-full text-left px-8 py-5 hover:bg-gray-50 transition-colors disabled:opacity-50 space-y-1"
          >
            <p className="font-black text-text text-sm">{loc.title}</p>
            {loc.address && <p className="text-xs font-bold text-text-muted">{loc.address}</p>}
          </button>
        ))}
      </div>
    </div>
  );

  // ── CONNECTED — SHOW ALL REVIEWS ─────────────────────────────────────────
  return (
    <div className="space-y-8">
      {header(
        <div className="flex items-center gap-3 mt-2">
          <span className="text-yellow-400 text-xl font-black">{rating > 0 ? rating.toFixed(1) : '—'} ⭐</span>
          <p className="text-[var(--text-muted)] font-bold text-xs uppercase tracking-widest">{total} reseñas totales</p>
        </div>
      )}

      {canReply ? (
        <div className="flex flex-wrap gap-2">
          {([
            ['all', `Todas (${reviews.length})`],
            ['unanswered', `Sin responder (${counts.unanswered})`],
            ['negative', `1-3 estrellas (${counts.negative})`],
          ] as [Filter, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest border transition-colors ${filter === key ? 'bg-primary text-white border-primary' : 'bg-white text-text-muted border-border hover:border-primary'}`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : reviews.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-bold text-blue-700">Ves solo las últimas reseñas. Conecta Google Business para ver todas y responderlas.</p>
          <button onClick={handleConnect} disabled={isBusy} className="text-[10px] font-black text-blue-700 uppercase tracking-widest hover:underline">
            {isBusy ? 'Redirigiendo...' : 'Conectar →'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visible.length === 0 ? (
          <div className="md:col-span-2 bg-gray-50 p-12 rounded-[2.5rem] border border-dashed border-gray-200 text-center">
            <p className="text-gray-400 font-bold italic">
              {reviews.length === 0 ? 'Aún no tienes reseñas en Google Maps.' : 'No hay reseñas con este filtro. 🎉'}
            </p>
          </div>
        ) : (
          visible.map((review, idx) => (
            <ReviewCard key={review.name || idx} review={review} placeId={activePlaceId!} onReplied={onReplied} />
          ))
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review, placeId, onReplied }: {
  review: any;
  placeId: string;
  onReplied: (reviewName: string, comment: string) => void;
}) {
  const stars = STARS[review.starRating] ?? 1;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState<'suggest' | 'publish' | null>(null);

  const startEditing = () => {
    setDraft(review.reviewReply?.comment || '');
    setEditing(true);
  };

  const suggest = async () => {
    setBusy('suggest');
    try {
      const res = await businessApi.suggestGoogleReply(placeId, {
        comment: review.comment,
        stars,
        reviewerName: review.reviewer?.isAnonymous ? undefined : review.reviewer?.displayName,
      });
      setDraft(res.reply);
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo generar la sugerencia');
    }
    setBusy(null);
  };

  const publish = async () => {
    setBusy('publish');
    try {
      await businessApi.replyGoogleReview(placeId, review.name, draft.trim());
      onReplied(review.name, draft.trim());
      setEditing(false);
      toast.success('Respuesta publicada en Google');
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo publicar la respuesta');
    }
    setBusy(null);
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm space-y-6 hover:shadow-xl transition-all">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          {review.reviewer?.profilePhotoUrl ? (
            <img src={review.reviewer.profilePhotoUrl} className="w-12 h-12 rounded-2xl object-cover" alt="" />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-lg">
              {(review.reviewer?.displayName || '?')[0]}
            </div>
          )}
          <div>
            <p className="font-black text-[var(--text)] text-base">{review.reviewer?.displayName}</p>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{formatDate(review)}</p>
          </div>
        </div>
        <div className="flex gap-1 text-yellow-400 text-sm" aria-label={`${stars} estrellas`}>
          {Array.from({ length: stars }).map((_, i) => <span key={i}>⭐</span>)}
        </div>
      </div>

      {review.comment && (
        <div className="bg-[var(--background)] p-6 rounded-3xl border border-[var(--border)] italic text-[var(--text-muted)] text-sm font-bold leading-relaxed">
          "{review.comment}"
        </div>
      )}

      {review.reviewReply && !editing && (
        <div className="border-l-4 border-primary pl-4 space-y-1">
          <p className="text-[10px] font-black text-primary uppercase tracking-widest">Tu respuesta</p>
          <p className="text-sm font-bold text-[var(--text)] leading-relaxed">{review.reviewReply.comment}</p>
        </div>
      )}

      {editing && (
        <div className="space-y-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={4000}
            rows={4}
            placeholder="Escribe tu respuesta pública..."
            aria-label="Respuesta a la reseña"
            className="input-premium w-full resize-none py-4 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={suggest}
              disabled={busy !== null}
              className="px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest bg-primary/10 text-primary disabled:opacity-50"
            >
              {busy === 'suggest' ? 'Pensando...' : '✨ Sugerir con IA'}
            </button>
            <button
              onClick={publish}
              disabled={busy !== null || !draft.trim()}
              className="px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest bg-primary text-white disabled:opacity-50"
            >
              {busy === 'publish' ? 'Publicando...' : 'Publicar en Google'}
            </button>
            <button
              onClick={() => setEditing(false)}
              disabled={busy !== null}
              className="px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest text-text-muted"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest bg-blue-50 text-blue-600">
          Google Maps
        </span>
        {review.name && !editing && (
          <button onClick={startEditing} className="text-[11px] font-black text-primary uppercase tracking-widest hover:underline">
            {review.reviewReply ? 'Editar respuesta' : 'Responder'}
          </button>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}
