'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { whatsappCostsApi, type PlatformConsumption, type WhatsAppRate } from '../../../../lib/api-client';
import { can, usePlatformPermissions } from '../../../../lib/platform';
import { Badge, Button, Card, Input, PageHeader, Select, Skeleton } from '../../../../components/ui';

const thisMonth = () => new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 7);
const money = (v: number | null, currency?: string | null) => (v == null ? '—' : `${currency === 'USD' ? 'US$' : 'S/'} ${v.toFixed(2)}`);
const EMPTY_RATE: WhatsAppRate = { market: 'PE', category: 'utility', currency: 'PEN', rate: 0, validFrom: new Date().toISOString().slice(0, 10) };

/** Consumo de WhatsApp de todos los locales (lo paga cada local a Meta) y tarifas usadas para el estimado. */
export default function ConsumoWhatsAppPage() {
  const perms = usePlatformPermissions(true);
  const [month, setMonth] = useState(thisMonth());
  const [summary, setSummary] = useState<PlatformConsumption | null>(null);
  const [rates, setRates] = useState<WhatsAppRate[]>([]);
  const [draft, setDraft] = useState<WhatsAppRate>(EMPTY_RATE);
  const [saving, setSaving] = useState(false);
  const canEditRates = can(perms, 'plataforma.config');

  const load = useCallback(() => {
    setSummary(null);
    whatsappCostsApi.platform(month).then(setSummary).catch((e: Error) => toast.error(e.message));
  }, [month]);
  useEffect(load, [load]);
  useEffect(() => { whatsappCostsApi.rates().then(setRates).catch(() => setRates([])); }, []);

  const saveRate = async () => {
    setSaving(true);
    try { setRates(await whatsappCostsApi.saveRate({ ...draft, rate: Number(draft.rate) })); toast.success('Tarifa guardada'); }
    catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const blocked = summary?.places.filter((p) => p.billing === 'SIN_PAGO').length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consumo de WhatsApp"
        subtitle="Lo que Meta le cobra a cada local por mensajes. Cada local paga con su propio método de pago."
        action={<input type="month" aria-label="Mes" value={month} max={thisMonth()} onChange={(e) => e.target.value && setMonth(e.target.value)}
          className="min-h-11 rounded-control border border-border bg-surface px-3 text-sm text-text" />}
      />

      {!summary ? <Skeleton className="h-64" /> : (
        <>
          {(summary.paidByWuarikes.estimated > 0 || summary.paidByWuarikes.official) && (
            <p className="flex items-start gap-2 rounded-control border border-secondary/40 bg-secondary/10 px-4 py-3 text-sm text-text">
              <AlertTriangle size={20} className="shrink-0 text-text-muted" aria-hidden />
              Hay locales enviando desde la cuenta de WhatsApp de Wuarikes ({summary.wuarikesWaba}): esos mensajes los paga Wuarikes.
              Estimado {money(summary.paidByWuarikes.estimated)} · oficial {money(summary.paidByWuarikes.official)}.
            </p>
          )}
          {blocked > 0 && (
            <p className="flex items-start gap-2 rounded-control border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-text">
              <AlertTriangle size={20} className="shrink-0 text-danger" aria-hidden />
              {blocked} {blocked === 1 ? 'local no tiene' : 'locales no tienen'} método de pago en Meta: sus recordatorios y avisos no se entregan.
            </p>
          )}

          <Card padding="lg">
            {summary.places.length === 0 ? <p className="text-sm text-text-muted">Ningún local tiene un número conectado con Facebook.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead><tr className="text-left text-xs text-text-muted">
                    <th className="py-2 font-medium">Local</th><th className="py-2 font-medium">Pago</th>
                    <th className="py-2 text-right font-medium">Marketing</th><th className="py-2 text-right font-medium">Utilidad</th>
                    <th className="py-2 text-right font-medium">Respuestas gratis</th><th className="py-2 text-right font-medium">Estimado</th><th className="py-2 text-right font-medium">Oficial</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border">
                    {summary.places.map((p) => (
                      <tr key={`${p.placeId}-${p.wabaId}`}>
                        <td className="py-2 text-text">{p.placeName}{p.paidByWuarikes && <span className="block text-xs text-text-muted">Cuenta de Wuarikes</span>}</td>
                        <td className="py-2"><Badge tone={p.billing === 'SIN_PAGO' ? 'danger' : 'success'}>{p.billing === 'SIN_PAGO' ? 'Sin método de pago' : 'OK'}</Badge></td>
                        <td className="py-2 text-right tabular-nums">{p.billable.marketing}</td>
                        <td className="py-2 text-right tabular-nums">{p.billable.utility}</td>
                        <td className={`py-2 text-right tabular-nums ${p.serviceUsed >= 800 ? 'font-semibold text-danger' : 'text-text-muted'}`}>{p.serviceUsed} / {p.serviceLimit}</td>
                        <td className="py-2 text-right tabular-nums">{money(p.estimated, p.currency)}</td>
                        <td className="py-2 text-right tabular-nums">{money(p.official, p.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      <Card padding="lg" className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-text">Tarifas de Meta</h2>
          <p className="text-sm text-text-muted">Precio por mensaje entregado según el mercado del destinatario. Se usan para el estimado; la cifra oficial viene de Meta.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead><tr className="text-left text-xs text-text-muted"><th className="py-1 font-medium">Mercado</th><th className="py-1 font-medium">Categoría</th><th className="py-1 text-right font-medium">Tarifa</th><th className="py-1 font-medium">Desde</th></tr></thead>
            <tbody className="divide-y divide-border">
              {rates.map((r) => (
                <tr key={`${r.market}-${r.category}-${r.currency}-${r.validFrom}`}>
                  <td className="py-2">{r.market}</td><td className="py-2">{r.category}</td>
                  <td className="py-2 text-right tabular-nums">{r.currency} {r.rate.toFixed(4)}</td><td className="py-2 tabular-nums">{r.validFrom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {canEditRates && (
          <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-6 sm:items-end">
            <Input label="Mercado" value={draft.market} onChange={(e) => setDraft({ ...draft, market: e.target.value.toUpperCase() })} />
            <Select label="Categoría" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as WhatsAppRate['category'] })}>
              <option value="marketing">marketing</option><option value="utility">utility</option><option value="authentication">authentication</option><option value="service">service</option>
            </Select>
            <Input label="Moneda" value={draft.currency} maxLength={3} onChange={(e) => setDraft({ ...draft, currency: e.target.value.toUpperCase() })} />
            <Input label="Tarifa" type="number" step="0.0001" min={0} value={draft.rate} onChange={(e) => setDraft({ ...draft, rate: e.target.value as unknown as number })} />
            <Input label="Vigente desde" type="date" value={draft.validFrom} onChange={(e) => setDraft({ ...draft, validFrom: e.target.value })} />
            <Button onClick={saveRate} loading={saving}>Guardar</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
