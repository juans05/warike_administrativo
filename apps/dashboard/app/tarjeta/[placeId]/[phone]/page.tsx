'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { publicApi } from '../../../../lib/api-client';

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

        <a href={`/l/${placeId}`} className="block w-full text-center py-5 rounded-2xl bg-white text-orange-500 border border-orange-100 font-black text-xs uppercase tracking-widest shadow-sm">
          Volver al Restaurante →
        </a>
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
