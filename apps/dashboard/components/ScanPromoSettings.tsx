'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { businessApi } from '../lib/api-client';

// El dueño decide si, al calificar, se invita al cliente a dejar su WhatsApp para recibir promociones, y con qué mensaje.
export default function ScanPromoSettings({ placeId }: { placeId: string }) {
  const [enabled, setEnabled] = useState(false);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    businessApi.getScanPromo(placeId)
      .then((promo: { enabled: boolean; text: string }) => { setEnabled(!!promo?.enabled); setText(promo?.text || ''); })
      .catch(() => { /* sin configuración: queda apagado */ });
  }, [placeId]);

  const save = async () => {
    setSaving(true);
    try {
      await businessApi.setScanPromo(placeId, { enabled, text });
      toast.success('Promoción guardada');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-border space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-2xl">🎁</div>
        <div>
          <h3 className="text-xl font-black text-text font-warike">Promociones por WhatsApp</h3>
          <p className="text-xs font-bold text-text-muted">Al calificar, invita al cliente a dejar su número para recibir promociones.</p>
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-5 h-5 accent-primary" />
        <span className="text-sm font-black text-text">Pedir WhatsApp para enviar promociones</span>
      </label>

      <div className={enabled ? 'space-y-2' : 'space-y-2 opacity-50'}>
        <label className="flex items-center justify-between text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
          Mensaje que verá el cliente
          <span className="font-bold normal-case tracking-normal">{text.length}/160</span>
        </label>
        <input
          type="text"
          value={text}
          maxLength={160}
          disabled={!enabled}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ej: Deja tu WhatsApp y llévate una bebida gratis en tu próxima visita"
          className="input-premium w-full"
        />
        <p className="text-[11px] font-bold text-text-muted">Si tienes fidelización activa, el cliente también suma su primer sello al dejar el número.</p>
      </div>

      <button onClick={save} disabled={saving} className="bg-text text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all disabled:opacity-50">
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
    </section>
  );
}
