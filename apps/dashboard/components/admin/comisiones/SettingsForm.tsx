'use client';

import React, { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { toast } from 'sonner';
import { adminCommissionsApi } from '../../../lib/api-client';
import { Button, Card, Input } from '../../ui';
import type { CommissionSettings } from './types';

type FormState = { firstMonthRate: string; recurringRate: string; recurringMonths: string; clawbackDays: string };

// Las tasas se guardan como fracción (0.2) y se editan como porcentaje (20).
const toForm = (s: CommissionSettings): FormState => ({
  firstMonthRate: String(Math.round(s.firstMonthRate * 100)),
  recurringRate: String(Math.round(s.recurringRate * 100)),
  recurringMonths: String(s.recurringMonths),
  clawbackDays: String(s.clawbackDays),
});

const FIELDS: { key: keyof FormState; label: string; hint: string }[] = [
  { key: 'firstMonthRate', label: 'Comisión del primer mes (%)', hint: 'Sobre el primer pago del local.' },
  { key: 'recurringRate', label: 'Comisión mensual (%)', hint: 'Sobre cada pago siguiente.' },
  { key: 'recurringMonths', label: 'Meses con comisión mensual', hint: 'Cuántos meses se paga la comisión mensual.' },
  { key: 'clawbackDays', label: 'Descuento si cancela dentro de (días)', hint: 'Si el local cancela antes, se descuenta la comisión.' },
];

export function SettingsForm() {
  const [settings, setSettings] = useState<CommissionSettings | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminCommissionsApi.getSettings().then((s: CommissionSettings) => {
      setSettings(s);
      setForm(toForm(s));
    }).catch((e) => toast.error(e.message));
  }, []);

  const dirty = settings && form ? FIELDS.some(({ key }) => form[key] !== toForm(settings)[key]) : false;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!confirm('Los cambios aplican solo a pagos nuevos. ¿Guardar?')) return;
    setSaving(true);
    try {
      const s = await adminCommissionsApi.updateSettings({
        firstMonthRate: Number(form.firstMonthRate) / 100,
        recurringRate: Number(form.recurringRate) / 100,
        recurringMonths: Number(form.recurringMonths),
        clawbackDays: Number(form.clawbackDays),
      });
      setSettings(s);
      setForm(toForm(s));
      toast.success('Configuración guardada');
    } catch (err: any) {
      toast.error(err.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <Card padding="lg" className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-text">Reglas de comisión</h2>
          <p className="mt-0.5 text-sm text-text-muted">
            {settings?.updatedAt ? `Último cambio: ${new Date(settings.updatedAt).toLocaleString('es-PE')}` : 'Valores iniciales'}
          </p>
        </div>
        <p className="flex items-start gap-2 rounded-control border border-secondary/40 bg-secondary/10 px-3 py-2 text-sm text-text">
          <Info size={16} aria-hidden className="mt-0.5 shrink-0" />
          Los cambios aplican solo a pagos nuevos. Lo ya generado o pagado no cambia.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map(({ key, label, hint }) => (
            <Input
              key={key}
              label={label}
              hint={hint}
              required
              type="number"
              min={0}
              step={1}
              disabled={!form}
              value={form?.[key] ?? ''}
              onChange={(e) => setForm((prev) => prev && { ...prev, [key]: e.target.value })}
            />
          ))}
        </div>
      </Card>

      {dirty && (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface p-3 shadow-modal">
          <p className="text-sm text-text-muted">Tienes cambios sin guardar.</p>
          <Button type="submit" loading={saving}>Guardar</Button>
        </div>
      )}
    </form>
  );
}
