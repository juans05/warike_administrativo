'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { plazbotApi, businessApi } from '../../../lib/api-client';
import { useRestaurant } from '../../../context/RestaurantContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { Lock, Sparkles } from 'lucide-react';
import { Button, Card, EmptyState, Input, PageHeader, Select, Skeleton, Textarea, buttonStyles } from '../../../components/ui';
import { BotTester } from '../../../components/bot/BotTester';
import { MenuOptionsEditor, type MenuActionType, type MenuOptionForm } from '../../../components/bot/MenuOptionsEditor';
import { plural } from '../../../lib/modules';
import { PlazbotCampaignsCard, PlazbotMetricsCard, type PlazbotMetrics, type PlazbotTemplate } from '../../../components/bot/PlazbotWorkspace';

type Tone = 'professional' | 'casual' | 'friendly';

const TONE_LABELS: Record<Tone, string> = {
  professional: 'Profesional',
  casual: 'Casual',
  friendly: 'Amistoso',
};

type ResponseMode = 'ai' | 'menu';

export default function PlazbotSetupPage() {
  const { activePlaceId, activePlace } = useRestaurant();
  const customerLabel = activePlace?.verticalConfig?.labels.customer ?? 'Cliente';
  const catalogLabel = activePlace?.verticalConfig?.labels.catalog ?? 'Carta';

  const [plazbotConnected, setPlazbotConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscriptionBlocked, setSubscriptionBlocked] = useState<string | null>(null);

  // Bot config form
  const [formData, setFormData] = useState({
    botName: '',
    restaurantName: '',
    systemPrompt: '',
    tone: 'professional' as Tone,
    responseMode: 'ai' as ResponseMode,
  });
  // Lo último guardado (o cargado): el botón Guardar aparece solo cuando el formulario difiere.
  const [savedForm, setSavedForm] = useState(formData);
  const [saving, setSaving] = useState(false);
  const [generatingPrompt, setGeneratingPrompt] = useState(false);

  // Menú de botones (opciones dinámicas)
  const [menuOptions, setMenuOptions] = useState<MenuOptionForm[]>([]);
  const [savingMenu, setSavingMenu] = useState(false);
  const [uploadingOptionIndex, setUploadingOptionIndex] = useState<number | null>(null);

  // Metrics & templates
  const [metrics, setMetrics] = useState<PlazbotMetrics | null>(null);
  const [templates, setTemplates] = useState<PlazbotTemplate[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    try { setIsAdmin(JSON.parse(localStorage.getItem('user') || '{}')?.role === 'admin'); } catch { setIsAdmin(false); }
  }, []);

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

        // La configuración del bot sirve para cualquier canal (Meta o PlazBot): no depende de PlazBot.
        if (activePlaceId) {
          const config = await plazbotApi.getConfig(activePlaceId);
          const loaded = {
            botName: config?.botName || '',
            restaurantName: config?.restaurantName || '',
            systemPrompt: config?.systemPrompt || '',
            tone: (config?.tone as Tone) || 'professional',
            responseMode: (config?.responseMode as ResponseMode) || 'ai',
          };
          setFormData(loaded);
          setSavedForm(loaded);
          const menuRes = await plazbotApi.getMenuOptions(activePlaceId);
          setMenuOptions(
            (menuRes?.data || []).map((o: any) => ({
              label: o.label,
              actionType: o.actionType as MenuActionType,
              actionValue: o.actionValue || '',
            })),
          );
        }
        if (status?.connected) await loadMetricsAndTemplates();
      } catch (err: any) {
        if (err?.message?.includes('suscripción activa') || err?.message?.includes('requiere el plan')) {
          setSubscriptionBlocked(err.message);
        }
        /* otros errores: sin conexión, se ignoran */
      }
      finally { setLoading(false); }
    };
    load();
  }, [activePlaceId, loadMetricsAndTemplates]);

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

  const addMenuOption = () => setMenuOptions(prev => [...prev, { label: '', actionType: 'text', actionValue: '' }]);
  const removeMenuOption = (i: number) => setMenuOptions(prev => prev.filter((_, idx) => idx !== i));
  const updateMenuOption = (i: number, patch: Partial<MenuOptionForm>) =>
    setMenuOptions(prev => prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));

  const handleOptionFileUpload = async (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingOptionIndex(i);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('file', file);
      const endpoint = file.type.startsWith('video/') ? 'video' : 'document';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/upload/${endpoint}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error('Error al subir el archivo');
      const data = await res.json();
      updateMenuOption(i, { actionValue: data.url });
      toast.success('Archivo subido');
    } catch {
      toast.error('No se pudo subir el archivo');
    } finally {
      setUploadingOptionIndex(null);
    }
  };

  const handleSaveMenuOptions = async () => {
    if (!activePlaceId) return;
    setSavingMenu(true);
    try {
      await plazbotApi.saveMenuOptions({
        placeId: activePlaceId,
        options: menuOptions
          .filter(o => o.label.trim())
          .map(o => ({ label: o.label.trim(), actionType: o.actionType, actionValue: o.actionValue || undefined })),
      });
      toast.success('Menú guardado');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar el menú');
    } finally {
      setSavingMenu(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlaceId) return;
    setSaving(true);
    const submitted = formData;
    try {
      await plazbotApi.configure({ placeId: activePlaceId, ...submitted });
      setSavedForm(submitted);
      toast.success('Configuración guardada.');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const isDirty = JSON.stringify(formData) !== JSON.stringify(savedForm);

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-label="Cargando">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-64 rounded-card" />
        <Skeleton className="h-80 rounded-card" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Mi bot" subtitle={`Cómo atiende tu bot de WhatsApp a tus ${plural(customerLabel).toLowerCase()}.`} />

      {subscriptionBlocked && (
        <Card>
          <EmptyState
            icon={Lock}
            title="Función disponible en un plan superior"
            description={subscriptionBlocked}
            action={<Link href="/suscripcion" className={buttonStyles('primary')}>Ver planes</Link>}
          />
        </Card>
      )}

      {!subscriptionBlocked && (
        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(320px,400px)] lg:items-start">
          <form onSubmit={handleSaveConfig} className="space-y-6">
            <Card padding="lg" className="space-y-4">
              <h2 className="text-base font-semibold text-text">Datos del bot</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Nombre del negocio"
                  value={formData.restaurantName}
                  onChange={e => setFormData(p => ({ ...p, restaurantName: e.target.value }))}
                  placeholder="Ej: La Bajadita"
                />
                <Input
                  label="Nombre del bot"
                  value={formData.botName}
                  onChange={e => setFormData(p => ({ ...p, botName: e.target.value }))}
                  placeholder="Ej: Mario"
                />
              </div>
              <Select
                label="Tono de respuesta"
                value={formData.tone}
                onChange={e => setFormData(p => ({ ...p, tone: e.target.value as Tone }))}
              >
                {(Object.entries(TONE_LABELS) as [Tone, string][]).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </Card>

            <Card padding="lg" className="space-y-4">
              <h2 className="text-base font-semibold text-text">Cómo responde</h2>
              <Select
                label="Modo de respuesta"
                value={formData.responseMode}
                onChange={e => setFormData(p => ({ ...p, responseMode: e.target.value as ResponseMode }))}
                hint={formData.responseMode === 'menu'
                  ? 'El bot manda un menú de texto numerado con las opciones de abajo, en vez de responder con IA.'
                  : `El bot responde con IA usando tu ${catalogLabel.toLowerCase()} digital y las instrucciones de abajo.`}
              >
                <option value="ai">Respuestas con IA</option>
                <option value="menu">Menú de botones (sin IA)</option>
              </Select>

              {formData.responseMode === 'menu' && (
                <MenuOptionsEditor
                  options={menuOptions}
                  onAdd={addMenuOption}
                  onRemove={removeMenuOption}
                  onUpdate={updateMenuOption}
                  onFileUpload={handleOptionFileUpload}
                  uploadingIndex={uploadingOptionIndex}
                  saving={savingMenu}
                  onSave={handleSaveMenuOptions}
                />
              )}
            </Card>

            <Card padding="lg" className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-text">Instrucciones</h2>
                <Button variant="secondary" size="sm" icon={Sparkles} loading={generatingPrompt} onClick={handleSuggestPrompt}>
                  {generatingPrompt ? 'Generando...' : 'Proponer con IA'}
                </Button>
              </div>
              <Textarea
                label="Instrucciones para el bot (opcional)"
                hint="Se suman al comportamiento base del bot y tienen prioridad sobre él."
                value={formData.systemPrompt}
                onChange={e => setFormData(p => ({ ...p, systemPrompt: e.target.value }))}
                placeholder={`Ejemplos de instrucciones personalizadas:\n– Menciona siempre que tenemos delivery hasta las 10pm\n– Si preguntan por reservas, pide nombre, hora y número de personas\n– Promoción del día: anticucho a S/ 8 los lunes\n– Si el ${customerLabel.toLowerCase()} pide la cuenta, indícale que puede pagar con Yape o efectivo`}
                rows={6}
              />
            </Card>

            {isDirty && (
              <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface p-3 shadow-modal">
                <p className="text-sm text-text-muted">Tienes cambios sin guardar.</p>
                <Button type="submit" loading={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
              </div>
            )}
          </form>

          {activePlaceId && (
            <div className="lg:sticky lg:top-6">
              <BotTester placeId={activePlaceId} customerLabel={customerLabel} />
            </div>
          )}
        </div>
      )}

      {plazbotConnected && metrics && <PlazbotMetricsCard metrics={metrics} />}

      {/* Usan la cuenta global de PlazBot de Wuarikes: solo admin (el backend también lo exige). */}
      {plazbotConnected && isAdmin && <PlazbotCampaignsCard templates={templates} />}
    </div>
  );
}
