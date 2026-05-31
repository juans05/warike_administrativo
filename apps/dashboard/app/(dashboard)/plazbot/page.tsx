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
  phoneNumber: string;
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
  const [loading, setLoading] = useState(true);

  const [botConfig, setBotConfig] = useState<BotConfig | null>(null);
  const [formData, setFormData] = useState({ systemPrompt: '', tone: 'professional' as Tone, phoneNumber: '' });
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

        if (activePlaceId) {
          const config = await plazbotApi.getConfig(activePlaceId);
          setBotConfig(config);
          setFormData({
            systemPrompt: config?.systemPrompt || '',
            tone: (config?.tone as Tone) || 'professional',
            phoneNumber: config?.phoneNumber || '',
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
          Configura tu número de WhatsApp y el comportamiento del bot
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest mb-4">
          Configuración de WhatsApp
        </h2>
        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
              Número de WhatsApp
            </label>
            <input
              type="text"
              value={formData.phoneNumber}
              onChange={e => setFormData(p => ({ ...p, phoneNumber: e.target.value }))}
              placeholder="+51999999999"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none text-sm"
            />
          </div>

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
              Instrucciones para el Bot
            </label>
            <textarea
              value={formData.systemPrompt}
              onChange={e => setFormData(p => ({ ...p, systemPrompt: e.target.value }))}
              placeholder="Ej: Eres el asistente del restaurante..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none text-sm resize-none"
              rows={4}
            />
          </div>

          {saveError && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-200 text-sm">{saveError}</div>}
          {saveSuccess && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl border border-green-200 text-sm">{saveSuccess}</div>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#F26122] text-white py-3 rounded-xl font-black hover:opacity-95 transition-all disabled:opacity-50 text-sm"
          >
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </form>
      </div>

      {plazbotConnected && metrics && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest mb-4">Métricas del Workspace</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Contactos', value: metrics.totalContacts },
              { label: 'Conversaciones', value: metrics.totalConversations },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-gray-900">{value?.toLocaleString() ?? '—'}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
