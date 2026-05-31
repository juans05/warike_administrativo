'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { publicApi } from '../../../../lib/api-client';
import { toast } from 'sonner';

const LEVEL_COLORS: Record<string, string> = {
  BRONCE: 'from-amber-600 to-amber-400',
  PLATA:  'from-slate-500 to-slate-300',
  ORO:    'from-yellow-500 to-yellow-300',
  VIP:    'from-purple-600 to-pink-400',
};

const LEVEL_EMOJI: Record<string, string> = {
  BRONCE: '🥉', PLATA: '🥈', ORO: '🥇', VIP: '👑',
};

export default function CustomerCardPage() {
  const { placeId, phone } = useParams<{ placeId: string; phone: string }>();
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [place, setPlace] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!placeId || !phone) return;
    Promise.all([
      publicApi.getLoyaltyCard(placeId, phone),
      publicApi.getPlace(placeId),
    ]).then(([cardData, placeData]) => {
      setData(cardData);
      setPlace(placeData);
      if (cardData.card?.id) {
        publicApi.getLoyaltyHistory(cardData.card.id).then(setHistory).catch(() => {});
      }
    }).catch(() => {}).finally(() => setIsLoading(false));
  }, [placeId, phone]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data?.card) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-8 text-center space-y-6">
      <div className="text-6xl">🎫</div>
      <h1 className="text-2xl font-black text-gray-800">No tienes tarjeta aún</h1>
      <p className="text-gray-500 font-bold text-sm">Escanea el NFC de {place?.name || 'este restaurante'} para crear tu tarjeta de fidelización.</p>
      <a href={`/l/${placeId}`} className="bg-orange-500 text-white font-black px-8 py-4 rounded-2xl text-sm uppercase tracking-widest">
        Ir al restaurante →
      </a>
    </div>
  );

  const { card, program } = data;
  const level = card.level as string;
  const stampsToReward = program?.stampsToReward || 10;
  const progress = program?.type === 'stamps'
    ? Math.min(100, (card.stamps / stampsToReward) * 100)
    : Math.min(100, (card.points / (program?.stampsToReward * 10 || 100)) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 pb-16">
      {/* Card */}
      <div className={`bg-gradient-to-br ${LEVEL_COLORS[level] || LEVEL_COLORS.BRONCE} p-8 pt-16 pb-12 text-white`}>
        <div className="max-w-md mx-auto space-y-6">
          {/* Place info */}
          <div className="flex items-center gap-4">
            {place?.coverImageUrl && (
              <img src={place.coverImageUrl} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30" alt="" />
            )}
            <div>
              <p className="text-white/70 font-bold text-xs uppercase tracking-widest">Tarjeta de Fidelización</p>
              <h1 className="text-2xl font-black">{place?.name}</h1>
            </div>
          </div>

          {/* Customer */}
          <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-5 space-y-1">
            <p className="text-white/70 text-[10px] font-black uppercase tracking-widest">Cliente</p>
            <p className="font-black text-xl">{card.customerName || `+51 ${card.customerPhone}`}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-2xl">{LEVEL_EMOJI[level]}</span>
              <span className="font-black text-sm uppercase tracking-widest">{level}</span>
              <span className="text-white/60 text-xs font-bold">· {card.totalVisits} visitas</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 space-y-8 -mt-4">
        {/* Progress */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl space-y-6">
          {program?.type === 'stamps' ? (
            <>
              <div className="flex justify-between items-center">
                <h2 className="font-black text-gray-800">Tus Sellos</h2>
                <span className="font-black text-orange-500">{card.stamps} / {stampsToReward}</span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: stampsToReward }).map((_, i) => (
                  <div key={i} className={`aspect-square rounded-2xl flex items-center justify-center text-2xl border-2 transition-all ${i < card.stamps ? 'bg-orange-50 border-orange-300' : 'bg-gray-50 border-gray-100 opacity-30'}`}>
                    ⭐
                  </div>
                ))}
              </div>
              {program?.rewardTitle && (
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center">
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Premio al completar</p>
                  <p className="font-black text-gray-800 text-sm mt-1">{program.rewardTitle}</p>
                  {program.rewardDescription && (
                    <p className="text-gray-500 text-xs mt-1">{program.rewardDescription}</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h2 className="font-black text-gray-800">Tus Puntos</h2>
                <span className="font-black text-orange-500 text-2xl">{card.points}</span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Visitas" value={card.totalVisits} icon="📍" />
          <StatCard label="Canjeados" value={card.totalRedeemed} icon="🎁" />
          <StatCard label="Nivel" value={LEVEL_EMOJI[level]} icon="" />
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl space-y-4">
            <h2 className="font-black text-gray-800">Historial</h2>
            <div className="space-y-3">
              {history.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{tx.type === 'earn' ? '⭐' : '🎁'}</span>
                    <div>
                      <p className="font-black text-sm text-gray-800">{tx.description}</p>
                      <p className="text-[10px] font-bold text-gray-400">{new Date(tx.createdAt).toLocaleDateString('es-PE')}</p>
                    </div>
                  </div>
                  <span className={`font-black text-sm ${tx.type === 'earn' ? 'text-green-500' : 'text-orange-500'}`}>
                    {tx.type === 'earn' ? '+' : '-'}{tx.stamps || tx.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wallet */}
        <WalletButtons placeId={placeId} phone={phone} />

        <a href={`/l/${placeId}`} className="block w-full text-center py-5 rounded-2xl bg-white text-orange-500 border border-orange-100 font-black text-xs uppercase tracking-widest shadow-sm">
          Volver al Restaurante →
        </a>
      </div>
    </div>
  );
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function WalletButtons({ placeId, phone }: { placeId: string; phone: string }) {
  const [loadingGoogle, setLoadingGoogle] = React.useState(false);
  const [loadingApple, setLoadingApple] = React.useState(false);
  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isAndroid = typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent);

  const handleGoogle = async () => {
    setLoadingGoogle(true);
    try {
      const res = await fetch(`${API_BASE}/api/public/loyalty/${placeId}/wallet/google/${phone}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Google Wallet no disponible aún');
        return;
      }
      const { saveUrl } = await res.json();
      window.open(saveUrl, '_blank');
    } catch {
      toast.error('Error al conectar con Google Wallet');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleApple = async () => {
    setLoadingApple(true);
    try {
      const res = await fetch(`${API_BASE}/api/public/loyalty/${placeId}/wallet/apple/${phone}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Apple Wallet no disponible aún');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tarjeta-fidelizacion.pkpass`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Error al descargar el pase');
    } finally {
      setLoadingApple(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-6 shadow-xl space-y-4">
      <h2 className="font-black text-gray-800 text-sm uppercase tracking-widest text-center">Agregar a Wallet</h2>
      <div className="space-y-3">
        {/* Apple Wallet — solo en iOS o siempre si no es Android */}
        {!isAndroid && (
          <button
            onClick={handleApple}
            disabled={loadingApple}
            className="flex items-center justify-center gap-3 w-full py-4 bg-black text-white rounded-2xl font-black text-sm disabled:opacity-60 active:scale-[0.98] transition-all"
          >
            {loadingApple ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            )}
            {loadingApple ? 'Descargando...' : 'Agregar a Apple Wallet'}
          </button>
        )}

        {/* Google Wallet — solo en Android o siempre si no es iOS */}
        {!isIOS && (
          <button
            onClick={handleGoogle}
            disabled={loadingGoogle}
            className="flex items-center justify-center gap-3 w-full py-4 bg-[#1a73e8] text-white rounded-2xl font-black text-sm disabled:opacity-60 active:scale-[0.98] transition-all"
          >
            {loadingGoogle ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="3" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="1.5"/>
                <path d="M2 9h20" stroke="white" strokeWidth="1.5"/>
                <circle cx="17" cy="14" r="2.5" fill="white" fillOpacity="0.8"/>
              </svg>
            )}
            {loadingGoogle ? 'Conectando...' : 'Guardar en Google Wallet'}
          </button>
        )}

        {/* En desktop mostramos ambos */}
        {!isIOS && !isAndroid && (
          <p className="text-center text-[10px] font-bold text-gray-400">Escanea desde tu móvil para usar los wallets</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: any; icon: string }) {
  return (
    <div className="bg-white rounded-[2rem] p-5 shadow-sm text-center space-y-2">
      {icon && <div className="text-2xl">{icon}</div>}
      <p className="font-black text-xl text-gray-800">{value}</p>
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}
