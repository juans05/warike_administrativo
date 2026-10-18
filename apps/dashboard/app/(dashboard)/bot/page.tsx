'use client';

import React, { useEffect, useState } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi } from '../../../lib/api-client';
import Link from 'next/link';
import { Bot, MessageSquare } from 'lucide-react';
import { Button, Card, Input, PageHeader, Skeleton, Switch, Textarea, buttonStyles } from '../../../components/ui';
import { toast } from 'sonner';
import { plural } from '../../../lib/modules';

export default function BotSettingsPage() {
  const { activePlaceId, activePlace } = useRestaurant();
  const customers = plural(activePlace?.verticalConfig?.labels.customer ?? 'Cliente').toLowerCase();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    isActive: true,
    botName: 'Wuarike Assistant',
    personality: 'Amigable y servicial',
    instructions: 'Eres un asistente experto en el restaurante. Ayuda a los clientes con el menú y reservas.',
    welcomeMessage: '¡Hola! Soy tu asistente de Wuarike. ¿En qué puedo ayudarte hoy?'
  });
  // Lo último guardado (o cargado): el botón Guardar aparece solo cuando hay cambios.
  const [savedSettings, setSavedSettings] = useState<typeof settings | null>(null);

  useEffect(() => {
    if (!activePlaceId) { setIsLoading(false); return; }
    setIsLoading(true);
    businessApi.getBotSettings(activePlaceId)
      .then(data => {
        if (data) setSettings(data);
        setSavedSettings(data || settings);
      })
      .catch(err => { console.error('Error fetching bot settings:', err); setSavedSettings(settings); })
      .finally(() => setIsLoading(false));
  }, [activePlaceId]);

  const handleSave = async () => {
    if (!activePlaceId) return;
    setIsSaving(true);
    try {
      await businessApi.updateBotSettings(activePlaceId, settings);
      setSavedSettings(settings);
      toast.success('Configuración del bot actualizada correctamente');
    } catch (err) {
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const isDirty = savedSettings !== null && JSON.stringify(settings) !== JSON.stringify(savedSettings);

  if (isLoading) {
    return (
      <div className="space-y-6" role="status" aria-label="Cargando">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración del bot" subtitle={`Personaliza la inteligencia artificial que atiende a tus ${customers}.`} />

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(280px,360px)] lg:items-start">
        <div className="space-y-6">
          <Card padding="lg">
            <h2 className="text-base font-semibold text-text">Estado del asistente</h2>
            <p className="mt-1 text-sm text-text-muted">Activa o desactiva la atención automática.</p>
            <div className="mt-3">
              <Switch
                label={settings.isActive ? 'Atención automática activa' : 'Atención automática apagada'}
                checked={settings.isActive}
                onChange={(isActive) => setSettings({ ...settings, isActive })}
              />
            </div>
          </Card>

          <Card padding="lg" className="space-y-4">
            <h2 className="text-base font-semibold text-text">Datos e instrucciones</h2>
            <Input
              label="Nombre del bot"
              value={settings.botName}
              onChange={(e) => setSettings({ ...settings, botName: e.target.value })}
            />
            <Textarea
              label="Instrucciones"
              value={settings.instructions}
              onChange={(e) => setSettings({ ...settings, instructions: e.target.value })}
              placeholder="Ej: Eres un experto en cocina peruana..."
              hint={'Describe la "personalidad" del bot (ej: tradicional, moderno, gracioso) para que conecte mejor con tu marca.'}
              rows={6}
            />
          </Card>

          <Card padding="lg">
            <Input
              label="Mensaje de bienvenida"
              value={settings.welcomeMessage}
              onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
            />
          </Card>

          {isDirty && (
            <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface p-3 shadow-modal">
              <p className="text-sm text-text-muted">Tienes cambios sin guardar.</p>
              <Button onClick={handleSave} loading={isSaving}>{isSaving ? 'Guardando...' : 'Guardar'}</Button>
            </div>
          )}
        </div>

        <Card padding="lg" className="space-y-4 lg:sticky lg:top-6">
          <div>
            <h2 className="text-base font-semibold text-text">Probar bot</h2>
            <p className="mt-1 text-sm text-text-muted">Así se ve una respuesta. Para conversar con tu bot de verdad, usa Mi bot.</p>
          </div>
          <div className="space-y-3 rounded-card bg-background p-4" aria-label="Ejemplo de conversación">
            <div className="flex justify-end">
              <p className="max-w-[80%] rounded-card bg-primary px-3 py-2 text-sm text-white">¿Tienen opciones vegetarianas?</p>
            </div>
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-card border border-primary/20 bg-primary-soft px-3 py-2 text-sm text-text">
                <span className="mb-0.5 flex items-center gap-1 text-xs font-medium text-text-muted"><Bot size={16} aria-hidden /> {settings.botName || 'Bot'}</span>
                ¡Claro! Contamos con un Tacu Tacu de Vegetales increíble y ensalada de quinua orgánica.
              </div>
            </div>
          </div>
          <Link href="/plazbot" className={buttonStyles('secondary', 'md', 'w-full')}>
            <MessageSquare size={20} aria-hidden /> Probar en Mi bot
          </Link>
        </Card>
      </div>
    </div>
  );
}
