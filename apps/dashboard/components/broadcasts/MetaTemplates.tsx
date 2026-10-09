'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { businessApi } from '../../lib/api-client';
import type { MetaTemplate } from '../../hooks/useBroadcasts';

const STATUS_STYLE: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  REJECTED: 'bg-red-100 text-red-700',
  PAUSED: 'bg-gray-200 text-gray-600',
};
const STATUS_LABEL: Record<string, string> = { APPROVED: 'Aprobada', PENDING: 'En revisión', REJECTED: 'Rechazada', PAUSED: 'Pausada' };

// Plantillas de la cuenta de WhatsApp del local (API de Meta). Para escribir a clientes fuera de las 24 h
// solo sirven las APROBADAS; Meta suele revisarlas en minutos u horas.
export function MetaTemplates({ placeId, templates, onChanged }: { placeId: string; templates: MetaTemplate[]; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'MARKETING', body: '', footer: '' });
  const [examples, setExamples] = useState<string[]>([]);

  const varCount = (() => {
    const nums = (form.body.match(/\{\{\d+\}\}/g) ?? []).map((m) => Number(m.replace(/\D/g, '')));
    return nums.length ? Math.max(...nums) : 0;
  })();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await businessApi.createMetaTemplate({
        placeId, name: form.name, language: 'es', category: form.category as 'MARKETING' | 'UTILITY',
        body: form.body, footer: form.footer || undefined, bodyExamples: examples.slice(0, varCount),
      });
      toast.success('Plantilla enviada a Meta. Aparecerá como "En revisión" hasta que la aprueben.');
      setOpen(false);
      setForm({ name: '', category: 'MARKETING', body: '', footer: '' });
      setExamples([]);
      onChanged();
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo crear la plantilla');
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-400';

  return (
    <div className="bg-white border border-blue-100 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest">Plantillas de WhatsApp (Meta)</h2>
          <p className="text-xs text-gray-400 mt-0.5">Las de tu cuenta de WhatsApp Business. Solo las aprobadas sirven para campañas.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onChanged} className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-black text-gray-600 hover:bg-gray-50">Actualizar</button>
          <button onClick={() => setOpen((v) => !v)} className="px-4 py-2 rounded-xl bg-[#F26122] text-white text-xs font-black hover:opacity-90">
            {open ? 'Cancelar' : '+ Nueva plantilla'}
          </button>
        </div>
      </div>

      {open && (
        <form onSubmit={submit} className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
          <input className={input} required placeholder="Nombre (minúsculas y _), ej. promo_fin_de_semana" value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))} />
          <select className={input} value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
            <option value="MARKETING">Marketing (promociones)</option>
            <option value="UTILITY">Utilidad (confirmaciones, avisos)</option>
          </select>
          <textarea className={input} required rows={4} maxLength={1024} placeholder="Texto. Usa {{1}}, {{2}}… para datos que cambian. Ej: Hola {{1}}, hoy 2x1 en {{2}}. ¡Te esperamos!"
            value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} />
          {Array.from({ length: varCount }).map((_, i) => (
            <input key={i} className={input} required placeholder={`Ejemplo para {{${i + 1}}} (Meta lo pide para aprobarla)`}
              value={examples[i] ?? ''} onChange={(e) => setExamples((p) => { const n = [...p]; n[i] = e.target.value; return n; })} />
          ))}
          <input className={input} maxLength={60} placeholder="Pie (opcional)" value={form.footer} onChange={(e) => setForm((p) => ({ ...p, footer: e.target.value }))} />
          <button disabled={saving} className="w-full py-3 bg-[#F26122] text-white rounded-xl text-sm font-black hover:opacity-90 disabled:opacity-50">
            {saving ? 'Enviando a Meta…' : 'Enviar a aprobación'}
          </button>
        </form>
      )}

      {templates.length === 0 ? (
        <p className="text-sm text-gray-400">Todavía no hay plantillas en tu cuenta de WhatsApp.</p>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div key={t.id} className="border border-gray-100 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-black text-gray-900">{t.name}</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${STATUS_STYLE[t.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABEL[t.status] ?? t.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.body}</p>
              <p className="text-[10px] text-gray-400 font-mono mt-1">{t.category} · {t.language}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
