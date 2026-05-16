'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { publicApi } from '../../../../../lib/api-client';

type Step = 'rating' | 'loyalty' | 'thanks' | 'card';

export default function PublicDeviceScanPage() {
  const { id, deviceId } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [device, setDevice] = useState<any>(null);
  const [loyaltyProgram, setLoyaltyProgram] = useState<any>(null);
  const [step, setStep] = useState<Step>('rating');
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [googleLink, setGoogleLink] = useState<string | null>(null);

  // Loyalty state
  const [phone, setPhone] = useState('');
  const [loyaltyResult, setLoyaltyResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!id) return;
    publicApi.getPlace(id as string)
      .then(data => setProfile(data))
      .catch(() => {
        setProfile({ id, name: 'El Huarique', coverImageUrl: '/images/interior.png', category: { name: 'Restaurante' } });
      });

    publicApi.getLoyaltyProgram(id as string)
      .then(data => setLoyaltyProgram(data))
      .catch(() => setLoyaltyProgram(null));
  }, [id]);

  const handleRating = async () => {
    if (rating >= 4 && feedback && navigator.clipboard) {
      navigator.clipboard.writeText(feedback).catch(() => {});
    }

    setIsSending(true);
    try {
      await publicApi.submitFeedback({
        placeId: id as string,
        rating,
        comment: feedback,
        customerName: customerName || undefined,
        customerContact: customerContact || undefined,
        deviceId: deviceId as string,
      });
    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setIsSending(false);
    }

    if (rating >= 4) {
      const placeId = profile?.googlePlaceId;
      const validPlaceId = placeId && placeId.startsWith('ChIJ') && placeId.length > 20;
      const link = validPlaceId
        ? `https://search.google.com/local/writereview?placeid=${placeId}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile?.name || '')}`;
      setGoogleLink(link);
    }

    if (loyaltyProgram?.isActive) {
      setStep('loyalty');
    } else {
      setStep('thanks');
    }
  };

  const handleLoyaltyScan = async () => {
    if (!phone || phone.replace(/\D/g, '').length < 9) return;
    setIsScanning(true);
    try {
      const result = await publicApi.loyaltyScan(id as string, {
        phone: phone.replace(/\D/g, ''),
        name: customerName || undefined,
      });
      setLoyaltyResult(result);
      setStep('card');
    } catch (err: any) {
      alert(err?.message || 'Error al registrar tu visita');
    } finally {
      setIsScanning(false);
    }
  };

  if (!profile) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-[var(--text-muted)] uppercase tracking-widest text-xs">Preparando tu experiencia...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="w-28 h-28 mx-auto rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden ring-1 ring-[var(--border)]">
          <img src={profile.coverImageUrl || '/images/interior.png'} className="w-full h-full object-cover" alt={profile.name} />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-[var(--text)] font-warike uppercase tracking-tight">{profile.name}</h1>
          <p className="text-[var(--text-muted)] font-bold text-sm uppercase tracking-[0.2em]">{profile.category?.name || 'Restaurante'}</p>
        </div>
      </div>

      {/* ── STEP: RATING ── */}
      {step === 'rating' && (
        <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-[var(--border)] text-center space-y-10">
          <h2 className="text-2xl font-black text-[var(--text)] font-warike text-balance">¿Qué te pareció la experiencia de hoy?</h2>

          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setRating(star)} className="text-5xl transition-all hover:scale-125 active:scale-95">
                {star <= rating ? '⭐' : '☆'}
              </button>
            ))}
          </div>

          {rating > 0 && (
            <div className="space-y-6 animate-in fade-in zoom-in duration-500 text-left">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="input-premium min-h-[100px] resize-none py-6 text-sm w-full"
                placeholder={rating >= 4 ? 'Escribe aquí tu reseña sobre lo que más te gustó...' : 'Escribe aquí tu reseña para ayudarnos a mejorar...'}
              />
              {rating >= 4 && feedback && (
                <div className="flex items-center gap-2 px-1">
                  <span className="text-green-500 text-sm">📋</span>
                  <p className="text-green-600 font-bold text-[10px] uppercase tracking-widest">Tu texto se copiará automáticamente — solo pégalo en Google Maps</p>
                </div>
              )}

              {rating <= 3 && (
                <div className="space-y-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-4">
                  <div className="space-y-1 text-center pb-2">
                    <p className="text-sm font-black text-[var(--text)]">Queremos compensarte</p>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-balance">Déjanos tus datos (opcional) para que el administrador pueda contactarte.</p>
                  </div>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Tu Nombre" className="input-premium py-4 text-xs w-full" />
                  <input type="text" value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} placeholder="WhatsApp o Correo Electrónico" className="input-premium py-4 text-xs w-full" />
                </div>
              )}

              <button onClick={handleRating} disabled={isSending} className="btn-primary w-full text-sm uppercase tracking-widest py-6 shadow-xl shadow-[var(--primary)]/20 disabled:opacity-50">
                {isSending ? 'Enviando...' : rating >= 4 ? 'Publicar Reseña en Google Maps' : 'Enviar Reseña Privada al Administrador'}
              </button>
            </div>
          )}

          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] leading-relaxed">
            Tu opinión nos ayuda a mantener vivo el sabor tradicional.
          </p>
        </div>
      )}

      {/* ── STEP: LOYALTY ── */}
      {step === 'loyalty' && loyaltyProgram && (
        <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-[var(--border)] text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-5xl">🎁</div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[var(--text)] font-warike">¡Acumula tu sello!</h2>
            <p className="text-[var(--text-muted)] font-bold text-sm leading-relaxed text-balance">
              {loyaltyProgram.rewardTitle
                ? `Junta ${loyaltyProgram.stampsToReward} sellos y gana: ${loyaltyProgram.rewardTitle}`
                : `Únete al programa de fidelización de ${profile.name}`}
            </p>
          </div>

          <div className="space-y-4 text-left">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Tu número de WhatsApp"
              className="input-premium py-5 text-sm w-full"
              autoFocus
            />
            {!customerName && (
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Tu nombre (opcional)"
                className="input-premium py-4 text-xs w-full"
              />
            )}
          </div>

          <button
            onClick={handleLoyaltyScan}
            disabled={isScanning || phone.replace(/\D/g, '').length < 9}
            className="btn-primary w-full text-sm uppercase tracking-widest py-6 shadow-xl shadow-[var(--primary)]/20 disabled:opacity-50"
          >
            {isScanning ? 'Registrando...' : '🎯 Sumar mi Sello'}
          </button>

          <button onClick={() => setStep('thanks')} className="w-full py-3 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest hover:underline">
            Omitir por ahora →
          </button>
        </div>
      )}

      {/* ── STEP: CARD ── */}
      {step === 'card' && loyaltyResult && (
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-[var(--border)] text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-6xl">{loyaltyResult.isNew ? '🎉' : loyaltyResult.rewardUnlocked ? '🏆' : '⭐'}</div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-[var(--text)] font-warike">
              {loyaltyResult.isNew ? '¡Bienvenido!' : loyaltyResult.rewardUnlocked ? '¡Premio desbloqueado!' : '¡Sello sumado!'}
            </h2>
            {loyaltyResult.rewardUnlocked && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                <p className="font-black text-yellow-700">🎁 {loyaltyResult.program?.rewardTitle || 'Premio desbloqueado'}</p>
                <p className="text-yellow-600 text-xs font-bold mt-1">Muestra esta pantalla al cajero para canjear</p>
              </div>
            )}
          </div>

          {loyaltyResult.program?.type === 'stamps' && (
            <div className="space-y-4 bg-[var(--background)] p-6 rounded-3xl">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Tus sellos</span>
                <span className="text-xs font-black text-[var(--primary)]">{loyaltyResult.card?.stamps} / {loyaltyResult.program?.stampsToReward}</span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--primary)] to-orange-400 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, (loyaltyResult.card?.stamps / loyaltyResult.program?.stampsToReward) * 100)}%` }}
                />
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                {Array.from({ length: loyaltyResult.program?.stampsToReward || 10 }).map((_, i) => (
                  <span key={i} className={`text-2xl transition-all ${i < loyaltyResult.card?.stamps ? 'opacity-100' : 'opacity-20'}`}>⭐</span>
                ))}
              </div>
              <p className="text-xs font-bold text-[var(--text-muted)]">
                Premio: {loyaltyResult.program?.rewardTitle || '—'}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
              Visita #{loyaltyResult.card?.totalVisits} · Nivel {loyaltyResult.card?.level}
            </p>
            <a
              href={`/tarjeta/${id}/${loyaltyResult.card?.customerPhone}`}
              className="block w-full py-4 rounded-2xl bg-[var(--primary)] text-white font-black text-xs uppercase tracking-widest text-center"
            >
              Ver mi Tarjeta Completa →
            </a>
          </div>

          {googleLink && (
            <a href={googleLink} className="btn-primary w-full text-sm uppercase tracking-widest py-5 flex items-center justify-center gap-3">
              <span>⭐</span> Publicar en Google Maps
            </a>
          )}
        </div>
      )}

      {/* ── STEP: THANKS ── */}
      {step === 'thanks' && (
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-[var(--border)] text-center space-y-8">
          <div className="text-6xl animate-bounce">🙏</div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-[var(--text)] font-warike">¡Muchas Gracias!</h2>
            <p className="text-[var(--text-muted)] font-bold text-sm leading-relaxed">
              {googleLink
                ? 'Tu opinión fue guardada. Ayuda a otros publicándola también en Google Maps — ya copiamos tu texto, ¡solo pégalo!'
                : 'Hemos recibido tu opinión. Trabajaremos para que tu próxima visita sea perfecta.'}
            </p>
          </div>
          {googleLink && (
            <>
              {feedback && (
                <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-3 flex items-center gap-3">
                  <span className="text-green-500 text-lg">📋</span>
                  <p className="text-green-700 font-bold text-xs">Tu reseña fue copiada al portapapeles</p>
                </div>
              )}
              <a href={googleLink} className="btn-primary w-full text-sm uppercase tracking-widest py-6 shadow-xl shadow-[var(--primary)]/20 flex items-center justify-center gap-3">
                <span>⭐</span> Publicar en Google Maps — solo pega
              </a>
            </>
          )}
          <button onClick={() => window.location.reload()} className="w-full py-5 rounded-2xl bg-[var(--background)] text-[var(--text)] font-black text-xs uppercase tracking-widest">
            Volver al Inicio
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <LinkButton icon="🍽️" label="Ver la Carta Digital" />
        <LinkButton icon="📲" label="Seguir en Instagram" />
        <LinkButton icon="💬" label="Contactar por WhatsApp" />
      </div>
    </div>
  );
}

function LinkButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="w-full bg-white/50 backdrop-blur-md p-6 rounded-[2rem] border border-[var(--border)] flex items-center gap-6 group hover:bg-white hover:shadow-xl transition-all">
      <div className="text-3xl group-hover:scale-125 transition-transform">{icon}</div>
      <span className="font-black text-[var(--text)] uppercase tracking-widest text-xs">{label}</span>
    </button>
  );
}
