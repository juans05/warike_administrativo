'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { plazbotApi } from '../../../lib/api-client';
import { useRestaurant } from '../../../context/RestaurantContext';

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
  webhookUrl: string;
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

type CampaignForm = {
  name: string;
  templateId: string;
  contacts: string;
};

export default function PlazbotSetupPage() {
  const { activePlaceId } = useRestaurant();

  const [plazbotConnected, setPlazbotConnected] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookCopied, setWebhookCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const [botConfig, setBotConfig] = useState<BotConfig | null>(null);
  const [formData, setFormData] = useState({ systemPrompt: '', tone: 'professional' as Tone });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaignForm, setCampaignForm] = useState<CampaignForm>({ name: '', templateId: '', contacts: '' });
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campaignSending, setCampaignSending] = useState(false);
  const [campaignResult, setCampaignResult] = useState('');

  const loadMetricsAndTemplates = useCallback(async () => {
    const [m, t] = await Promise.allSettled([
      plazbotApi.getMetrics(),
      plazbotApi.getTemplates(),
    ]);
    if (m.status === 'fulfilled' && m.value) setMetrics(m.value);
    if (t.status === 'fulfilled' && Array.isArray(t.value)) setTemplates(t.value);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const status = await plazbotApi.getStatus();
        setPlazbotConnected(status?.connected ?? false);
        setWebhookUrl(status?.webhookUrl || '');

        if (status?.connected && activePlaceId) {
          const config = await plazbotApi.getConfig(activePlaceId);
          setBotConfig(config);
          setFormData({
            systemPrompt: config?.systemPrompt || '',
            tone: (config?.tone as Tone) || 'professional',
          });
          await loadMetricsAndTemplates();
        }
      } catch {
        // sin conexión
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activePlaceId, loadMetricsAndTemplates]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlaceId) return;
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      const saved = await plazbotApi.configure({ placeId: activePlaceId, ...formData });
      setBotConfig(saved);
      setSaveSuccess('Configuración guardada.');
    } catch (err: any) {
      setSaveError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyWebhook = () => {
    if (!webhookUrl) return;
    navigator.clipboard.writeText(webhookUrl).then(() => {
      setWebhookCopied(true);
      setTimeout(() => setWebhookCopied(false), 2000);
    });
  };

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setCampaignSending(true);
    setCampaignResult('');
    try {
      const contacts = campaignForm.contacts.split(',').map(s => s.trim()).filter(Boolean);
      await plazbotApi.createCampaign({ name: campaignForm.name, templateId: campaignForm.templateId, contacts });
      setCampaignResult('Campaña lanzada correctamente.');
      setCampaignForm({ name: '', templateId: '', contacts: '' });
      setShowCampaignForm(false);
    } catch (err: any) {
      setCampaignResult(err.message || 'Error al lanzar la campaña');
    } finally {
      setCampaignSending(false);
    }
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
        <p className="text-gray-500 mt-1">
          Configura el comportamiento del bot de WhatsApp para tu restaurante
        </p>
      </div>

      {/* Estado de conexión global */}
      <div className={`rounded-2xl p-5 space-y-3 border ${plazbotConnected ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full inline-block ${plazbotConnected ? 'bg-green-500' : 'bg-amber-400'}`} />
          <span className={`font-black text-sm ${plazbotConnected ? 'text-green-800' : 'text-amber-800'}`}>
            {plazbotConnected ? 'PlazBot Activo' : 'PlazBot no configurado'}
          </span>
        </div>
        {plazbotConnected ? (
          <p className="text-xs text-green-700">
            El sistema de WhatsApp está activo. Los mensajes de tus clientes llegarán al bot automáticamente.
          </p>
        ) : (
          <p className="text-xs text-amber-700">
            Las credenciales de PlazBot deben configurarse en el servidor. Contacta al administrador de la plataforma.
          </p>
        )}

        {/* Webhook URL */}
        {webhookUrl && (
          <div className="bg-white border border-green-200 rounded-xl px-4 py-3">
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">URL del Webhook</p>
            <p className="text-xs text-gray-500 mb-2">
              Copia esta URL y configúrala en PlazBot → canal WhatsApp → Webhook
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 truncate text-gray-700">
                {webhookUrl}
              </code>
              <button
                onClick={handleCopyWebhook}
                className="shrink-0 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 transition-all"
              >
                {webhookCopied ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Configuración del bot para este restaurante */}
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
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                Instrucciones para el Bot{' '}
                <span className="text-gray-400 normal-case font-normal">(opcional)</span>
              </label>
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

            {saveError && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-200 text-sm">
                {saveError}
              </div>
            )}
            {saveSuccess && (
              <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl border border-green-200 text-sm font-medium">
                {saveSuccess}
              </div>
            )}

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

      {/* Métricas del workspace PlazBot */}
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

      {/* Campañas de WhatsApp */}
      {plazbotConnected && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest">
              Campañas WhatsApp
            </h2>
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
            <p className="text-sm text-gray-400">
              No hay templates aprobados en el workspace de PlazBot.
            </p>
          )}

          {campaignResult && (
            <p className={`text-sm font-medium px-3 py-2 rounded-xl border ${campaignResult.includes('Error') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
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
