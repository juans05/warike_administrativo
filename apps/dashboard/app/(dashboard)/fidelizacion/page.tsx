'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { fetchWithAuth } from '../../../lib/api-client';

export default function FidelizacionPage() {
  const { activePlaceId } = useRestaurant();
  const [program, setProgram] = useState<any>(null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [type, setType] = useState<'stamps' | 'points'>('stamps');
  const [stampsToReward, setStampsToReward] = useState(10);
  const [pointsPerVisit, setPointsPerVisit] = useState(10);
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardDescription, setRewardDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Reward form
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
      alert('Programa guardado ✅');
    } catch { alert('Error al guardar'); }
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
    } catch { alert('Error al crear premio'); }
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

  if (isLoading) return <div className="py-20 text-center font-bold text-gray-400">Cargando programa...</div>;

  return (
    <div className="max-w-4xl space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header className="space-y-2">
        <h1 className="text-5xl font-black text-text tracking-tight font-warike">Programa de Fidelización</h1>
        <p className="text-text-muted font-bold text-lg max-w-2xl">
          Configura sellos o puntos para recompensar a tus clientes frecuentes.
        </p>
      </header>

      {/* Estado */}
      <div className="flex items-center gap-4 p-6 bg-white rounded-[2rem] border border-border shadow-sm">
        <div className={`w-4 h-4 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
        <div className="flex-1">
          <p className="font-black text-text text-sm">{isActive ? 'Programa Activo' : 'Programa Inactivo'}</p>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            {program ? 'Los clientes pueden acumular sellos al escanear el NFC' : 'Configura el programa para activarlo'}
          </p>
        </div>
        <button
          onClick={() => setIsActive(!isActive)}
          className={`w-14 h-8 rounded-full relative transition-colors ${isActive ? 'bg-primary' : 'bg-gray-200'}`}
        >
          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${isActive ? 'right-1' : 'left-1'}`} />
        </button>
      </div>

      {/* Tipo */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm space-y-6">
        <h2 className="font-black text-text font-warike text-xl">Tipo de Programa</h2>
        <div className="grid grid-cols-2 gap-4">
          {(['stamps', 'points'] as const).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`p-6 rounded-[2rem] border-2 text-center space-y-2 transition-all ${type === t ? 'border-primary bg-primary/5' : 'border-border bg-background'}`}
            >
              <div className="text-3xl">{t === 'stamps' ? '⭐' : '🪙'}</div>
              <p className="font-black text-text text-sm">{t === 'stamps' ? 'Sellos' : 'Puntos'}</p>
              <p className="text-[10px] font-bold text-text-muted">
                {t === 'stamps' ? '1 sello por visita' : 'Puntos según el consumo'}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Configuración */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm space-y-6">
        <h2 className="font-black text-text font-warike text-xl">Configuración</h2>
        <div className="space-y-5">
          {type === 'stamps' ? (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Sellos para ganar premio</label>
              <input
                type="number"
                min={1} max={50}
                value={stampsToReward}
                onChange={e => setStampsToReward(+e.target.value)}
                className="input-premium w-full"
              />
              <p className="text-[10px] font-bold text-text-muted">Ej: 10 sellos = 1 visita gratis</p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Puntos por visita</label>
              <input
                type="number"
                min={1}
                value={pointsPerVisit}
                onChange={e => setPointsPerVisit(+e.target.value)}
                className="input-premium w-full"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Premio principal</label>
            <input
              type="text"
              value={rewardTitle}
              onChange={e => setRewardTitle(e.target.value)}
              placeholder="Ej: Ceviche gratis, 20% de descuento..."
              className="input-premium w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Descripción del premio</label>
            <textarea
              value={rewardDescription}
              onChange={e => setRewardDescription(e.target.value)}
              placeholder="Ej: Un ceviche personal de cortesía en tu próxima visita"
              className="input-premium w-full resize-none min-h-[80px]"
            />
          </div>
        </div>

        <button onClick={handleSave} disabled={isSaving} className="btn-primary w-full py-5 text-sm uppercase tracking-widest disabled:opacity-50">
          {isSaving ? 'Guardando...' : '💾 Guardar Configuración'}
        </button>
      </div>

      {/* Premios adicionales */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm space-y-6">
        <h2 className="font-black text-text font-warike text-xl">Premios Adicionales</h2>

        {rewards.length > 0 && (
          <div className="space-y-3">
            {rewards.map(r => (
              <div key={r.id} className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border">
                <div>
                  <p className="font-black text-text text-sm">{r.title}</p>
                  <p className="text-[10px] font-bold text-text-muted">{r.stampsCost} sellos</p>
                </div>
                <button onClick={() => handleDeleteReward(r.id)} className="text-red-400 hover:text-red-600 text-xs font-black uppercase">Eliminar</button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <input
            type="text"
            value={newRewardTitle}
            onChange={e => setNewRewardTitle(e.target.value)}
            placeholder="Nombre del premio"
            className="input-premium flex-1"
          />
          <input
            type="number"
            value={newRewardStamps}
            onChange={e => setNewRewardStamps(+e.target.value)}
            className="input-premium w-24"
            placeholder="Sellos"
          />
          <button onClick={handleAddReward} disabled={isAddingReward || !newRewardTitle} className="bg-text text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary transition-all disabled:opacity-50">
            + Agregar
          </button>
        </div>
      </div>

      {/* Link público */}
      {program && (
        <div className="bg-orange-50 border border-orange-100 p-8 rounded-[2.5rem] space-y-4">
          <h2 className="font-black text-orange-800 font-warike">Tarjeta Digital del Cliente</h2>
          <p className="text-orange-700 font-bold text-sm">Los clientes pueden ver su tarjeta en:</p>
          <p className="font-black text-orange-600 text-sm break-all">{publicCardLink}/[teléfono]</p>
          <button
            onClick={() => { navigator.clipboard.writeText(`${publicCardLink}`); alert('Copiado'); }}
            className="bg-orange-500 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-orange-600 transition-all"
          >
            Copiar Enlace Base
          </button>
        </div>
      )}
    </div>
  );
}
