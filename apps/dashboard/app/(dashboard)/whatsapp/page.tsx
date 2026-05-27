'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi } from '../../../lib/api-client';
import { SkeletonHeader, SkeletonCard, SkeletonGrid } from '../../../components/SkeletonLoader';

export default function WhatsAppConfigPage() {
  const { activePlaceId } = useRestaurant();
  const [numbers, setNumbers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    phoneNumber: '',
    phoneNumberId: '',
    whatsappApiToken: '',
  });

  useEffect(() => {
    if (!activePlaceId) { setIsLoading(false); return; }
    setIsLoading(true);
    businessApi.getWhatsappNumbers(activePlaceId)
      .then(res => setNumbers(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, [activePlaceId]);

  const handleRegister = async () => {
    if (!formData.phoneNumber || !formData.phoneNumberId || !formData.whatsappApiToken) {
      alert('Completa todos los campos');
      return;
    }
    setIsSaving(true);
    try {
      const res = await businessApi.createWhatsappNumber({
        placeId: activePlaceId,
        ...formData,
      });
      setNumbers([res, ...numbers]);
      setFormData({ phoneNumber: '', phoneNumberId: '', whatsappApiToken: '' });
      alert('Número registrado');
    } catch (err) {
      alert('Error al registrar número');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (numberId: string) => {
    if (!confirm('¿Eliminar este número de WhatsApp?')) return;
    try {
      await businessApi.deleteWhatsappNumber(numberId);
      setNumbers(numbers.filter(n => n.id !== numberId));
      alert('Número eliminado');
    } catch (err) {
      alert('Error al eliminar número');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl space-y-10 pb-32">
        <SkeletonHeader />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <SkeletonCard className="lg:col-span-2 h-80" />
          <SkeletonCard className="h-80" />
        </div>
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded-lg w-1/4 animate-pulse"></div>
          <SkeletonGrid count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-10 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header className="space-y-2">
        <h1 className="text-5xl font-black text-text tracking-tight font-warike">Configuración de WhatsApp</h1>
        <p className="text-text-muted font-bold text-lg">Gestiona tus números de WhatsApp Business — {numbers.length} números registrados.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 space-y-6">
          <h2 className="font-black text-text">Registrar Número</h2>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
              Número de Teléfono
            </label>
            <input
              type="tel"
              placeholder="+51 987 654 321"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
              Phone Number ID
            </label>
            <input
              type="text"
              placeholder="123456789012345"
              value={formData.phoneNumberId}
              onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <p className="text-xs text-gray-400 mt-2">
              Obtén este ID desde tu{' '}
              <a
                href="https://developers.facebook.com/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-bold hover:underline"
              >
                Meta Developer Portal
              </a>
            </p>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
              API Token de WhatsApp
            </label>
            <input
              type="password"
              placeholder="EAAxxxxxxxxxxxxxxxxx"
              value={formData.whatsappApiToken}
              onChange={(e) => setFormData({ ...formData, whatsappApiToken: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono"
            />
            <p className="text-xs text-gray-400 mt-2">
              Token de acceso permanente o temporal de Meta
            </p>
          </div>

          <button
            onClick={handleRegister}
            disabled={isSaving}
            className="w-full bg-primary text-white px-8 py-4 rounded-2xl font-black disabled:opacity-50 hover:scale-[1.02] transition-transform active:scale-95"
          >
            {isSaving ? '⏳ Registrando...' : '✅ Registrar Número'}
          </button>
        </div>

        {/* Help */}
        <div className="lg:col-span-1 bg-blue-50 border border-blue-200 p-6 rounded-[2.5rem] h-fit space-y-4">
          <h3 className="font-black text-blue-700">📖 Cómo obtener credenciales</h3>
          <div className="space-y-3 text-sm text-blue-700">
            <div>
              <p className="font-bold mb-1">1. Phone Number ID</p>
              <p className="text-xs">En Meta Developer Portal → Apps → Tu App → WhatsApp → Configuration</p>
            </div>
            <div>
              <p className="font-bold mb-1">2. API Token</p>
              <p className="text-xs">En Meta Developer Portal → Apps → Tu App → Settings → System User Tokens</p>
            </div>
            <div>
              <p className="font-bold mb-1">3. Webhook URL</p>
              <p className="text-xs text-blue-600 font-mono bg-white px-2 py-1 rounded">
                https://tu-dominio.com/business/webhooks/whatsapp
              </p>
            </div>
          </div>
          <a
            href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs font-bold text-blue-700 hover:underline mt-2"
          >
            Documentación oficial →
          </a>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        <h2 className="font-black text-text text-lg">Números Registrados</h2>
        {numbers.length === 0 ? (
          <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-border text-center">
            <p className="text-4xl mb-4">📱</p>
            <p className="font-bold text-text-muted">Sin números registrados</p>
            <p className="text-xs text-text-muted mt-2">Registra tu primer número para habilitar WhatsApp Chat</p>
          </div>
        ) : (
          numbers.map(num => (
            <div
              key={num.id}
              className="bg-white p-6 rounded-[2rem] border border-border flex items-center justify-between hover:shadow-md transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-black text-text">{num.phoneNumber}</h3>
                  <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                    num.verificationStatus === 'VERIFIED'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {num.verificationStatus === 'VERIFIED' ? '✅ Verificado' : '⏳ Pendiente'}
                  </span>
                  {num.isActive && (
                    <span className="text-[9px] font-black px-3 py-1 rounded-full bg-green-100 text-green-700 uppercase">
                      🟢 Activo
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted font-mono">ID: {num.phoneNumberId}</p>
                <p className="text-xs text-text-muted">
                  Registrado el {new Date(num.createdAt).toLocaleDateString('es-PE')}
                </p>
              </div>
              <button
                onClick={() => handleDelete(num.id)}
                className="ml-4 px-4 py-2 bg-red-100 text-red-700 rounded-xl font-black text-sm hover:bg-red-200 transition-all active:scale-95"
              >
                🗑️ Eliminar
              </button>
            </div>
          ))
        )}
      </div>

      {/* Webhook Info */}
      {numbers.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 p-6 rounded-[2.5rem] space-y-3">
          <p className="font-black text-purple-700">🔗 Webhook Configurado</p>
          <p className="text-sm text-purple-700">
            Asegúrate de haber configurado el webhook en Meta Developer Portal:
          </p>
          <div className="bg-white p-4 rounded-xl font-mono text-xs text-purple-700 border border-purple-200 break-all">
            https://backendwarike-production.up.railway.app/business/webhooks/whatsapp
          </div>
          <p className="text-xs text-purple-700">
            Usa el token de verificación: <span className="font-bold">wuarike_webhook_verification_token_2026</span>
          </p>
        </div>
      )}
    </div>
  );
}
