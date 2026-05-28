'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi } from '../../../lib/api-client';
import { SkeletonHeader, SkeletonCard, SkeletonGrid } from '../../../components/SkeletonLoader';

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
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email'>('whatsapp');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState<string | null>(null);

  // WhatsApp Broadcast States
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [waNumbers, setWaNumbers] = useState<any[]>([]);
  const [waFormData, setWaFormData] = useState({
    campaignName: '',
    templateBody: '',
    whatsappNumberId: '',
  });

  // Email Campaign States
  const [emailCampaigns, setEmailCampaigns] = useState<any[]>([]);
  const [emailFormData, setEmailFormData] = useState({
    campaignName: '',
    subject: '',
    bodyHtml: '',
  });

  useEffect(() => {
    if (!activePlaceId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    Promise.all([
      businessApi.getBroadcasts(activePlaceId),
      businessApi.getWhatsappNumbers(activePlaceId),
      businessApi.getEmailCampaigns(activePlaceId),
    ])
      .then(([bcRes, waRes, emailRes]) => {
        setBroadcasts(bcRes.data || []);
        setWaNumbers(waRes.data || []);
        setEmailCampaigns(emailRes || []);
        if (waRes.data?.[0]) {
          setWaFormData(prev => ({ ...prev, whatsappNumberId: waRes.data[0].id }));
        }
      })
      .catch(err => console.error('Error fetching campaigns data:', err))
      .finally(() => setIsLoading(false));
  }, [activePlaceId]);

  // WhatsApp Actions
  const handleCreateWhatsAppBroadcast = async () => {
    if (!waFormData.campaignName || !waFormData.templateBody) {
      alert('Completa todos los campos');
      return;
    }
    setIsSaving(true);
    try {
      const res = await businessApi.createBroadcast({
        placeId: activePlaceId,
        ...waFormData,
      });
      setBroadcasts([res, ...broadcasts]);
      setWaFormData({ campaignName: '', templateBody: '', whatsappNumberId: waFormData.whatsappNumberId });
      alert('Campaña de WhatsApp creada');
    } catch (err) {
      alert('Error al crear campaña de WhatsApp');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendWhatsAppBroadcast = async (broadcastId: string) => {
    if (!confirm('¿Enviar campaña de WhatsApp a todos los clientes?')) return;
    setIsSending(broadcastId);
    try {
      await businessApi.sendBroadcast(broadcastId);
      alert('Campaña de WhatsApp encolada para envío');
      const updated = await businessApi.getBroadcasts(activePlaceId);
      setBroadcasts(updated.data || []);
    } catch (err) {
      alert('Error al enviar campaña de WhatsApp');
    } finally {
      setIsSending(null);
    }
  };

  // Email Actions
  const handleCreateEmailCampaign = async () => {
    if (!emailFormData.campaignName || !emailFormData.subject || !emailFormData.bodyHtml) {
      alert('Completa todos los campos');
      return;
    }
    setIsSaving(true);
    try {
      const res = await businessApi.createEmailCampaign({
        placeId: activePlaceId,
        ...emailFormData,
      });
      setEmailCampaigns([res, ...emailCampaigns]);
      setEmailFormData({ campaignName: '', subject: '', bodyHtml: '' });
      alert('Campaña de Email creada como borrador');
    } catch (err) {
      alert('Error al crear campaña de Email');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendEmailCampaign = async (campaignId: string) => {
    if (!confirm('¿Enviar esta campaña de Email a todos los clientes con consentimiento?')) return;
    setIsSending(campaignId);
    try {
      await businessApi.sendEmailCampaign(campaignId);
      alert('Campaña de Email encolada para envío masivo');
      const updated = await businessApi.getEmailCampaigns(activePlaceId);
      setEmailCampaigns(updated || []);
    } catch (err) {
      alert('Error al enviar campaña de Email');
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
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-text tracking-tight font-warike">Campañas Masivas</h1>
          <p className="text-text-muted font-bold text-lg">
            Envía mensajes personalizados de WhatsApp y Email a tus comensales registrados.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl ring-1 ring-black/5 shrink-0">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'whatsapp'
                ? 'bg-white text-primary shadow-md'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            💬 WhatsApp
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'email'
                ? 'bg-white text-primary shadow-md'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            ✉️ Email Marketing
          </button>
        </div>
      </header>

      {activeTab === 'whatsapp' ? (
        /* ═══════════════════════════════════════════════ */
        /* WHATSAPP TAB                                    */
        /* ═══════════════════════════════════════════════ */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1 bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 space-y-6 h-fit">
            <h2 className="font-black text-text text-xl">Nueva Campaña de WhatsApp</h2>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Nombre de la Campaña
                </label>
                <input
                  type="text"
                  placeholder="Ej: Happy Hour - Descuento 30%"
                  value={waFormData.campaignName}
                  onChange={(e) => setWaFormData({ ...waFormData, campaignName: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Mensaje (usa {'{nombre}'} para personalizar)
                </label>
                <textarea
                  placeholder="Hola {nombre}, te invitamos a nuestro Happy Hour con 30% descuento..."
                  value={waFormData.templateBody}
                  onChange={(e) => setWaFormData({ ...waFormData, templateBody: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm font-medium"
                />
                <p className="text-[10px] text-gray-400 font-semibold mt-2">
                  💡 Usa <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">{'{nombre}'}</span> para que cada cliente reciba su nombre de pila.
                </p>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Número de WhatsApp Remitente
                </label>
                {waNumbers.length === 0 ? (
                  <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
                    <p className="text-xs font-bold text-yellow-700">
                      ⚠️ Debes configurar un número de WhatsApp Business antes de crear campañas.
                    </p>
                  </div>
                ) : (
                  <select
                    value={waFormData.whatsappNumberId}
                    onChange={(e) => setWaFormData({ ...waFormData, whatsappNumberId: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary text-xs font-semibold"
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
                onClick={handleCreateWhatsAppBroadcast}
                disabled={isSaving || waNumbers.length === 0}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-50 hover:scale-[1.02] transition-transform active:scale-95 shadow-md"
              >
                {isSaving ? 'Creando...' : '🚀 Crear Campaña'}
              </button>
            </div>
          </div>

          {/* List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-black text-text text-xl px-2">Campañas de WhatsApp Registradas</h2>
            {broadcasts.length === 0 ? (
              <div className="bg-white p-16 rounded-[3rem] border border-dashed border-border text-center">
                <p className="text-5xl mb-4">📢</p>
                <p className="font-black text-text-muted text-sm">Sin campañas de WhatsApp aún</p>
              </div>
            ) : (
              broadcasts.map(bc => (
                <div
                  key={bc.id}
                  className="bg-white p-6 rounded-[2rem] border border-border flex items-center justify-between hover:shadow-md transition-all duration-300"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-black text-text text-base truncate">{bc.campaignName}</h3>
                      <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${STATUS_COLORS[bc.status]}`}>
                        {STATUS_EMOJI[bc.status]} {bc.status}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted font-semibold line-clamp-1 italic">"{bc.templateBody}"</p>
                    <div className="flex gap-4 mt-3 text-[10px] font-bold text-text-muted">
                      <span>📤 {bc.messagesSent} mensajes enviados</span>
                      <span>📅 {new Date(bc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {bc.status === 'DRAFT' && (
                    <button
                      onClick={() => handleSendWhatsAppBroadcast(bc.id)}
                      disabled={isSending === bc.id}
                      className="px-6 py-3.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50 hover:scale-[1.02] transition-transform active:scale-95 shrink-0 shadow-md"
                    >
                      {isSending === bc.id ? '⏳' : '🚀 Lanzar'}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════ */
        /* EMAIL MARKETING TAB                             */
        /* ═══════════════════════════════════════════════ */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1 bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 space-y-6 h-fit">
            <h2 className="font-black text-text text-xl">Nueva Campaña de Email</h2>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Nombre de la Campaña
                </label>
                <input
                  type="text"
                  placeholder="Ej: Oferta Fin de Semana"
                  value={emailFormData.campaignName}
                  onChange={(e) => setEmailFormData({ ...emailFormData, campaignName: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Asunto del Correo
                </label>
                <input
                  type="text"
                  placeholder="¡Hola {nombre}! Te regalamos un postre hoy"
                  value={emailFormData.subject}
                  onChange={(e) => setEmailFormData({ ...emailFormData, subject: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm font-semibold"
                />
                <p className="text-[9px] text-gray-400 font-semibold mt-1">
                  💡 También puedes usar <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{'{nombre}'}</span> en el asunto.
                </p>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Contenido del Correo (HTML o Texto)
                </label>
                <textarea
                  placeholder="<h1>¡Hola {nombre}!</h1><p>Queremos invitarte este fin de semana...</p>"
                  value={emailFormData.bodyHtml}
                  onChange={(e) => setEmailFormData({ ...emailFormData, bodyHtml: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-xs font-mono"
                />
                <p className="text-[9px] text-gray-400 font-semibold mt-2">
                  💡 Soporta etiquetas HTML estándar para estructurar tus campañas (ej: `<h1>`, `<p>`, `<strong>`).
                </p>
              </div>

              <button
                onClick={handleCreateEmailCampaign}
                disabled={isSaving}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-50 hover:scale-[1.02] transition-transform active:scale-95 shadow-md"
              >
                {isSaving ? 'Creando...' : '🚀 Crear Campaña de Email'}
              </button>
            </div>
          </div>

          {/* List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-black text-text text-xl px-2">Campañas de Email Registradas</h2>
            {emailCampaigns.length === 0 ? (
              <div className="bg-white p-16 rounded-[3rem] border border-dashed border-border text-center">
                <p className="text-5xl mb-4">📧</p>
                <p className="font-black text-text-muted text-sm">Sin campañas de Email aún</p>
              </div>
            ) : (
              emailCampaigns.map(campaign => (
                <div
                  key={campaign.id}
                  className="bg-white p-6 rounded-[2rem] border border-border flex items-center justify-between hover:shadow-md transition-all duration-300"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-black text-text text-base truncate">{campaign.campaignName}</h3>
                      <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${STATUS_COLORS[campaign.status]}`}>
                        {STATUS_EMOJI[campaign.status]} {campaign.status}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted font-bold line-clamp-1">
                      Asunto: <span className="font-black text-text">{campaign.subject}</span>
                    </p>
                    <div className="flex gap-4 mt-3 text-[10px] font-bold text-text-muted">
                      <span>📧 {campaign.emailsSent} correos enviados</span>
                      <span>📅 {new Date(campaign.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {campaign.status === 'DRAFT' && (
                    <button
                      onClick={() => handleSendEmailCampaign(campaign.id)}
                      disabled={isSending === campaign.id}
                      className="px-6 py-3.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50 hover:scale-[1.02] transition-transform active:scale-95 shrink-0 shadow-md"
                    >
                      {isSending === campaign.id ? '⏳' : '🚀 Lanzar'}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
