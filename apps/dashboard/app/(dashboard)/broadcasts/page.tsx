'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi, plazbotApi } from '../../../lib/api-client';
import { toast } from 'sonner';

type Tab = 'campaigns' | 'templates';
type TemplateStep = 'info' | 'message' | 'buttons';
type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
type BroadcastStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'FAILED';

interface Broadcast {
  id: string;
  campaignName: string;
  templateBody: string;
  status: BroadcastStatus;
  messagesSent: number;
  createdAt: string;
  whatsappNumber?: { phoneNumber: string };
}

interface Template {
  id: string;
  elementName: string;
  languageCode: string;
  category: string;
}

interface WaNumber { id: string; phoneNumber: string; isActive: boolean }
interface QuickReply { text: string }
interface CtaButton { text: string; type: 'URL' | 'PHONE'; value: string }
interface VariableSample { value: string; type: string }

const VARIABLE_TYPES = [
  'Nombre del contacto', 'Teléfono del contacto', 'Celular del contacto',
  'Email del contacto', 'País del contacto', 'Nombre del agente',
];

const CATEGORY_INFO: Record<TemplateCategory, { icon: string; color: string; desc: string; example: string }> = {
  MARKETING: {
    icon: '📣', color: 'amber',
    desc: 'Para promociones, ofertas, descuentos y anuncios comerciales.',
    example: '¡Hola {{1}}! Esta semana 2x1 en ceviche. Ven a El Huarique y disfruta.',
  },
  UTILITY: {
    icon: '🔧', color: 'blue',
    desc: 'Para confirmaciones, recordatorios y actualizaciones de pedidos/reservas.',
    example: '{{1}}, tu reserva para {{2}} personas el {{3}} está confirmada. ¡Te esperamos!',
  },
  AUTHENTICATION: {
    icon: '🔒', color: 'purple',
    desc: 'Para códigos de verificación de un solo uso (OTP). Raramente necesario en restaurantes.',
    example: 'Tu código de verificación de El Huarique es: {{1}}. Caduca en 10 minutos.',
  },
};

const TEMPLATE_STEPS: TemplateStep[] = ['info', 'message', 'buttons'];
const STEP_LABELS: Record<TemplateStep, string> = { info: 'Plantilla', message: 'Mensaje', buttons: 'Botones' };

const STATUS_COLOR: Record<BroadcastStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  SENDING: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
};
const STATUS_LABEL: Record<BroadcastStatus, string> = {
  DRAFT: 'Borrador', SCHEDULED: 'Programado', SENDING: 'Enviando', COMPLETED: 'Completado', FAILED: 'Fallido',
};

const EMPTY_CAMPAIGN = { campaignName: '', whatsappNumberId: '', templateBody: '', segment: 'all' };
const EMPTY_TEMPLATE = {
  elementName: '', category: 'MARKETING' as TemplateCategory, language: 'es',
  headerText: '', body: '', footer: '',
  quickReplies: [] as QuickReply[], ctaButtons: [] as CtaButton[],
  variableSamples: {} as Record<number, VariableSample>,
};

