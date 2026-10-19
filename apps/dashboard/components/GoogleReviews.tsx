'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useRestaurant } from '../context/RestaurantContext';
import { businessApi } from '../lib/api-client';
import WuarikesFeedbackList from './WuarikesFeedback';
import { Button, Card, DataList, buttonStyles } from './ui';
import { ConnectGoogleCard } from './reputation/ConnectGoogleCard';
import { GoogleIcon } from './reputation/GoogleIcon';
import { ReviewInbox } from './reputation/ReviewInbox';
import { GBP_API_ENABLED, numberToStarRating, withKeys, type GoogleReview } from './reputation/googleReviews';
import { useCustomerLabels } from '../hooks/useCustomerLabels';

type Step = 'loading' | 'not_connected' | 'pick_location' | 'connected' | 'error';

// Errores devueltos por el callback de OAuth (?error=...) o por el backend (code).
const ERROR_TEXT: Record<string, string> = {
  access_denied: 'Cancelaste la conexión con Google.',
  invalid_state: 'El enlace de conexión expiró. Vuelve a intentarlo.',
  forbidden: 'Este local no pertenece a tu cuenta.',
  token_failed: 'Google no entregó el acceso. Vuelve a intentarlo.',
};
// Errores que se resuelven volviendo a conectar la cuenta.
const RECONNECT_CODES = new Set(['token_expired', 'not_connected', 'permission_denied']);
// Google no está disponible para este local (sin aprobación de la API, sin permiso o sin
// conexión): en vez de un error se muestran solo las opiniones de Wuarikes.
const GOOGLE_UNAVAILABLE_CODES = new Set(['quota', 'permission_denied', 'not_connected', 'token_expired']);

/**
 * Reseñas de Google con sus estados de conexión. `connectSlot` es el formulario para conectar por
 * Place ID (se muestra cuando todavía no hay reseñas de Google); lo arma la página.
 */
export default function GoogleReviews({ refreshKey, connectSlot }: { refreshKey?: number; connectSlot?: ReactNode }) {
  const { activePlaceId } = useRestaurant();
  const { customers } = useCustomerLabels();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>('loading');
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [rating, setRating] = useState(0);
  const [total, setTotal] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);

  useEffect(() => {
    if (!activePlaceId) return;
    const oauthError = searchParams.get('error');
    if (oauthError) {
      toast.error(ERROR_TEXT[oauthError] || 'No se pudo conectar con Google.');
      router.replace('/reputacion');
    }
    if (GBP_API_ENABLED && searchParams.get('connected') === 'true') {
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
      if (GBP_API_ENABLED && profile.googleLocationName) {
        await fetchAllReviews(profile);
      } else if (GBP_API_ENABLED && profile.googleConnected) {
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
    setReviews(withKeys(rows.map((r: any) => ({
      reviewer: { displayName: r.authorName, profilePhotoUrl: r.authorPhotoUrl },
      starRating: numberToStarRating(r.rating),
      comment: r.text,
      relativeTimeDescription: r.relativeTimeDescription,
    }))));
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
      setReviews(withKeys(res.reviews || []));
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

  // ── CARGANDO ─────────────────────────────────────────────────────────────
  if (step === 'loading') return (
    <Card padding="sm" className="p-0">
      <DataList items={[]} loading empty={null} renderItem={() => null} />
    </Card>
  );

  // ── GOOGLE NO DISPONIBLE → SOLO OPINIONES DE WUARIKES ────────────────────
  if (step === 'error' && GOOGLE_UNAVAILABLE_CODES.has(error?.code || '')) return (
    <div className="space-y-6">
      <p className="rounded-card border border-border bg-surface p-4 text-sm text-text-muted">
        Las reseñas de Google no están disponibles por ahora. Mientras tanto, aquí están las opiniones que tus {customers} dejaron por QR o NFC.
      </p>
      <WuarikesFeedbackList placeId={activePlaceId!} />
    </div>
  );

  // ── ERROR ────────────────────────────────────────────────────────────────
  if (step === 'error') return (
    <Card padding="lg" className="space-y-4 border-danger/30">
      <p role="alert" className="flex items-start gap-2 text-sm font-medium text-danger">
        <AlertTriangle size={20} aria-hidden className="shrink-0" />
        {error?.message}
      </p>
      {RECONNECT_CODES.has(error?.code || '') || error?.code === 'location_missing' ? (
        <Button variant="secondary" disabled={isBusy} onClick={error?.code === 'location_missing' ? loadLocations : handleConnect}>
          <GoogleIcon />
          {error?.code === 'location_missing' ? 'Elegir mi negocio' : isBusy ? 'Redirigiendo...' : 'Volver a conectar Google'}
        </Button>
      ) : (
        <Button variant="secondary" onClick={checkConnectionAndLoad}>Reintentar</Button>
      )}
    </Card>
  );

  // ── SIN RESEÑAS DE GOOGLE (sin Place ID) → CONECTAR + OPINIONES DE WUARIKES ──
  if (step === 'not_connected' && !GBP_API_ENABLED) return (
    <div className="space-y-8">
      <ConnectGoogleCard>{connectSlot}</ConnectGoogleCard>
      <WuarikesFeedbackList placeId={activePlaceId!} />
    </div>
  );

  // ── NO CONECTADO (API de Business Profile) ───────────────────────────────
  if (step === 'not_connected') return (
    <Card padding="lg" className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-text">Tu negocio debe estar verificado en Google</h2>
        <p className="text-sm text-text-muted">
          Para acceder a todas tus reseñas necesitas ser el propietario verificado del negocio en Google Business Profile.
        </p>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-text">
          <li>Ir a business.google.com</li>
          <li>Iniciar sesión con la cuenta Google del negocio</li>
          <li>Verificar el negocio (carta postal, llamada o SMS)</li>
          <li>Una vez verificado, conectar aquí abajo</li>
        </ol>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" disabled={isBusy} onClick={handleConnect}>
          <GoogleIcon />
          {isBusy ? 'Redirigiendo...' : 'Conectar con Google Business'}
        </Button>
        <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" className={buttonStyles('ghost', 'md')}>
          Abrir Google Business Profile
          <ExternalLink size={16} aria-hidden />
        </a>
      </div>
    </Card>
  );

  // ── ELEGIR NEGOCIO ───────────────────────────────────────────────────────
  if (step === 'pick_location') return (
    <Card padding="sm" className="p-0">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-xl font-semibold text-text">Selecciona cuál es tu negocio</h2>
      </div>
      <ul className="divide-y divide-border">
        {locations.map((loc) => (
          <li key={loc.locationName}>
            <button
              type="button"
              onClick={() => handlePickLocation(loc.locationName)}
              disabled={isBusy}
              className="w-full space-y-0.5 px-5 py-4 text-left transition-colors hover:bg-background disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
            >
              <p className="text-sm font-medium text-text">{loc.title}</p>
              {loc.address && <p className="text-sm text-text-muted">{loc.address}</p>}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );

  // ── CONECTADO: BANDEJA DE RESEÑAS ────────────────────────────────────────
  return (
    <ReviewInbox
      reviews={reviews}
      rating={rating}
      total={total}
      placeId={activePlaceId!}
      isBusy={isBusy}
      onConnect={handleConnect}
      onReplied={onReplied}
    />
  );
}
