'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi } from '../../../lib/api-client';
import { SkeletonHeader, SkeletonCard } from '../../../components/SkeletonLoader';
import WhatsAppSetupWizard from '../../../components/WhatsAppSetupWizard';
import { toast } from 'sonner';

export default function WhatsAppConfigPage() {
  const { activePlaceId } = useRestaurant();
  const [numbers, setNumbers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activePlaceId) { setIsLoading(false); return; }
    try {
      const res = await businessApi.getWhatsappNumbers(activePlaceId);
      setNumbers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [activePlaceId]);

  useEffect(() => { setIsLoading(true); load(); }, [load]);

  const handleDelete = async (numberId: string) => {
    if (!confirm('¿Desconectar este número de WhatsApp? Dejará de responder y recibir mensajes en Wuarikes.')) return;
    try {
      await businessApi.deleteWhatsappNumber(numberId);
      setNumbers(prev => prev.filter(n => n.id !== numberId));
      toast.success('Número desconectado');
    } catch {
      toast.error('Error al desconectar el número');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl space-y-10 pb-32">
        <SkeletonHeader />
        <SkeletonCard className="h-56" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-10 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header className="space-y-2">
        <h1 className="text-5xl font-black text-text tracking-tight font-warike">WhatsApp con Facebook</h1>
        <p className="text-text-muted font-bold text-lg">Conecta el número de tu restaurante — {numbers.length} {numbers.length === 1 ? 'número conectado' : 'números conectados'}.</p>
      </header>

      {activePlaceId && <WhatsAppSetupWizard placeId={activePlaceId} onChanged={load} />}

      <div className="space-y-4">
        <h2 className="font-black text-text text-lg">Números conectados</h2>
        {numbers.length === 0 ? (
          <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-border text-center">
            <p className="text-4xl mb-4">📱</p>
            <p className="font-bold text-text-muted">Todavía no conectaste ningún número</p>
            <p className="text-xs text-text-muted mt-2">Usa el botón de arriba para conectar tu WhatsApp con Facebook.</p>
          </div>
        ) : (
          numbers.map(num => (
            <div key={num.id} className="bg-white p-6 rounded-[2rem] border border-border flex items-center justify-between hover:shadow-md transition-all">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-black text-text">+{num.phoneNumber}</h3>
                  <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${num.isActive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {num.isActive ? '🟢 Activo' : '⏳ Pendiente'}
                  </span>
                  <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${num.provider === 'meta' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                    {num.provider === 'meta' ? (num.isActive ? 'Facebook' : 'Facebook (pausado)') : 'PlazBot'}
                  </span>
                </div>
                <p className="text-xs text-text-muted">Registrado el {new Date(num.createdAt).toLocaleDateString('es-PE')}</p>
              </div>
              {/* Solo los números conectados con Facebook se pueden desconectar desde aquí; los demás los gestiona el administrador. */}
              {num.provider === 'meta' && (
                <button
                  onClick={() => handleDelete(num.id)}
                  className="ml-4 px-4 py-2 bg-red-100 text-red-700 rounded-xl font-black text-sm hover:bg-red-200 transition-all active:scale-95"
                >
                  Desconectar
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
