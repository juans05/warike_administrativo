'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { publicApi } from '../../lib/api-client';
import { toast } from 'sonner';
import { copyText } from '../../lib/clipboard';

type Step = 'welcome' | 'rating' | 'detail' | 'result';

// Respuestas rápidas: tocar es más fácil que escribir en el celular.
const CHIPS_POSITIVE = ['Rico sabor', 'Buena atención', 'Rápido', 'Buen precio', 'Ambiente agradable', 'Porciones generosas'];
const CHIPS_NEGATIVE = ['Demoró mucho', 'Atención', 'Sabor', 'Precio', 'Limpieza', 'Ambiente'];

const RATING_LABELS: Record<number, string> = {
  1: 'Regular 😕',
  2: 'Podría mejorar 🙁',
  3: 'Estuvo bien 🙂',
  4: 'Muy buena 😄',
  5: '¡Excelente! 🤩',
};

export default function ScanExperience({
  placeId,
  deviceId,
  qrCodeId,
}: {
  placeId: string;
  deviceId?: string;
  /** Viene del resolver /q/[token] — ya registró el scan y ya resolvió que el destino es reputación, así que acá no hay que hacerlo de nuevo. */
  qrCodeId?: string;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loyaltyProgram, setLoyaltyProgram] = useState<any>(null);
  const [scanPromo, setScanPromo] = useState<{ enabled: boolean; text: string }>({ enabled: false, text: '' });
  const [step, setStep] = useState<Step>('welcome');

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [chips, setChips] = useState<string[]>([]);
  // Un solo consentimiento: recibir promociones por WhatsApp.
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [googleLink, setGoogleLink] = useState<string | null>(null);

  const [phone, setPhone] = useState('');
  const [loyaltyResult, setLoyaltyResult] = useState<any>(null);

  useEffect(() => {
    if (!placeId) return;

    // El resolver /q/[token] ya registró el scan y ya decidió que el
    // destino es reputación antes de llegar acá — no repetir.
    if (!qrCodeId) {
      const source = deviceId ? 'nfc' : (new URLSearchParams(window.location.search).get('source') as 'nfc' | 'qr') || 'qr';
      publicApi.recordScan({ placeId, deviceId, source }).catch(() => {});

      if (deviceId) {
        publicApi.getDevice(deviceId).then(device => {
          if (device?.action === 'menu') router.replace(`/menu/${placeId}`);
        }).catch(() => {});
      }
    }

    publicApi.getPlace(placeId)
      .then(setProfile)
      .catch(() => setProfile({ id: placeId, name: 'El Huarique', coverImageUrl: '/images/interior.png', category: { name: 'Restaurante' } }));

    publicApi.getLoyaltyProgram(placeId).then(setLoyaltyProgram).catch(() => setLoyaltyProgram(null));
    publicApi.getScanPromo(placeId).then(setScanPromo).catch(() => {});
  }, [placeId, deviceId]);

  const stepsFlow: Step[] = ['rating', 'detail', 'result'];
  const progressIndex = stepsFlow.indexOf(step);
  // La caja del WhatsApp aparece si el dueño activó promociones o si hay fidelización (sello).
  const showLeadBox = scanPromo.enabled || !!loyaltyProgram?.isActive;
  const leadText = scanPromo.text
    || (loyaltyProgram?.isActive
      ? (loyaltyProgram.rewardTitle
        ? `Deja tu WhatsApp, suma tu primer sello y junta ${loyaltyProgram.stampsToReward} para ganar: ${loyaltyProgram.rewardTitle}`
        : 'Deja tu WhatsApp y suma tu primer sello')
      : 'Deja tu WhatsApp y recibe promociones exclusivas');
  const phoneDigits = phone.replace(/\D/g, '');
  const hasPhone = phoneDigits.length >= 9;

  const buildGoogleLink = () => {
    const gPlaceId = profile?.googlePlaceId;
    const validPlaceId = gPlaceId && gPlaceId.startsWith('ChIJ') && gPlaceId.length > 20;
    return validPlaceId
      ? `https://search.google.com/local/writereview?placeid=${gPlaceId}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile?.name || '')}`;
  };

  const handlePickRating = (value: number) => {
    setRating(value);
    setChips([]);
    setTimeout(() => setStep('detail'), 350);
  };

  const toggleChip = (chip: string) =>
    setChips((list) => (list.includes(chip) ? list.filter((c) => c !== chip) : [...list, chip]));

  // Un solo botón: guarda reseña + celular y, si corresponde, abre Google.
  // Lo guardado queda antes de salir a Google, así que no importa si el cliente no regresa.
  const handleSubmit = async (openGoogle: boolean) => {
    const comment = [
      chips.length ? `${rating >= 4 ? 'Me gustó' : 'A mejorar'}: ${chips.join(', ')}.` : '',
      feedback.trim(),
    ].filter(Boolean).join(' ');

    // Copiar y abrir la pestaña ANTES de cualquier await: el gesto del usuario se pierde si esperamos primero.
    if (comment) copyText(comment);
    const googleUrl = buildGoogleLink();
    setGoogleLink(googleUrl);
    const popup = openGoogle ? window.open('', '_blank') : null;

    setIsSending(true);
    try {
      await publicApi.submitFeedback({
        placeId,
        rating,
        comment,
        customerName: customerName || undefined,
        customerContact: hasPhone ? phoneDigits : undefined,
        deviceId,
        marketingConsent: marketingConsent && hasPhone,
      });
    } catch (err: any) {
      popup?.close();
      toast.error(err?.message || 'No se pudo enviar tu reseña. Intenta de nuevo.');
      setIsSending(false);
      return;
    }

    // El sello es un extra: si falla, la reseña ya quedó guardada y el cliente sigue su camino.
    if (hasPhone && loyaltyProgram?.isActive) {
      try {
        setLoyaltyResult(await publicApi.loyaltyScan(placeId, { phone: phoneDigits, name: customerName || undefined, marketingConsent }));
      } catch { /* sin sello */ }
    }
    setIsSending(false);
    setStep('result');

    if (openGoogle) {
      if (popup) popup.location.href = googleUrl;
      else window.location.href = googleUrl;
    }
  };

  const reset = () => {
    setStep('welcome');
    setRating(0);
    setFeedback('');
    setCustomerName('');
    setChips([]);
    setMarketingConsent(false);
    setGoogleLink(null);
    setPhone('');
    setLoyaltyResult(null);
  };

  if (!profile) return <SkeletonWelcome />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {step !== 'welcome' && <ProgressBar current={progressIndex} total={stepsFlow.length} />}

      {/* Marca del restaurante — siempre visible, ancla de confianza */}
      <div className="text-center space-y-4">
        <div className="w-24 h-24 mx-auto rounded-[2rem] border-4 border-white shadow-2xl overflow-hidden ring-1 ring-border">
          <img src={profile.coverImageUrl || '/images/interior.png'} className="w-full h-full object-cover" alt={profile.name} />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-text font-warike uppercase tracking-tight">{profile.name}</h1>
          <p className="text-text-muted font-bold text-xs uppercase tracking-[0.2em]">{profile.category?.name || 'Restaurante'}</p>
        </div>
      </div>

      {step === 'welcome' && (
        <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-border text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-5xl motion-reduce:animate-none animate-bounce">👋</div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-text font-warike text-balance">¡Gracias por visitarnos!</h2>
            <p className="text-text-muted font-bold text-sm">Solo toma 10 segundos.</p>
          </div>
          <button
            onClick={() => setStep('rating')}
            className="btn-primary w-full min-h-[56px] text-sm uppercase tracking-widest shadow-xl shadow-primary/20"
          >
            Calificar mi experiencia →
          </button>
        </div>
      )}

      {step === 'rating' && (
        <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-border text-center space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
          <h2 className="text-2xl font-black text-text font-warike text-balance">¿Cómo estuvo tu experiencia hoy?</h2>

          <div role="radiogroup" aria-label="Calificación" className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                role="radio"
                aria-checked={star === rating}
                aria-label={`${star} estrellas`}
                onClick={() => handlePickRating(star)}
                className="min-w-[56px] min-h-[56px] flex items-center justify-center text-5xl transition-transform motion-reduce:transition-none hover:scale-125 active:scale-95"
              >
                {star <= rating ? '⭐' : '☆'}
              </button>
            ))}
          </div>

          <p className="h-5 font-black text-sm text-primary animate-in fade-in">{rating > 0 ? RATING_LABELS[rating] : ''}</p>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] leading-relaxed">
            Tu opinión nos ayuda muchísimo.
          </p>
        </div>
      )}

      {step === 'detail' && (
        <div className="bg-white p-8 rounded-[3.5rem] shadow-2xl border border-border text-center space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
          {rating >= 4 ? (
            <>
              <h2 className="text-2xl font-black text-text font-warike text-balance">¡Nos alegra mucho! 🎉</h2>
              <p className="text-text-muted font-bold text-sm text-balance">Toca lo que más te gustó.</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-black text-text font-warike text-balance">Gracias por tu honestidad</h2>
              <p className="text-text-muted font-bold text-sm text-balance">Este mensaje llega directo al equipo. ¿Qué podemos mejorar?</p>
            </>
          )}

          <div className="flex flex-wrap justify-center gap-2">
            {(rating >= 4 ? CHIPS_POSITIVE : CHIPS_NEGATIVE).map((chip) => (
              <button
                key={chip}
                type="button"
                aria-pressed={chips.includes(chip)}
                onClick={() => toggleChip(chip)}
                className={`min-h-[44px] rounded-full border-2 px-4 text-xs font-black transition-colors ${chips.includes(chip) ? 'border-primary bg-primary text-white' : 'border-border bg-white text-text'}`}
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="space-y-4 text-left">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="input-premium min-h-[80px] resize-none py-4 text-sm w-full"
              placeholder="Algo más que quieras contarnos (opcional)"
              aria-label="Tu comentario"
            />

            {showLeadBox && (
            <div className="rounded-3xl bg-orange-50 border border-orange-100 p-4 space-y-3">
              <p className="text-xs font-black text-orange-900 text-balance">
                🎁 {leadText}
              </p>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Tu número de WhatsApp (opcional)"
                className="input-premium py-4 text-sm w-full min-h-[48px]"
              />
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded-lg border-2 border-gray-300 accent-primary"
                />
                <span className="text-[11px] font-bold text-text-muted leading-relaxed">
                  Acepto recibir promociones y novedades de {profile.name} por WhatsApp. Puedo dejar de recibirlas cuando quiera.
                </span>
              </label>
            </div>
            )}
          </div>

          {rating >= 4 ? (
            <>
              <button
                onClick={() => handleSubmit(true)}
                disabled={isSending}
                className="btn-primary w-full min-h-[56px] text-sm uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSending ? 'Enviando...' : <><span>⭐</span> Publicar en Google</>}
              </button>
              <p className="text-[11px] font-bold text-text-muted text-balance">Copiamos tu comentario: en Google solo pégalo y toca Publicar.</p>
              <button
                onClick={() => handleSubmit(false)}
                disabled={isSending}
                className="w-full py-3 text-[10px] font-black text-text-muted uppercase tracking-widest hover:underline min-h-[48px] disabled:opacity-50"
              >
                Solo enviar, sin publicar en Google
              </button>
            </>
          ) : (
            <button
              onClick={() => handleSubmit(false)}
              disabled={isSending}
              className="btn-primary w-full min-h-[56px] text-sm uppercase tracking-widest shadow-xl shadow-primary/20 disabled:opacity-50"
            >
              {isSending ? 'Enviando...' : 'Enviar al equipo →'}
            </button>
          )}
        </div>
      )}

      {step === 'result' && (
        <div className="relative bg-white p-12 rounded-[3.5rem] shadow-2xl border border-border text-center space-y-8 animate-in fade-in zoom-in duration-500 overflow-hidden">
          {!loyaltyResult?.blocked && <Confetti />}
          <AnimatedCheck />

          <div className="space-y-3">
            <h2 className="text-3xl font-black text-text font-warike">
              {loyaltyResult?.blocked ? '¡Ya te tenemos registrado! 🙌' : loyaltyResult?.rewardUnlocked ? '¡Premio desbloqueado!' : loyaltyResult ? '¡Sello sumado!' : '¡Muchas Gracias!'}
            </h2>
            <p className="text-text-muted font-bold text-sm leading-relaxed text-balance">
              {loyaltyResult?.blocked
                ? `Ya registramos tu visita reciente.${loyaltyResult.nextEligibleAt ? ` Podrás sumar tu próximo sello en ${formatWait(loyaltyResult.nextEligibleAt)}.` : ''}`
                : loyaltyResult
                ? 'Tu visita quedó registrada.'
                : 'Trabajaremos para que tu próxima visita sea aún mejor.'}
            </p>
          </div>

          {loyaltyResult?.rewardUnlocked && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <p className="font-black text-yellow-700">🎁 {loyaltyResult.program?.rewardTitle || 'Premio desbloqueado'}</p>
              <p className="text-yellow-600 text-xs font-bold mt-1">Muestra esta pantalla al cajero para canjear</p>
            </div>
          )}

          {loyaltyResult?.program?.type === 'stamps' && (
            <div className="space-y-4 bg-background p-6 rounded-3xl">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-text-muted uppercase tracking-widest">Tus sellos</span>
                <span className="text-xs font-black text-primary">{loyaltyResult.card?.stamps} / {loyaltyResult.program?.stampsToReward}</span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-1000 motion-reduce:transition-none"
                  style={{ width: `${Math.min(100, (loyaltyResult.card?.stamps / loyaltyResult.program?.stampsToReward) * 100)}%` }}
                />
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                {Array.from({ length: loyaltyResult.program?.stampsToReward || 10 }).map((_, i) => (
                  <span key={i} className={`text-2xl transition-opacity ${i < loyaltyResult.card?.stamps ? 'opacity-100' : 'opacity-20'}`}>⭐</span>
                ))}
              </div>
            </div>
          )}

          {loyaltyResult && (
            <a
              href={`/tarjeta/${placeId}/${loyaltyResult.card?.customerPhone}`}
              className="block w-full py-4 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest text-center min-h-[48px] flex items-center justify-center"
            >
              Ver mi Tarjeta Completa →
            </a>
          )}

          {googleLink && rating <= 3 && (
            <a href={googleLink} target="_blank" rel="noopener noreferrer" className="block w-full py-4 rounded-2xl border-2 border-border text-text font-black text-xs uppercase tracking-widest text-center min-h-[48px] flex items-center justify-center">
              ⭐ Dejar también una reseña pública en Google
            </a>
          )}

          <button onClick={reset} className="w-full py-5 rounded-2xl bg-background text-text font-black text-xs uppercase tracking-widest min-h-[48px]">
            Volver al Inicio
          </button>
        </div>
      )}
    </div>
  );
}