export default function BroadcastsPage() {
  const { activePlaceId } = useRestaurant();

  const [tab, setTab] = useState<Tab>('campaigns');
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [waNumbers, setWaNumbers] = useState<WaNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');

  // Campaign modal
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignForm, setCampaignForm] = useState(EMPTY_CAMPAIGN);
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  // Template modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateStep, setTemplateStep] = useState<TemplateStep>('info');
  const [templateForm, setTemplateForm] = useState(EMPTY_TEMPLATE);
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  useEffect(() => {
    if (!activePlaceId) { setLoading(false); return; }
    loadAll();
  }, [activePlaceId]);

  const loadAll = async () => {
    setLoading(true);
    const [bs, ts, nums] = await Promise.allSettled([
      businessApi.getBroadcasts(activePlaceId!),
      plazbotApi.getTemplates(),
      businessApi.getWhatsappNumbers(activePlaceId!),
    ]);
    if (bs.status === 'fulfilled') setBroadcasts(bs.value || []);
    if (ts.status === 'fulfilled') setTemplates(Array.isArray(ts.value) ? ts.value : []);
    if (nums.status === 'fulfilled') setWaNumbers((nums.value?.data || []).filter((n: WaNumber) => n.isActive));
    setLoading(false);
  };

  const syncTemplates = async () => {
    setSyncing(true);
    try {
      const ts = await plazbotApi.getTemplates();
      setTemplates(Array.isArray(ts) ? ts : []);
      toast.success('Plantillas sincronizadas');
    } catch { toast.error('Error al sincronizar plantillas'); }
    finally { setSyncing(false); }
  };

  const handleCreateCampaign = async () => {
    if (!campaignForm.campaignName.trim()) { toast.warning('Escribe un nombre para la campaña'); return; }
    if (!campaignForm.whatsappNumberId) { toast.warning('Selecciona un número de WhatsApp'); return; }
    if (!campaignForm.templateBody.trim()) { toast.warning('Escribe el mensaje de la campaña'); return; }
    setCreatingCampaign(true);
    try {
      const created = await businessApi.createBroadcast({
        placeId: activePlaceId!,
        whatsappNumberId: campaignForm.whatsappNumberId,
        campaignName: campaignForm.campaignName,
        templateBody: campaignForm.templateBody,
        segmentFilter: { type: campaignForm.segment },
      });
      setBroadcasts(prev => [created, ...prev]);
      setShowCampaignModal(false);
      setCampaignForm(EMPTY_CAMPAIGN);
      toast.success('Campaña creada como borrador');
    } catch (e: any) { toast.error(e?.message || 'Error al crear campaña'); }
    finally { setCreatingCampaign(false); }
  };

  const handleSendBroadcast = async (broadcastId: string) => {
    try {
      await businessApi.sendBroadcast(broadcastId);
      setBroadcasts(prev => prev.map(b => b.id === broadcastId ? { ...b, status: 'SENDING' as BroadcastStatus } : b));
      toast.success('Campaña enviada');
    } catch (e: any) { toast.error(e?.message || 'Error al enviar'); }
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.elementName.trim()) { toast.warning('Escribe el nombre de la plantilla'); return; }
    if (!templateForm.body.trim()) { toast.warning('Escribe el cuerpo del mensaje'); return; }
    setCreatingTemplate(true);
    try {
      await plazbotApi.createTemplate({
        elementName: templateForm.elementName,
        category: templateForm.category,
        languageCode: templateForm.language,
        headerText: templateForm.headerText || undefined,
        body: templateForm.body,
        footer: templateForm.footer || undefined,
        quickReplies: templateForm.quickReplies.filter(q => q.text.trim()),
        ctaButtons: templateForm.ctaButtons.filter(c => c.text.trim()),
        variableSamples: templateForm.variableSamples,
      });
      toast.success('Plantilla enviada para aprobación de Meta');
      setShowTemplateModal(false);
      setTemplateForm(EMPTY_TEMPLATE);
      setTemplateStep('info');
      await syncTemplates();
    } catch (e: any) { toast.error(e?.message || 'Error al crear plantilla'); }
    finally { setCreatingTemplate(false); }
  };

  // Detect {{N}} variables in body text
  const bodyVariables = (body: string): number[] => {
    const matches = [...body.matchAll(/\{\{(\d+)\}\}/g)];
    return [...new Set(matches.map(m => parseInt(m[1])))].sort((a, b) => a - b);
  };

  const addVariable = () => {
    const existing = bodyVariables(templateForm.body);
    const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    setTemplateForm(p => ({ ...p, body: p.body + `{{${next}}}` }));
  };

  const removeVariable = (n: number) => {
    setTemplateForm(p => {
      const newBody = p.body.replace(new RegExp(`\\{\\{${n}\\}\\}`, 'g'), '');
      const newSamples = { ...p.variableSamples };
      delete newSamples[n];
      return { ...p, body: newBody, variableSamples: newSamples };
    });
  };

  const filteredTemplates = templates.filter(t =>
    !templateSearch || t.elementName?.toLowerCase().includes(templateSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-8 space-y-6">
        <div className="h-10 bg-gray-200 rounded-xl w-1/3 animate-pulse" />
        <div className="h-12 bg-gray-100 rounded-2xl w-48 animate-pulse" />
        <div className="h-56 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 pb-20 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Campañas Masivas</h1>
        <p className="text-gray-500 mt-1 font-medium">Envía mensajes personalizados de WhatsApp a tus clientes.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
        {([['campaigns', '💬 Campañas'], ['templates', '📋 Plantilla']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === id ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── CAMPAÑAS TAB ── */}
      {tab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-800">Campañas WhatsApp</h2>
            <button
              onClick={() => setShowCampaignModal(true)}
              className="px-5 py-2.5 bg-[#F26122] text-white text-xs font-black rounded-xl hover:opacity-90 transition-all"
            >
              + Nueva Campaña
            </button>
          </div>

          {broadcasts.length === 0 ? (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-16 text-center space-y-3">
              <p className="text-5xl">📢</p>
              <p className="font-black text-gray-700 text-lg">No hay campañas de WhatsApp aún</p>
              <p className="text-sm text-gray-400">Crea tu primera campaña masiva para llegar a tus clientes</p>
              <button onClick={() => setShowCampaignModal(true)} className="mt-2 px-6 py-3 bg-[#F26122] text-white text-xs font-black rounded-xl hover:opacity-90 transition-all">
                + Nueva Campaña
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {broadcasts.map(b => (
                <div key={b.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-black text-gray-900 text-sm">{b.campaignName}</h3>
                      <span className={`shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${STATUS_COLOR[b.status]}`}>
                        {STATUS_LABEL[b.status]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{b.templateBody}</p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold">
                      <span>{b.messagesSent} enviados</span>
                      {b.whatsappNumber && <span>· {b.whatsappNumber.phoneNumber}</span>}
                      <span>· {new Date(b.createdAt).toLocaleDateString('es-PE')}</span>
                    </div>
                  </div>
                  {b.status === 'DRAFT' && (
                    <button
                      onClick={() => handleSendBroadcast(b.id)}
                      className="shrink-0 ml-4 px-4 py-2 bg-green-600 text-white text-xs font-black rounded-xl hover:bg-green-700 transition-all"
                    >
                      ▶ Enviar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PLANTILLA TAB ── */}
      {tab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-40">
              <input
                type="text"
                placeholder="Buscar plantillas..."
                value={templateSearch}
                onChange={e => setTemplateSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"
              />
              <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              onClick={syncTemplates}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-black text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sincronizar
            </button>
            <button
              onClick={() => { setShowTemplateModal(true); setTemplateForm(EMPTY_TEMPLATE); setTemplateStep('info'); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1E73BE] text-white rounded-xl text-xs font-black hover:opacity-90 transition-all"
            >
              + Agregar Plantilla
            </button>
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center space-y-4">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="font-black text-gray-700 text-lg">Plantillas</p>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">Crea y gestiona plantillas de WhatsApp para usar en tus campañas y envíos individuales.</p>
              <button
                onClick={() => { setShowTemplateModal(true); setTemplateForm(EMPTY_TEMPLATE); setTemplateStep('info'); }}
                className="px-6 py-3 bg-[#1E73BE] text-white text-xs font-black rounded-xl hover:opacity-90 transition-all"
              >
                + Agregar Plantilla
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTemplates.map(t => (
                <div key={t.id} className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center justify-between hover:shadow-sm transition-all">
                  <div>
                    <p className="font-black text-gray-900 text-sm">{t.elementName}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">{t.languageCode?.toUpperCase()}</p>
                  </div>
                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border ${
                    t.category === 'MARKETING' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    t.category === 'UTILITY' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-purple-50 text-purple-700 border-purple-200'
                  }`}>
                    {t.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: Nueva Campaña ── */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
              <div>
                <h3 className="font-black text-gray-900">Nueva Campaña WhatsApp</h3>
                <p className="text-xs text-gray-400 mt-0.5">Completa los campos para crear tu campaña</p>
              </div>
              <button onClick={() => setShowCampaignModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-7 py-6 space-y-5">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Nombre de la Campaña</label>
                <input
                  type="text"
                  value={campaignForm.campaignName}
                  onChange={e => setCampaignForm(p => ({ ...p, campaignName: e.target.value }))}
                  placeholder="Ej: Promo fin de semana"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Número de WhatsApp</label>
                {waNumbers.length === 0 ? (
                  <p className="text-sm text-red-500 font-medium bg-red-50 px-4 py-3 rounded-xl">No hay números activos. Ve a PlazBot para registrar uno.</p>
                ) : (
                  <select
                    value={campaignForm.whatsappNumberId}
                    onChange={e => setCampaignForm(p => ({ ...p, whatsappNumberId: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                  >
                    <option value="">Seleccionar número...</option>
                    {waNumbers.map(n => <option key={n.id} value={n.id}>{n.phoneNumber}</option>)}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                  Mensaje <span className="normal-case font-normal text-gray-400">— usa {'{nombre}'} para personalizar</span>
                </label>
                <textarea
                  value={campaignForm.templateBody}
                  onChange={e => setCampaignForm(p => ({ ...p, templateBody: e.target.value }))}
                  placeholder="Hola {nombre}, ¡tenemos una promoción especial para ti hoy! 🎉"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Segmento de Clientes</label>
                <select
                  value={campaignForm.segment}
                  onChange={e => setCampaignForm(p => ({ ...p, segment: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                >
                  <option value="all">Todos los clientes</option>
                  <option value="vip">Clientes VIP</option>
                  <option value="inactive">Inactivos (+30 días)</option>
                </select>
              </div>
            </div>

            <div className="px-7 py-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowCampaignModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-black text-gray-600 hover:bg-gray-50 transition-all">
                Cancelar
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={creatingCampaign}
                className="flex-1 py-3 bg-[#F26122] text-white rounded-xl text-sm font-black hover:opacity-90 transition-all disabled:opacity-50"
              >
                {creatingCampaign ? 'Creando...' : 'Guardar Borrador'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Nueva Plantilla (multi-paso) ── */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="font-black text-gray-900">Nueva Plantilla de WhatsApp</h3>
                <p className="text-xs text-gray-400 mt-0.5">Completa los campos para comenzar</p>
              </div>
              <button onClick={() => { setShowTemplateModal(false); setTemplateForm(EMPTY_TEMPLATE); setTemplateStep('info'); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left sidebar */}
              <div className="w-44 border-r border-gray-100 py-4 shrink-0 overflow-y-auto">
                {TEMPLATE_STEPS.map(step => (
                  <button
                    key={step}
                    onClick={() => setTemplateStep(step)}
                    className={`w-full text-left px-5 py-3.5 text-sm font-bold transition-colors border-r-2 ${templateStep === step ? 'bg-blue-50 text-blue-700 border-blue-600' : 'text-gray-500 hover:bg-gray-50 border-transparent'}`}
                  >
                    {STEP_LABELS[step]}
                  </button>
                ))}
              </div>

              {/* Center form */}
              <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
                {templateStep === 'info' && <>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Nombre de la Plantilla</label>
                    <input
                      type="text"
                      value={templateForm.elementName}
                      onChange={e => setTemplateForm(p => ({ ...p, elementName: e.target.value.replace(/\s+/g, '_').toLowerCase() }))}
                      placeholder="promo_fin_semana"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Solo minúsculas y guiones bajos. Sin espacios ni caracteres especiales.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Categoría</label>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {(['MARKETING', 'UTILITY', 'AUTHENTICATION'] as TemplateCategory[]).map(cat => {
                        const info = CATEGORY_INFO[cat];
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setTemplateForm(p => ({ ...p, category: cat }))}
                            className={`py-3 px-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${templateForm.category === cat ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                          >
                            {info.icon} {cat === 'AUTHENTICATION' ? 'Auth' : cat === 'UTILITY' ? 'Utilidad' : 'Marketing'}
                          </button>
                        );
                      })}
                    </div>
                    {/* Info alert for selected category */}
                    {(() => {
                      const info = CATEGORY_INFO[templateForm.category];
                      const colorMap: Record<string, string> = {
                        amber: 'bg-amber-50 border-amber-200 text-amber-800',
                        blue: 'bg-blue-50 border-blue-200 text-blue-800',
                        purple: 'bg-purple-50 border-purple-200 text-purple-800',
                      };
                      const exColorMap: Record<string, string> = {
                        amber: 'bg-amber-100/60 text-amber-700',
                        blue: 'bg-blue-100/60 text-blue-700',
                        purple: 'bg-purple-100/60 text-purple-700',
                      };
                      return (
                        <div className={`rounded-xl border px-4 py-3 space-y-1.5 ${colorMap[info.color]}`}>
                          <p className="text-xs font-black">{info.icon} {templateForm.category === 'AUTHENTICATION' ? 'Autenticación' : templateForm.category === 'UTILITY' ? 'Utilidad' : 'Marketing'}</p>
                          <p className="text-xs font-medium leading-relaxed">{info.desc}</p>
                          <div className={`rounded-lg px-3 py-2 mt-1 ${exColorMap[info.color]}`}>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-0.5">Ejemplo:</p>
                            <p className="text-xs italic leading-relaxed">"{info.example}"</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Idioma</label>
                    <select
                      value={templateForm.language}
                      onChange={e => setTemplateForm(p => ({ ...p, language: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                    >
                      <option value="es">Español</option>
                      <option value="en">Inglés</option>
                      <option value="pt_BR">Portugués (Brasil)</option>
                    </select>
                  </div>
                </>}

                {templateStep === 'message' && <>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Encabezado <span className="normal-case font-normal text-gray-400">(opcional)</span></label>
                    <input
                      type="text"
                      value={templateForm.headerText}
                      onChange={e => setTemplateForm(p => ({ ...p, headerText: e.target.value }))}
                      placeholder="Título del mensaje"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                  </div>

                  {/* Body with variable system */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-black text-gray-700">Cuerpo del Mensaje</label>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">Ingresa el texto para tu mensaje. Recuerda respetar el idioma seleccionado.</p>
                    <div className="relative border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-400">
                      <textarea
                        value={templateForm.body}
                        onChange={e => setTemplateForm(p => ({ ...p, body: e.target.value }))}
                        placeholder="Hola {{1}}, tenemos una oferta especial para ti hoy..."
                        rows={5}
                        maxLength={1024}
                        className="w-full px-4 pt-3 pb-8 text-sm outline-none resize-none rounded-xl"
                      />
                      <div className="absolute bottom-2 right-3 text-[10px] text-gray-400 font-mono">
                        {templateForm.body.length} / 1024
                      </div>
                    </div>

                    {/* Add variable button */}
                    <button
                      type="button"
                      onClick={addVariable}
                      className="mt-2 flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-black text-gray-600 hover:bg-gray-50 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Agregar variable
                    </button>

                    {/* Variable chips */}
                    {bodyVariables(templateForm.body).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {bodyVariables(templateForm.body).map(n => (
                          <span key={n} className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs font-black text-blue-700">
                            {`{{${n}}}`}
                            <button
                              type="button"
                              onClick={() => removeVariable(n)}
                              className="text-blue-400 hover:text-red-500 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Sample values */}
                    {bodyVariables(templateForm.body).length > 0 && (
                      <div className="mt-4 space-y-3">
                        <p className="text-xs font-black text-gray-700">Definir valor de muestra para las variables</p>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">💡</span>
                          <p className="text-xs text-amber-700 leading-relaxed">Los valores de muestra son ejemplos que ayudan a WhatsApp a poder evaluar tu plantilla y aprobarla rápidamente.</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Variables del Cuerpo</p>
                          {bodyVariables(templateForm.body).map(n => (
                            <div key={n} className="flex items-center gap-2">
                              <span className="shrink-0 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-black text-blue-700 font-mono">{`{{${n}}}`}</span>
                              <input
                                type="text"
                                placeholder="Ingresa el valor de muestra"
                                value={templateForm.variableSamples[n]?.value || ''}
                                onChange={e => setTemplateForm(p => ({
                                  ...p,
                                  variableSamples: { ...p.variableSamples, [n]: { ...p.variableSamples[n], value: e.target.value, type: p.variableSamples[n]?.type || '' } },
                                }))}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-400 outline-none"
                              />
                              <select
                                value={templateForm.variableSamples[n]?.type || ''}
                                onChange={e => setTemplateForm(p => ({
                                  ...p,
                                  variableSamples: { ...p.variableSamples, [n]: { ...p.variableSamples[n], type: e.target.value, value: p.variableSamples[n]?.value || '' } },
                                }))}
                                className="shrink-0 px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-400 outline-none bg-white"
                              >
                                <option value="">Seleccionar tipo</option>
                                {VARIABLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Mensaje Inferior <span className="normal-case font-normal text-gray-400">(opcional)</span></label>
                    <input
                      type="text"
                      value={templateForm.footer}
                      onChange={e => setTemplateForm(p => ({ ...p, footer: e.target.value }))}
                      placeholder="Ej: Para no recibir más mensajes, escribe STOP"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                  </div>
                </>}

                {templateStep === 'buttons' && (
                  <div className="space-y-6">
                    {/* Quick Replies */}
                    <div>
                      <div className="mb-3">
                        <p className="text-sm font-black text-gray-700">Respuesta Rápida</p>
                        <p className="text-xs text-gray-400 mt-0.5">Puedes elegir hasta 3 respuestas rápidas y 2 CTAs.</p>
                      </div>
                      {templateForm.quickReplies.map((qr, i) => (
                        <div key={i} className="flex items-start gap-2 mb-3">
                          <div className="flex-1 space-y-1">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Título de Respuesta Rápida</label>
                            <input
                              type="text"
                              value={qr.text}
                              maxLength={25}
                              onChange={e => {
                                const u = [...templateForm.quickReplies];
                                u[i] = { text: e.target.value };
                                setTemplateForm(p => ({ ...p, quickReplies: u }));
                              }}
                              placeholder="Ej: Ver menú"
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                            />
                            <p className="text-[10px] text-gray-400">Max. 25 caracteres — No admite emojis.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setTemplateForm(p => ({ ...p, quickReplies: p.quickReplies.filter((_, idx) => idx !== i) }))}
                            className="mt-7 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                      {templateForm.quickReplies.length < 3 && (
                        <button
                          type="button"
                          onClick={() => setTemplateForm(p => ({ ...p, quickReplies: [...p.quickReplies, { text: '' }] }))}
                          className="text-blue-600 text-xs font-black hover:text-blue-800 transition-colors"
                        >
                          + Respuesta Rápida
                        </button>
                      )}
                    </div>

                    {/* CTA Buttons */}
                    <div>
                      <p className="text-sm font-black text-gray-700 mb-3">Llamada a la Acción</p>
                      {templateForm.ctaButtons.map((cta, i) => (
                        <div key={i} className="flex items-start gap-2 mb-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={cta.text}
                              onChange={e => { const u = [...templateForm.ctaButtons]; u[i] = { ...u[i], text: e.target.value }; setTemplateForm(p => ({ ...p, ctaButtons: u })); }}
                              placeholder="Texto del botón"
                              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                            />
                            <div className="flex gap-2">
                              <select
                                value={cta.type}
                                onChange={e => { const u = [...templateForm.ctaButtons]; u[i] = { ...u[i], type: e.target.value as 'URL' | 'PHONE' }; setTemplateForm(p => ({ ...p, ctaButtons: u })); }}
                                className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-400 outline-none bg-white"
                              >
                                <option value="URL">URL</option>
                                <option value="PHONE">Teléfono</option>
                              </select>
                              <input
                                type="text"
                                value={cta.value}
                                onChange={e => { const u = [...templateForm.ctaButtons]; u[i] = { ...u[i], value: e.target.value }; setTemplateForm(p => ({ ...p, ctaButtons: u })); }}
                                placeholder={cta.type === 'URL' ? 'https://...' : '+51 9...'}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                              />
                            </div>
                          </div>
                          <button type="button" onClick={() => setTemplateForm(p => ({ ...p, ctaButtons: p.ctaButtons.filter((_, idx) => idx !== i) }))} className="mt-1 text-gray-400 hover:text-red-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                      {templateForm.ctaButtons.length < 2 && (
                        <button
                          type="button"
                          onClick={() => setTemplateForm(p => ({ ...p, ctaButtons: [...p.ctaButtons, { text: '', type: 'URL', value: '' }] }))}
                          className="text-blue-600 text-xs font-black hover:text-blue-800 transition-colors"
                        >
                          + Agregar CTA
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Vista previa */}
              <div className="w-72 border-l border-gray-100 bg-gray-50 p-5 shrink-0 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Vista previa</p>
                  <span className="text-[10px] text-gray-400">{new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="bg-[#ECE5DD] rounded-2xl p-3 min-h-48">
                  <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-sm max-w-[92%] space-y-1.5">
                    {templateForm.headerText && (
                      <p className="font-black text-gray-900 text-sm">{templateForm.headerText}</p>
                    )}
                    {templateForm.body ? (
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {templateForm.body.replace(/\{\{(\d+)\}\}/g, (_, n) => `[Variable ${n}]`)}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-300 italic">El mensaje aparecerá aquí...</p>
                    )}
                    {templateForm.footer && (
                      <p className="text-[10px] text-gray-400 mt-1">{templateForm.footer}</p>
                    )}
                    {(templateForm.quickReplies.some(q => q.text) || templateForm.ctaButtons.some(c => c.text)) && (
                      <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
                        {templateForm.quickReplies.filter(q => q.text).map((q, i) => (
                          <div key={i} className="text-center text-blue-600 text-xs font-bold py-1 border-t border-gray-100 first:border-t-0">→ {q.text}</div>
                        ))}
                        {templateForm.ctaButtons.filter(c => c.text).map((c, i) => (
                          <div key={i} className="text-center text-blue-600 text-xs font-bold py-1 border-t border-gray-100">→ {c.text}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  {(templateForm.body || templateForm.headerText) && (
                    <div className="flex justify-end mt-1">
                      <span className="text-[9px] text-gray-400 bg-yellow-50 px-2 py-0.5 rounded-full font-bold">Plantilla de mensaje ●●</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-7 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex gap-1.5">
                {TEMPLATE_STEPS.map(step => (
                  <button key={step} onClick={() => setTemplateStep(step)} className={`w-2 h-2 rounded-full transition-all ${templateStep === step ? 'bg-blue-600' : 'bg-gray-200 hover:bg-gray-300'}`} />
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowTemplateModal(false); setTemplateForm(EMPTY_TEMPLATE); setTemplateStep('info'); }}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-black text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                {templateStep !== 'buttons' ? (
                  <button
                    onClick={() => setTemplateStep(TEMPLATE_STEPS[TEMPLATE_STEPS.indexOf(templateStep) + 1])}
                    className="px-5 py-2.5 bg-[#1E73BE] text-white rounded-xl text-sm font-black hover:opacity-90 transition-all"
                  >
                    Siguiente →
                  </button>
                ) : (
                  <button
                    onClick={handleCreateTemplate}
                    disabled={creatingTemplate}
                    className="px-5 py-2.5 bg-[#1E73BE] text-white rounded-xl text-sm font-black hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {creatingTemplate ? 'Guardando...' : 'Guardar Plantilla'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
