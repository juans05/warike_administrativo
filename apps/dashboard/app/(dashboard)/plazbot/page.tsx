'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { plazbotApi, businessApi } from '../../../lib/api-client';
import { useRestaurant } from '../../../context/RestaurantContext';
import { toast } from 'sonner';

type Tone = 'professional' | 'casual' | 'friendly';

const TONE_LABELS: Record<Tone, string> = {
  professional: 'Profesional',
  casual: 'Casual',
  friendly: 'Amistoso',
};

type BotConfig = {
  placeId: string;
  systemPrompt: string | null;
  tone: Tone;
  isActive: boolean;
};

type Metrics = {
  totalContacts: number;
  totalConversations: number;
  totalOpportunities: number;
  totalTasks: number;
};

type Template = {
  id: string;
  elementName: string;
  languageCode: string;
  category: string;
};

type WaNumber = {
  id: string;
  phoneNumber: string;
  phoneNumberId: string;
  isActive: boolean;
  verificationStatus: string;
  createdAt: string;
};

export default function PlazbotSetupPage() {
  const { activePlaceId } = useRestaurant();

  const [plazbotConnected, setPlazbotConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Bot config form
  const [formData, setFormData] = useState({ systemPrompt: '', tone: 'professional' as Tone });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [generatingPrompt, setGeneratingPrompt] = useState(false);

  // Metrics & templates
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ name: '', templateId: '', contacts: '' });
  const [campaignSending, setCampaignSending] = useState(false);
  const [campaignResult, setCampaignResult] = useState('');

  // WhatsApp number registration
  const [waNumbers, setWaNumbers] = useState<WaNumber[]>([]);
  const [waForm, setWaForm] = useState({ phoneNumber: '', phoneNumberId: '', whatsappApiToken: '' });
  const [waRegistering, setWaRegistering] = useState(false);
  const [waError, setWaError] = useState('');
  const [waSuccess, setWaSuccess] = useState('');

  const loadMetricsAndTemplates = useCallback(async () => {
    const [m, t] = await Promise.allSettled([
      plazbotApi.getMetrics(),
      plazbotApi.getTemplates(),
    ]);
    if (m.status === 'fulfilled' && m.value) setMetrics(m.value);
    if (t.status === 'fulfilled' && Array.isArray(t.value)) setTemplates(t.value);
  }, []);

  const loadWaNumbers = useCallback(async () => {
    if (!activePlaceId) return;
    try {
      const res = await businessApi.getWhatsappNumbers(activePlaceId);
      setWaNumbers(res.data || []);
    } catch { /* silencioso */ }
  }, [activePlaceId]);

  useEffect(() => {
    const load = async () => {
      try {
        const status = await plazbotApi.getStatus();
        setPlazbotConnected(status?.connected ?? false);

        if (status?.connected && activePlaceId) {
          const config = await plazbotApi.getConfig(activePlaceId);
          setFormData({
            systemPrompt: config?.systemPrompt || '',
            tone: (config?.tone as Tone) || 'professional',
          });
          await loadMetricsAndTemplates();
        }
      } catch { /* sin conexión */ }
      finally { setLoading(false); }
    };
    load();
    loadWaNumbers();
  }, [activePlaceId, loadMetricsAndTemplates, loadWaNumbers]);

  const handleSuggestPrompt = async () => {
    if (!activePlaceId) return;
    setGeneratingPrompt(true);
    try {
      const res = await businessApi.suggestBotPrompt(activePlaceId);
      setFormData(p => ({ ...p, systemPrompt: res.systemPrompt }));
      toast.success('Instrucciones generadas con IA');
    } catch {
      toast.error('Error al generar las instrucciones');
    } finally {
      setGeneratingPrompt(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlaceId) return;
    setSaving(true); setSaveError(''); setSaveSuccess('');
    try {
      await plazbotApi.configure({ placeId: activePlaceId, ...formData });
      setSaveSuccess('Configuración guardada.');
    } catch (err: any) {
      setSaveError(err.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const handleRegisterWaNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waForm.phoneNumber || !waForm.phoneNumberId || !waForm.whatsappApiToken) {
      setWaError('Completa todos los campos'); return;
    }
    setWaRegistering(true); setWaError(''); setWaSuccess('');
    try {
      await businessApi.createWhatsappNumber({ placeId: activePlaceId, ...waForm });
      setWaForm({ phoneNumber: '', phoneNumberId: '', whatsappApiToken: '' });
      setWaSuccess('✅ Número registrado. El webhook se configuró automáticamente en PlazBot.');
      await loadWaNumbers();
    } catch (err: any) {
      setWaError(err.message || 'Error al registrar número');
    } finally { setWaRegistering(false); }
  };

  const handleDeleteWaNumber = async (numberId: string) => {
    if (!confirm('¿Eliminar este número?')) return;
    try {
      await businessApi.deleteWhatsappNumber(numberId);
      setWaNumbers(waNumbers.filter(n => n.id !== numberId));
    } catch { /* silencioso */ }
  };

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setCampaignSending(true); setCampaignResult('');
    try {
      const contacts = campaignForm.contacts.split(',').map(s => s.trim()).filter(Boolean);
      await plazbotApi.createCampaign({ name: campaignForm.name, templateId: campaignForm.templateId, contacts });
      setCampaignResult('Campaña lanzada correctamente.');
      setCampaignForm({ name: '', templateId: '', contacts: '' });
      setShowCampaignForm(false);
    } catch (err: any) {
      setCampaignResult(err.message || 'Error al lanzar la campaña');
    } finally { setCampaignSending(false); }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-8 space-y-4">
        <div className="h-8 bg-gray-200 rounded-lg w-1/2 animate-pulse" />
        <div className="h-4 bg-gray-100 rounded-lg w-3/4 animate-pulse" />
        <div className="bg-white p-8 rounded-2xl border border-gray-100 space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">PlazBot</h1>
        <p className="text-gray-500 mt-1">Configura el comportamiento del bot de WhatsApp para tu restaurante</p>
      </div>

      {/* Estado PlazBot */}
      <div className={`rounded-2xl p-4 border flex items-center gap-3 ${plazbotConnected ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${plazbotConnected ? 'bg-green-500' : 'bg-amber-400'}`} />
        <div>
          <p className={`font-black text-sm ${plazbotConnected ? 'text-green-800' : 'text-amber-800'}`}>
            {plazbotConnected ? 'PlazBot Activo' : 'PlazBot no configurado'}
          </p>
          <p className={`text-xs mt-0.5 ${plazbotConnected ? 'text-green-700' : 'text-amber-700'}`}>
            {plazbotConnected
              ? 'El sistema de WhatsApp está activo. Los mensajes de tus clientes llegarán al bot automáticamente.'
              : 'Las credenciales de PlazBot deben configurarse en el servidor. Contacta al administrador.'}
          </p>
        </div>
      </div>

      {/* ─── REGISTRO NÚMERO WHATSAPP ─── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
        <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest">
          📱 Número de WhatsApp
        </h2>

        {/* Números registrados */}
        {waNumbers.length > 0 && (
          <div className="space-y-2">
            {waNumbers.map(num => (
              <div key={num.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <div>
                  <p className="text-sm font-black text-gray-900">{num.phoneNumber}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {num.phoneNumberId}</p>
                  <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    num.isActive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {num.isActive ? '🟢 Activo' : '⏳ Pendiente'}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteWaNumber(num.id)}
                  className="text-xs text-red-500 font-bold hover:text-red-700 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Formulario registro nuevo número */}
        <form onSubmit={handleRegisterWaNumber} className="space-y-4">
          <p className="text-xs text-gray-400">
            Registra tu número de Gupshup/WhatsApp Business. El webhook se configurará automáticamente.
          </p>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
              Número de Teléfono
            </label>
            <input
              type="tel"
              placeholder="+51 947 196 047"
              value={waForm.phoneNumber}
              onChange={e => setWaForm(p => ({ ...p, phoneNumber: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
              Phone Number ID <span className="normal-case font-normal text-gray-400">(de Gupshup / Meta)</span>
            </label>
            <input
              type="text"
              placeholder="1125526153979521"
              value={waForm.phoneNumberId}
              onChange={e => setWaForm(p => ({ ...p, phoneNumberId: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
              API Token de WhatsApp <span className="normal-case font-normal text-gray-400">(de Gupshup)</span>
            </label>
            <input
              type="password"
              placeholder="103683••••••6105"
              value={waForm.whatsappApiToken}
              onChange={e => setWaForm(p => ({ ...p, whatsappApiToken: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none text-sm font-mono"
            />
          </div>

          {waError && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-200 text-sm">{waError}</div>
          )}
          {waSuccess && (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl border border-green-200 text-sm font-medium">{waSuccess}</div>
          )}

          <button
            type="submit"
            disabled={waRegistering}
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-black hover:opacity-90 transition-all disabled:opacity-50 text-sm"
          >
            {waRegistering ? '⏳ Registrando...' : '✅ Registrar Número'}
          </button>
        </form>
      </div>

      {/* ─── PERSONALIZACIÓN DEL BOT ─── */}
      {plazbotConnected && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest mb-4">
            Personalización del Bot
          </h2>
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                Tono de Respuesta
              </label>
              <select
                value={formData.tone}
                onChange={e => setFormData(p => ({ ...p, tone: e.target.value as Tone }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none text-sm"
              >
                {(Object.entries(TONE_LABELS) as [Tone, string][]).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                  Instrucciones para el Bot{' '}
                  <span className="text-gray-400 normal-case font-normal">(opcional)</span>
                </label>
                <button
                  type="button"
                  onClick={handleSuggestPrompt}
                  disabled={generatingPrompt}
                  title="Generar con IA"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-black hover:bg-violet-100 transition-all disabled:opacity-50"
                >
                  {generatingPrompt ? (
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
                    </svg>
                  )}
                  {generatingPrompt ? 'Generando...' : 'Proponer con IA'}
                </button>
              </div>
              <textarea
                value={formData.systemPrompt}
                onChange={e => setFormData(p => ({ ...p, systemPrompt: e.target.value }))}
                placeholder="Ej: Eres el asistente de El Huarique. Sé amable, menciona siempre la promoción del día y ofrece reservas para grupos de más de 4 personas."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none text-sm resize-none"
                rows={4}
              />
              <p className="text-xs text-gray-400 mt-1">
                Si lo dejas vacío, el bot usa instrucciones generales de asistente de restaurante.
              </p>
            </div>

            {saveError && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-200 text-sm">{saveError}</div>}
            {saveSuccess && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl border border-green-200 text-sm font-medium">{saveSuccess}</div>}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#F26122] text-white py-3 rounded-xl font-black hover:opacity-95 transition-all disabled:opacity-50 text-sm"
            >
              {saving ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </form>
        </div>
      )}

      {/* ─── MÉTRICAS ─── */}
      {plazbotConnected && metrics && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest mb-4">Métricas del Workspace</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Contactos', value: metrics.totalContacts },
              { label: 'Conversaciones', value: metrics.totalConversations },
              { label: 'Oportunidades', value: metrics.totalOpportunities },
              { label: 'Tareas', value: metrics.totalTasks },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-gray-900">{value?.toLocaleString() ?? '—'}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── CAMPAÑAS WHATSAPP ─── */}
      {plazbotConnected && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest">Campañas WhatsApp</h2>
            {templates.length > 0 && (
              <button
                onClick={() => { setShowCampaignForm(v => !v); setCampaignResult(''); }}
                className="px-4 py-2 bg-[#F26122] text-white rounded-xl font-bold text-xs hover:opacity-90 transition-all"
              >
                {showCampaignForm ? 'Cancelar' : '+ Nueva Campaña'}
              </button>
            )}
          </div>

          {templates.length === 0 && (
            <p className="text-sm text-gray-400">No hay templates aprobados en el workspace de PlazBot.</p>
          )}

          {campaignResult && (
            <p className={`text-sm font-medium px-3 py-2 rounded-xl border ${
              campaignResult.includes('Error') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
            }`}>
              {campaignResult}
            </p>
          )}

          {showCampaignForm && (
            <form onSubmit={handleLaunchCampaign} className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Nombre</label>
                <input
                  type="text"
                  value={campaignForm.name}
                  onChange={e => setCampaignForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ej: Promo fin de semana"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Template</label>
                <select
                  value={campaignForm.templateId}
                  onChange={e => setCampaignForm(p => ({ ...p, templateId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                  required
                >
                  <option value="">Seleccionar template...</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.elementName} ({t.languageCode.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">
                  IDs de Contactos <span className="normal-case font-normal text-gray-400">(separados por coma)</span>
                </label>
                <input
                  type="text"
                  value={campaignForm.contacts}
                  onChange={e => setCampaignForm(p => ({ ...p, contacts: e.target.value }))}
                  placeholder="id_contacto_1, id_contacto_2, ..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-orange-400 outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={campaignSending}
                className="w-full py-2.5 bg-[#F26122] text-white rounded-xl font-black text-sm hover:opacity-90 transition-all disabled:opacity-50"
              >
                {campaignSending ? 'Lanzando...' : 'Lanzar Campaña'}
              </button>
            </form>
          )}

          {templates.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Templates activos</p>
              {templates.map(t => (
                <div key={t.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <span className="text-sm font-bold text-gray-800">{t.elementName}</span>
                    <span className="ml-2 text-xs text-gray-400">{t.languageCode.toUpperCase()}</span>
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg px-2 py-0.5">
                    {t.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
