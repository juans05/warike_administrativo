'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { fetchWithAuth } from '../../../lib/api-client';
import { toast } from 'sonner';

export default function FidelizacionPage() {
  const { activePlaceId } = useRestaurant();
  const [program, setProgram] = useState<any>(null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [type, setType] = useState<'stamps' | 'points'>('stamps');
  const [stampsToReward, setStampsToReward] = useState(10);
  const [pointsPerVisit, setPointsPerVisit] = useState(10);
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardDescription, setRewardDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [newRewardTitle, setNewRewardTitle] = useState('');
  const [newRewardStamps, setNewRewardStamps] = useState(10);
  const [isAddingReward, setIsAddingReward] = useState(false);

  useEffect(() => {
    if (!activePlaceId) { setIsLoading(false); return; }
    Promise.all([
      fetchWithAuth(`/business/places/${activePlaceId}/loyalty/program`).catch(() => null),
      fetchWithAuth(`/business/places/${activePlaceId}/loyalty/rewards`).catch(() => []),
    ]).then(([prog, rwds]) => {
      if (prog) {
        setProgram(prog);
        setType(prog.type || 'stamps');
        setStampsToReward(prog.stampsToReward || 10);
        setPointsPerVisit(prog.pointsPerVisit || 10);
        setRewardTitle(prog.rewardTitle || '');
        setRewardDescription(prog.rewardDescription || '');
        setIsActive(prog.isActive ?? true);
      }
      setRewards(Array.isArray(rwds) ? rwds : []);
    }).finally(() => setIsLoading(false));
  }, [activePlaceId]);

  const handleSave = async () => {
    if (!activePlaceId) return;
    setIsSaving(true);
    try {
      const saved = await fetchWithAuth(`/business/places/${activePlaceId}/loyalty/program`, {
        method: 'PUT',
        body: JSON.stringify({ type, stampsToReward, pointsPerVisit, rewardTitle, rewardDescription, isActive }),
      });
      setProgram(saved);
      toast.success('Programa guardado');
    } catch { toast.error('Error al guardar'); }
    setIsSaving(false);
  };

  const handleAddReward = async () => {
    if (!activePlaceId || !newRewardTitle) return;
    setIsAddingReward(true);
    try {
      const reward = await fetchWithAuth(`/business/places/${activePlaceId}/loyalty/rewards`, {
        method: 'POST',
        body: JSON.stringify({ title: newRewardTitle, stampsCost: newRewardStamps }),
      });
      setRewards(prev => [...prev, reward]);
      setNewRewardTitle('');
      setNewRewardStamps(10);
    } catch { toast.error('Error al crear premio'); }
    setIsAddingReward(false);
  };

  const handleDeleteReward = async (rewardId: string) => {
    if (!activePlaceId) return;
    await fetchWithAuth(`/business/places/${activePlaceId}/loyalty/rewards/${rewardId}`, { method: 'DELETE' });
    setRewards(prev => prev.filter(r => r.id !== rewardId));
  };

  const publicCardLink = typeof window !== 'undefined'
    ? `${window.location.origin}/tarjeta/${activePlaceId}`
    : '';

  if (isLoading) return (
    <div className="py-20 text-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="font-bold text-gray-400">Cargando programa...</p>
    </div>
  );

  return (
    <div className="max-w-6xl space-y-8 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">

      {/* ── HEADER ── */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div className="space-y-1">
          <h1 className="text-5xl font-black text-text tracking-tight font-warike">Programa de Fidelización</h1>
          <p className="text-text-muted font-bold text-lg max-w-xl leading-snug">
            Recompensa a tus clientes frecuentes con sellos o puntos canjeables.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {isActive ? 'Activo' : 'Inactivo'}
          </span>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`w-14 h-8 rounded-full relative transition-colors ${isActive ? 'bg-primary' : 'bg-gray-200'}`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${isActive ? 'right-1' : 'left-1'}`} />
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary flex items-center gap-2 px-6 py-3 text-sm disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : '💾'}
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </header>

      {/* ── GRID PRINCIPAL ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── COLUMNA IZQUIERDA: Tipo + Configuración ── */}
        <div className="space-y-6">

          {/* Tipo de programa */}
          <section className="bg-white p-6 rounded-[2rem] border border-border shadow-sm space-y-4">
            <h2 className="font-black text-text font-warike text-base flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-primary rounded-full" />
              Tipo de Programa
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {(['stamps', 'points'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`p-5 rounded-[1.5rem] border-2 text-center space-y-2 transition-all ${type === t
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                    : 'border-border bg-background hover:border-primary/30'}`}
                >
                  <div className="text-3xl">{t === 'stamps' ? '⭐' : '🪙'}</div>
                  <p className="font-black text-text text-sm">{t === 'stamps' ? 'Sellos' : 'Puntos'}</p>
                  <p className="text-[9px] font-bold text-text-muted leading-snug">
                    {t === 'stamps' ? '1 sello por visita' : 'Puntos según el consumo'}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* Configuración */}
          <section className="bg-white p-6 rounded-[2rem] border border-border shadow-sm space-y-5">
            <h2 className="font-black text-text font-warike text-base flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-secondary rounded-full" />
              Configuración
            </h2>

            {type === 'stamps' ? (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Sellos para ganar premio</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setStampsToReward(s => Math.max(1, s - 1))} className="w-10 h-10 rounded-xl bg-background border border-border font-black text-lg hover:bg-primary/5 transition-all">−</button>
                  <span className="flex-1 text-center font-black text-2xl text-text">{stampsToReward}</span>
                  <button onClick={() => setStampsToReward(s => Math.min(50, s + 1))} className="w-10 h-10 rounded-xl bg-background border border-border font-black text-lg hover:bg-primary/5 transition-all">+</button>
                </div>
                <p className="text-[10px] font-bold text-text-muted text-center">
                  {stampsToReward} sellos = 1 premio
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Puntos por visita</label>
                <input type="number" min={1} value={pointsPerVisit} onChange={e => setPointsPerVisit(+e.target.value)} className="input-premium w-full" />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Premio principal</label>
              <input
                type="text"
                value={rewardTitle}
                onChange={e => setRewardTitle(e.target.value)}
                placeholder="Ej: Ceviche gratis, 20% de descuento..."
                className="input-premium w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Descripción del premio</label>
              <textarea
                value={rewardDescription}
                onChange={e => setRewardDescription(e.target.value)}
                placeholder="Ej: Un ceviche personal de cortesía en tu próxima visita"
                className="input-premium w-full resize-none"
                rows={2}
              />
            </div>
          </section>

          {/* Premios adicionales */}
          <section className="bg-white p-6 rounded-[2rem] border border-border shadow-sm space-y-4">
            <h2 className="font-black text-text font-warike text-base flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-accent rounded-full" />
              Premios Adicionales
            </h2>

            {rewards.length > 0 && (
              <div className="space-y-2">
                {rewards.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-background rounded-xl border border-border">
                    <div>
                      <p className="font-black text-text text-sm">{r.title}</p>
                      <p className="text-[9px] font-bold text-text-muted">{r.stampsCost} sellos</p>
                    </div>
                    <button onClick={() => handleDeleteReward(r.id)} className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all text-xs font-black flex items-center justify-center">✕</button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newRewardTitle}
                onChange={e => setNewRewardTitle(e.target.value)}
                placeholder="Nombre del premio"
                className="input-premium flex-1 text-sm py-3"
              />
              <input
                type="number"
                value={newRewardStamps}
                onChange={e => setNewRewardStamps(+e.target.value)}
                className="input-premium w-16 text-sm py-3 text-center"
              />
              <button
                onClick={handleAddReward}
                disabled={isAddingReward || !newRewardTitle}
                className="bg-text text-white px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-primary transition-all disabled:opacity-50"
              >
                + Agregar
              </button>
            </div>
          </section>
        </div>

        {/* ── COLUMNA DERECHA: Wallet + Tarjeta ── */}
        <div className="space-y-6">

          {/* Wallet */}
          <section className="bg-white p-6 rounded-[2rem] border border-border shadow-sm space-y-5">
            <h2 className="font-black text-text font-warike text-base flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
              Wallet Digital
              <span className="ml-auto text-[9px] font-black px-2.5 py-1 bg-green-100 text-green-700 rounded-full uppercase tracking-wider">Activo</span>
            </h2>
            <p className="text-xs font-bold text-text-muted leading-relaxed">
              Tus clientes pueden agregar su tarjeta directamente al wallet de su móvil desde la página de su tarjeta. Los sellos se reflejan en tiempo real.
            </p>

            <div className="space-y-3">
              {/* Apple Wallet */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-black text-white">
                <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AppleIcon />
                </div>
                <div className="flex-1">
                  <p className="font-black text-sm">Apple Wallet</p>
                  <p className="text-[10px] text-white/60 font-bold">iOS · Pase .pkpass nativo</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </div>

              {/* Google Wallet */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <GoogleWalletIcon />
                </div>
                <div className="flex-1">
                  <p className="font-black text-sm">Google Wallet</p>
                  <p className="text-[10px] text-white/60 font-bold">Android · JWT firmado</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-3 text-[10px] font-bold text-blue-700 leading-relaxed">
              Los botones aparecen automáticamente en la tarjeta del cliente según su dispositivo (iOS o Android).
            </div>

            {/* Preview tarjeta */}
            <div className="relative h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-orange-500 to-amber-400 p-5 shadow-lg">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-8 -translate-x-6" />
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/70 text-[9px] font-black uppercase tracking-widest">Tarjeta de Fidelización</p>
                    <p className="text-white font-black text-base leading-tight">Wuarike</p>
                  </div>
                  <div className="text-2xl">⭐</div>
                </div>
                <div className="flex items-end justify-between">
                  <div className="flex gap-1.5">
                    {Array.from({ length: stampsToReward }).slice(0, 8).map((_, i) => (
                      <div key={i} className={`w-4 h-4 rounded-full border-2 border-white/80 ${i < 3 ? 'bg-white' : 'bg-white/20'}`} />
                    ))}
                    {stampsToReward > 8 && <span className="text-white/60 text-xs font-black self-center">+{stampsToReward - 8}</span>}
                  </div>
                  <p className="text-white/60 text-[9px] font-black">3 / {stampsToReward} sellos</p>
                </div>
              </div>
            </div>
          </section>

          {/* Tarjeta digital del cliente */}
          <section className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-[2rem] border border-orange-100 shadow-sm space-y-4">
            <h2 className="font-black text-orange-900 font-warike text-base flex items-center gap-2">
              📱 Tarjeta Digital del Cliente
            </h2>

            <p className="text-orange-700 font-bold text-xs leading-relaxed">
              Comparte este enlace con tus clientes para que vean su progreso y sellen con su teléfono.
            </p>

            <div className="bg-white rounded-xl border border-orange-100 p-3">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">URL base</p>
              <p className="font-black text-orange-600 text-xs break-all">{publicCardLink}/[teléfono]</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(publicCardLink); toast.success('Copiado'); }}
                className="flex-1 bg-orange-500 text-white font-black text-[10px] uppercase tracking-widest px-4 py-3 rounded-xl hover:bg-orange-600 transition-all"
              >
                Copiar Enlace
              </button>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    const text = `¡Únete a nuestro programa de fidelización! Acumula sellos y gana premios: ${publicCardLink}`;
                    if (navigator.share) {
                      navigator.share({ title: 'Programa de Fidelización', url: publicCardLink, text });
                    } else {
                      navigator.clipboard.writeText(text);
                      toast.success('Mensaje copiado');
                    }
                  }
                }}
                className="flex-1 bg-white border border-orange-200 text-orange-600 font-black text-[10px] uppercase tracking-widest px-4 py-3 rounded-xl hover:bg-orange-50 transition-all"
              >
                Compartir
              </button>
            </div>
          </section>

          {/* Stats rápidas */}
          {program && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-border shadow-sm text-center">
                <p className="text-2xl font-black text-primary">{program.totalCards || 0}</p>
                <p className="text-[9px] font-black text-text-muted uppercase tracking-wider mt-1">Tarjetas</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-border shadow-sm text-center">
                <p className="text-2xl font-black text-green-600">{program.totalRedemptions || 0}</p>
                <p className="text-[9px] font-black text-text-muted uppercase tracking-wider mt-1">Canjes</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-border shadow-sm text-center">
                <p className="text-2xl font-black text-blue-600">{program.totalScans || 0}</p>
                <p className="text-[9px] font-black text-text-muted uppercase tracking-wider mt-1">Escaneos</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AppleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function GoogleWalletIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="5" width="20" height="14" rx="3" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.5"/>
      <path d="M2 9h20" stroke="white" strokeWidth="1.5"/>
      <circle cx="17" cy="14" r="2.5" fill="white" fillOpacity="0.8"/>
      <circle cx="17" cy="14" r="1" fill="white"/>
    </svg>
  );
}
