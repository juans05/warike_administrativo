'use client';

import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { metaAdsApi, type AdsInsights, type AdsPreset } from '../../lib/api-client';
import { Card, Skeleton } from '../ui';

const PRESETS: { value: AdsPreset; label: string }[] = [
  { value: 'last_7d', label: 'Últimos 7 días' },
  { value: 'last_30d', label: 'Últimos 30 días' },
  { value: 'this_month', label: 'Este mes' },
  { value: 'last_month', label: 'Mes pasado' },
];

/** Gasto en anuncios de Meta del local: lo lee de la API de Insights con el token ya conectado. */
export function AdsSpendCard({ placeId }: { placeId: string }) {
  const [preset, setPreset] = useState<AdsPreset>('this_month');
  const [data, setData] = useState<AdsInsights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    metaAdsApi.insights(placeId, preset).then(setData).catch((e: Error) => setError(e.message));
  }, [placeId, preset]);

  const cur = data?.currency === 'PEN' ? 'S/' : data?.currency ?? '';
  const money = (v: number | null) => (v == null ? '—' : `${cur} ${v.toFixed(2)}`);
  const maxDay = Math.max(0, ...(data?.daily.map((d) => d.spend) ?? []));

  return (
    <Card padding="lg" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-text"><BarChart3 size={22} className="text-primary" aria-hidden /> Gasto en anuncios</h2>
        <select aria-label="Periodo" value={preset} onChange={(e) => setPreset(e.target.value as AdsPreset)}
          className="min-h-9 rounded-control border border-border bg-surface px-2 text-sm text-text">
          {PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {error ? (
        <p className="rounded-control border border-secondary/40 bg-secondary/10 px-4 py-3 text-sm text-text">{error}</p>
      ) : !data ? <Skeleton className="h-48" /> : (
        <>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Gastado', money(data.totals.spend)],
              ['Personas alcanzadas', data.totals.reach.toLocaleString('es-PE')],
              ['Conversaciones', data.totals.messages.toLocaleString('es-PE')],
              ['Costo por conversación', money(data.totals.costPerMessage)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-control bg-background p-3">
                <dt className="text-xs text-text-muted">{label}</dt>
                <dd className="text-lg font-semibold tabular-nums text-text">{value}</dd>
              </div>
            ))}
          </dl>

          {data.spendCap && (
            <div className="space-y-1">
              <p className="flex flex-wrap justify-between gap-2 text-sm">
                <span className="text-text">Límite de gasto de la cuenta</span>
                <span className="tabular-nums text-text-muted">{money(data.spendCap.spent)} de {money(data.spendCap.cap)}</span>
              </p>
              <div className="h-2 rounded-full bg-background" role="progressbar" aria-valuenow={data.spendCap.spent} aria-valuemin={0} aria-valuemax={data.spendCap.cap} aria-label="Límite de gasto usado">
                <div className={`h-2 rounded-full ${data.spendCap.spent >= data.spendCap.cap * 0.9 ? 'bg-danger' : 'bg-primary'}`} style={{ width: `${Math.min(100, (data.spendCap.spent / data.spendCap.cap) * 100)}%` }} />
              </div>
            </div>
          )}

          {data.daily.length > 0 && maxDay > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-text">Gasto por día</p>
              <div className="flex h-28 items-end gap-0.5" role="img" aria-label={`Gasto diario, máximo ${money(maxDay)}`}>
                {data.daily.map((d) => (
                  <div key={d.date} title={`${new Date(`${d.date}T12:00:00Z`).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}: ${money(d.spend)}`}
                    className="flex-1 rounded-t bg-primary/80 hover:bg-primary" style={{ height: `${Math.max(2, (d.spend / maxDay) * 100)}%` }} />
                ))}
              </div>
            </div>
          )}

          {data.campaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead><tr className="text-left text-xs text-text-muted">
                  <th className="py-1 font-medium">Campaña</th><th className="py-1 text-right font-medium">Gasto</th><th className="py-1 text-right font-medium">Alcance</th>
                  <th className="py-1 text-right font-medium">Clics</th><th className="py-1 text-right font-medium">CTR</th><th className="py-1 text-right font-medium">Conversaciones</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {data.campaigns.map((c) => (
                    <tr key={c.name}>
                      <td className="py-2 text-text">{c.name}</td>
                      <td className="py-2 text-right tabular-nums text-text">{money(c.spend)}</td>
                      <td className="py-2 text-right tabular-nums text-text-muted">{c.reach.toLocaleString('es-PE')}</td>
                      <td className="py-2 text-right tabular-nums text-text-muted">{c.clicks.toLocaleString('es-PE')}</td>
                      <td className="py-2 text-right tabular-nums text-text-muted">{c.ctr == null ? '—' : `${c.ctr}%`}</td>
                      <td className="py-2 text-right tabular-nums text-text">{c.messages}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-sm text-text-muted">No hubo campañas con gasto en este periodo.</p>}

          <p className="rounded-control bg-background px-3 py-2 text-xs text-text-muted">
            Este gasto lo cobra Meta a la tarjeta de tu cuenta publicitaria. Cuando un cliente te escribe desde un anuncio de clic a WhatsApp, los mensajes de los siguientes 7 días son gratis.
          </p>
        </>
      )}
    </Card>
  );
}
