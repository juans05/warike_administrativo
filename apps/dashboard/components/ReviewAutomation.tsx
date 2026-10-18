'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { businessApi } from '../lib/api-client';
import { Card, Switch } from './ui';
import { useCustomerLabels } from '../hooks/useCustomerLabels';

type Settings = { alerts: boolean; googleConnected: boolean };

// Avisa por correo de las reseñas bajas. Las respuestas las aprueba el dueño en la lista de reseñas.
export default function ReviewAutomation({ placeId }: { placeId: string }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const { customer } = useCustomerLabels();

  useEffect(() => {
    setSettings(null);
    businessApi.getReviewAuto(placeId).then(setSettings).catch(() => { /* sin datos: no se muestra */ });
  }, [placeId]);

  if (!settings) return null;

  const update = async (alerts: boolean) => {
    setSaving(true);
    try {
      setSettings(await businessApi.setReviewAuto(placeId, { alerts }));
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card padding="lg" className="space-y-4">
      <div className="flex items-start gap-3">
        <div aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Bell size={20} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-text">Alertas de reseñas</h3>
          <p className="text-sm text-text-muted">Ninguna respuesta se publica sin tu visto bueno: la IA sugiere y tú decides.</p>
        </div>
      </div>

      <div>
        <Switch label="Avisarme de reseñas de 1 a 3 estrellas" checked={settings.alerts} disabled={saving} onChange={update} />
        <p className="text-sm text-text-muted">
          Te llega un correo apenas un {customer} deja una opinión baja por tu QR/NFC{settings.googleConnected ? ' o en Google' : ''}.
          {!settings.googleConnected && ' Conecta Google para recibir también las reseñas públicas de Google.'}
        </p>
      </div>
    </Card>
  );
}
