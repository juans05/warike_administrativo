'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { businessApi } from '../lib/api-client';

type Settings = { alerts: boolean; googleConnected: boolean };

// Avisa por correo de las reseñas bajas. Las respuestas las aprueba el dueño en la lista de reseñas.
export default function ReviewAutomation({ placeId }: { placeId: string }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

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

  const row = 'flex items-start gap-3 rounded-3xl bg-background border border-border p-5';

  return (
    <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-border space-y-5">
      <div>
        <h3 className="text-lg font-black text-text font-warike">Alertas de reseñas</h3>
        <p className="text-xs font-bold text-text-muted">Ninguna respuesta se publica sin tu visto bueno: la IA sugiere y tú decides.</p>
      </div>

      <label className={row}>
        <input type="checkbox" className="mt-1 h-5 w-5 accent-primary" checked={settings.alerts} disabled={saving} onChange={(e) => update(e.target.checked)} />
        <span>
          <span className="block text-sm font-black text-text">Avisarme de reseñas de 1 a 3 estrellas</span>
          <span className="block text-xs font-bold text-text-muted">Te llega un correo apenas un cliente deja una opinión baja por tu QR/NFC{settings.googleConnected ? ' o en Google' : ''}.</span>
          {!settings.googleConnected && <span className="block text-xs font-bold text-text-muted">Conecta Google Business para recibir también las reseñas públicas de Google.</span>}
        </span>
      </label>
    </section>
  );
}
