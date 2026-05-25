'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRestaurant } from '../context/RestaurantContext';
import { businessApi } from '../lib/api-client';

type Step = 'loading' | 'not_connected' | 'pick_location' | 'connected';

function numberToStarRating(n: number) {
  return ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'][Math.min(Math.max(Math.round(n), 1), 5) - 1];
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

  // Detect redirect back from Google OAuth
  useEffect(() => {
    if (!activePlaceId) return;
    const connected = searchParams.get('connected');
    if (connected === 'true') {
      router.replace('/reputacion');
      loadLocations();
    } else {
      checkConnectionAndLoad();
    }
  }, [activePlaceId, refreshKey]);

  const checkConnectionAndLoad = async () => {
    setStep('loading');
    try {
      const profile = await businessApi.getProfile(activePlaceId!);
      if (profile.googleLocationName) {
        await fetchAllReviews();
      } else if (profile.googleConnected) {
        await loadLocations();
      } else if (profile.googlePlaceId) {
        await fetchPersistedReviews(profile);
      } else {
        setStep('not_connected');
      }
    } catch {
      setStep('not_connected');
    }
  };

  const fetchPersistedReviews = async (profile?: any) => {
    try {
      const rows = await businessApi.getPersistedGoogleReviews(activePlaceId!);
      if (!rows || rows.length === 0) { setStep('not_connected'); return; }

      const normalized = rows.map((r: any) => ({
        reviewer: { displayName: r.authorName, profilePhotoUrl: r.authorPhotoUrl },
        starRating: numberToStarRating(r.rating),
        comment: r.text,
        relativeTimeDescription: r.relativeTimeDescription,
      }));

      setReviews(normalized);

      if (!profile) profile = await businessApi.getProfile(activePlaceId!);
      setRating(profile.googleRating ? parseFloat(profile.googleRating) : 0);
      setTotal(profile.googleTotalReviews || rows.length);
      setStep('connected');
    } catch {
      setStep('not_connected');
    }
  };

  const loadLocations = async () => {
    setStep('loading');
    try {
      const res = await businessApi.getGoogleLocations(activePlaceId!);
      if (res.locations?.length) {
        setLocations(res.locations);
        setStep('pick_location');
      } else {
        setStep('not_connected');
      }
    } catch {
      setStep('not_connected');
    }
  };

  const fetchAllReviews = async () => {
    setStep('loading');
    try {
      const res = await businessApi.getAllGoogleReviews(activePlaceId!);
      setReviews(res.reviews || []);
      setTotal(res.total || 0);
      const profile = await businessApi.getProfile(activePlaceId!);
      setRating(profile.googleRating ? parseFloat(profile.googleRating) : 0);
      setStep('connected');
    } catch {
      setStep('not_connected');
    }
  };

  const handleConnect = async () => {
    setIsBusy(true);
    try {
      const res = await businessApi.getGoogleAuthUrl(activePlaceId!);
      window.location.href = res.url;
    } catch (e: any) {
      alert(e?.message || 'Error al generar el enlace de Google');
      setIsBusy(false);
    }
  };

  const handlePickLocation = async (locationName: string) => {
    setIsBusy(true);
    try {
      await businessApi.setGoogleLocation(activePlaceId!, locationName);
      await fetchAllReviews();
    } catch {
      alert('Error al guardar la ubicación');
    }
    setIsBusy(false);
  };

  // ── LOADING ──────────────────────────────────────────────────────────────
  if (step === 'loading') return (
    <div className="text-center py-10 font-bold text-gray-400">Cargando reseñas de Google...</div>
  );

  // ── NOT CONNECTED ────────────────────────────────────────────────────────
  if (step === 'not_connected') return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-[var(--text)] font-warike italic">Reseñas de Google</h2>
        <p className="text-[var(--text-muted)] font-bold text-sm mt-1">Conecta tu cuenta para ver todas tus reseñas</p>
      </div>

      {/* Aviso verificación */}
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

      {/* Botón conectar */}
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
      <div>
        <h2 className="text-3xl font-black text-[var(--text)] font-warike italic">Reseñas de Google</h2>
        <p className="text-[var(--text-muted)] font-bold text-sm mt-1">Selecciona cuál es tu negocio</p>
      </div>

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
            <p className="text-[9px] font-black text-primary uppercase tracking-widest">{loc.locationName}</p>
          </button>
        ))}
      </div>
    </div>
  );

  // ── CONNECTED — SHOW ALL REVIEWS ─────────────────────────────────────────
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-[var(--text)] font-warike italic">Reseñas de Google</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-yellow-400 text-xl font-black">{rating > 0 ? rating.toFixed(1) : '—'} ⭐</span>
            <p className="text-[var(--text-muted)] font-bold text-xs uppercase tracking-widest">{total} reseñas totales</p>
          </div>
        </div>
        <button
          onClick={fetchAllReviews}
          disabled={isBusy}
          className="btn-primary px-8 py-3 rounded-2xl text-[10px] tracking-widest disabled:opacity-50 flex items-center gap-2"
        >
          {isBusy ? '⌛ Actualizando...' : '🔄 Actualizar reseñas'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.length === 0 ? (
          <div className="md:col-span-2 bg-gray-50 p-12 rounded-[2.5rem] border border-dashed border-gray-200 text-center">
            <p className="text-gray-400 font-bold italic">Aún no tienes reseñas en Google Maps.</p>
          </div>
        ) : (
          reviews.map((review, idx) => (
            <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm space-y-6 hover:shadow-xl transition-all">
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
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{review.relativeTimeDescription}</p>
                  </div>
                </div>
                <div className="flex gap-1 text-yellow-400 text-sm">
                  {Array.from({ length: review.starRating === 'FIVE' ? 5 : review.starRating === 'FOUR' ? 4 : review.starRating === 'THREE' ? 3 : review.starRating === 'TWO' ? 2 : 1 }).map((_, i) => (
                    <span key={i}>⭐</span>
                  ))}
                </div>
              </div>

              {review.comment && (
                <div className="bg-[var(--background)] p-6 rounded-3xl border border-[var(--border)] italic text-[var(--text-muted)] text-sm font-bold leading-relaxed">
                  "{review.comment}"
                </div>
              )}

              <span className="text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest bg-blue-50 text-blue-600">
                Google Maps
              </span>
            </div>
          ))
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
