'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { businessApi } from '../../lib/api-client';
import type { MetaTemplate } from '../../hooks/useBroadcasts';
import { Plus, RefreshCw, Send, X } from 'lucide-react';
import { Badge, Button, Card, Input, Select, Textarea } from '../ui';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  APPROVED: 'success',
  PENDING: 'warning',
  REJECTED: 'danger',
  PAUSED: 'neutral',
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

  return (
    <Card padding="lg" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-text">Plantillas de WhatsApp (Meta)</h2>
          <p className="mt-0.5 text-sm text-text-muted">Las de tu cuenta de WhatsApp Business. Solo las aprobadas sirven para campañas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onChanged}>Actualizar</Button>
          <Button variant="secondary" size="sm" icon={open ? X : Plus} onClick={() => setOpen((v) => !v)}>
            {open ? 'Cancelar' : 'Nueva plantilla'}
          </Button>
        </div>
      </div>

      {open && (
        <form onSubmit={submit} className="space-y-3 rounded-card border border-border bg-background p-4">
          <Input label="Nombre" hint="Minúsculas y _, ej. promo_fin_de_semana" required value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))} />
          <Select label="Categoría" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
            <option value="MARKETING">Marketing (promociones)</option>
            <option value="UTILITY">Utilidad (confirmaciones, avisos)</option>
          </Select>
          <Textarea label="Texto" required rows={4} maxLength={1024}
            hint="Usa {{1}}, {{2}}… para datos que cambian."
            placeholder="Ej: Hola {{1}}, hoy 2x1 en {{2}}. ¡Te esperamos!"
            value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} />
          {Array.from({ length: varCount }).map((_, i) => (
            <Input key={i} label={`Ejemplo para {{${i + 1}}}`} hint="Meta lo pide para aprobarla." required
              value={examples[i] ?? ''} onChange={(e) => setExamples((p) => { const n = [...p]; n[i] = e.target.value; return n; })} />
          ))}
          <Input label="Pie (opcional)" maxLength={60} value={form.footer} onChange={(e) => setForm((p) => ({ ...p, footer: e.target.value }))} />
          <Button type="submit" icon={Send} loading={saving} className="w-full">
            {saving ? 'Enviando a Meta…' : 'Enviar a aprobación'}
          </Button>
        </form>
      )}

      {templates.length === 0 ? (
        <p className="text-sm text-text-muted">Todavía no hay plantillas en tu cuenta de WhatsApp.</p>
      ) : (
        <ul className="divide-y divide-border rounded-card border border-border">
          {templates.map((t) => (
            <li key={t.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-text">{t.name}</span>
                <Badge tone={STATUS_TONE[t.status] ?? 'neutral'}>{STATUS_LABEL[t.status] ?? t.status}</Badge>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-text-muted">{t.body}</p>
              <p className="mt-1 text-xs text-text-muted">{t.category} · {t.language}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
