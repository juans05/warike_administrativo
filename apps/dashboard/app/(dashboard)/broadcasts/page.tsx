'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi } from '../../../lib/api-client';
import { SkeletonHeader, SkeletonCard, SkeletonGrid, SkeletonFormField } from '../../../components/SkeletonLoader';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-blue-100 text-blue-700',
  SCHEDULED: 'bg-yellow-100 text-yellow-700',
  SENDING: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
};

const STATUS_EMOJI: Record<string, string> = {
  DRAFT: '📝',
  SCHEDULED: '⏰',
  SENDING: '📤',
  COMPLETED: '✅',
  FAILED: '❌',
};

export default function BroadcastsPage() {
  const { activePlaceId } = useRestaurant();
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [waNumbers, setWaNumbers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    campaignName: '',
    templateBody: '',
    whatsappNumberId: '',
  });

  useEffect(() => {
    if (!activePlaceId) { setIsLoading(false); return; }
    setIsLoading(true);
    Promise.all([
      businessApi.getBroadcasts(activePlaceId),
      businessApi.getWhatsappNumbers(activePlaceId),
    ])
      .then(([bcRes, waRes]) => {
        setBroadcasts(bcRes.data || []);
        setWaNumbers(waRes.data || []);
        if (waRes.data?.[0]) {
          setFormData(prev => ({ ...prev, whatsappNumberId: waRes.data[0].id }));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, [activePlaceId]);

  const handleCreateBroadcast = async () => {
    if (!formData.campaignName || !formData.templateBody) {
      alert('Completa todos los campos');
      return;
    }
    setIsSaving(true);
    try {
      const res = await businessApi.createBroadcast({
        placeId: activePlaceId,
        ...formData,
      });
      setBroadcasts([res, ...broadcasts]);
      setFormData({ campaignName: '', templateBody: '', whatsappNumberId: formData.whatsappNumberId });
      alert('Campaña creada');
    } catch (err) {
      alert('Error al crear campaña');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendBroadcast = async (broadcastId: string) => {
    if (!confirm('¿Enviar campaña a todos los clientes?')) return;
    setIsSending(broadcastId);
    try {
      await businessApi.sendBroadcast(broadcastId);
      alert('Campaña enviada');
      // Refresh broadcasts
      const updated = await businessApi.getBroadcasts(activePlaceId);
      setBroadcasts(updated.data || []);
    } catch (err) {
      alert('Error al enviar campaña');
    } finally {
      setIsSending(null);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl space-y-10 pb-32">
        <SkeletonHeader />
        <div className="space-y-6">
          <SkeletonCard className="h-80" />
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded-lg w-1/4 animate-pulse"></div>
            <SkeletonGrid count={3} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-10 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header className="space-y-2">
        <h1 className="text-5xl font-black text-text tracking-tight font-warike">Campañas Masivas</h1>
        <p className="text-text-muted font-bold text-lg">Envía mensajes personalizados a todos tus clientes — {broadcasts.length} campañas.</p>
      </header>

      {/* Form */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 space-y-6">
        <h2 className="font-black text-text">Nueva Campaña</h2>

        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
            Nombre de la Campaña
          </label>
          <input
            type="text"
            placeholder="Ej: Happy Hour - Descuento 30%"
            value={formData.campaignName}
            onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
            Mensaje (usa {'{nombre}'} para personalizar)
          </label>
          <textarea
            placeholder="Hola {nombre}, te invitamos a nuestro Happy Hour con 30% descuento..."
            value={formData.templateBody}
            onChange={(e) => setFormData({ ...formData, templateBody: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <p className="text-xs text-gray-400 mt-2">
            💡 Usa <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">{'{nombre}'}</span> para que cada cliente reciba su nombre personalizado
          </p>
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
            Número de WhatsApp
          </label>
          {waNumbers.length === 0 ? (
            <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
              <p className="text-sm font-bold text-yellow-700">
                ⚠️ Debes configurar un número de WhatsApp Business antes de crear campañas
              </p>
            </div>
          ) : (
            <select
              value={formData.whatsappNumberId}
              onChange={(e) => setFormData({ ...formData, whatsappNumberId: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary"
            >
              {waNumbers.map(num => (
                <option key={num.id} value={num.id}>
                  {num.phoneNumber} — {num.verificationStatus}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={handleCreateBroadcast}
          disabled={isSaving || waNumbers.length === 0}
          className="w-full bg-primary text-white px-8 py-4 rounded-2xl font-black disabled:opacity-50 hover:scale-[1.02] transition-transform active:scale-95"
        >
          {isSaving ? 'Creando...' : '🚀 Crear Campaña'}
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        <h2 className="font-black text-text text-lg">Campañas Registradas</h2>
        {broadcasts.length === 0 ? (
          <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-border text-center">
            <p className="text-4xl mb-4">📢</p>
            <p className="font-bold text-text-muted">Sin campañas aún</p>
          </div>
        ) : (
          broadcasts.map(bc => (
            <div
              key={bc.id}
              className="bg-white p-6 rounded-[2rem] border border-border flex items-center justify-between hover:shadow-md transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-black text-text">{bc.campaignName}</h3>
                  <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${STATUS_COLORS[bc.status]}`}>
                    {STATUS_EMOJI[bc.status]} {bc.status}
                  </span>
                </div>
                <p className="text-sm text-text-muted line-clamp-1">{bc.templateBody}</p>
                <p className="text-xs text-text-muted mt-2">
                  📤 {bc.messagesSent} mensajes enviados
                </p>
              </div>
              {bc.status === 'DRAFT' && (
                <button
                  onClick={() => handleSendBroadcast(bc.id)}
                  disabled={isSending === bc.id}
                  className="ml-4 px-6 py-3 bg-primary text-white rounded-xl font-black text-sm disabled:opacity-50 hover:scale-[1.02] transition-transform active:scale-95"
                >
                  {isSending === bc.id ? '⏳' : '🚀 Lanzar'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