function formatWait(nextEligibleAt: string | Date): string {
  const ms = new Date(nextEligibleAt).getTime() - Date.now();
  if (ms <= 0) return 'unos minutos';
  const hours = Math.ceil(ms / 3600_000);
  if (hours < 24) return `${hours} hora${hours === 1 ? '' : 's'}`;
  const days = Math.ceil(hours / 24);
  return `${days} día${days === 1 ? '' : 's'}`;
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.max(0, Math.min(100, ((current + 1) / total) * 100)) : 0;
  return (
    <div className="space-y-1.5" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total}>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-500 motion-reduce:transition-none" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] text-right">Paso {current + 1} de {total}</p>
    </div>
  );
}

function AnimatedCheck() {
  return (
    <svg viewBox="0 0 24 24" className="w-16 h-16 mx-auto text-primary" fill="none">
      <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
      <path d="M7 12.5l3 3 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="check-draw motion-reduce:[animation:none] motion-reduce:[stroke-dashoffset:0]" />
    </svg>
  );
}

const CONFETTI_COLORS = ['#C84B31', '#ECB365', '#606C38', '#E05D44'];

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 24 }).map((_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.4,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  })), []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece absolute top-0 w-2 h-2 rounded-sm"
          style={{ left: `${p.left}%`, backgroundColor: p.color, animationDelay: `${p.delay}s` }}
        />
      ))}
    </div>
  );
}

function SkeletonWelcome() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 mx-auto rounded-[2rem] bg-gray-200" />
        <div className="space-y-2 flex flex-col items-center">
          <div className="h-7 bg-gray-200 rounded-lg w-40" />
          <div className="h-3 bg-gray-100 rounded w-24" />
        </div>
      </div>
      <div className="bg-white p-10 rounded-[3.5rem] border border-border space-y-8">
        <div className="w-12 h-12 rounded-full bg-gray-200 mx-auto" />
        <div className="h-6 bg-gray-200 rounded-lg w-3/4 mx-auto" />
        <div className="h-14 bg-gray-100 rounded-2xl w-full" />
      </div>
    </div>
  );
}
