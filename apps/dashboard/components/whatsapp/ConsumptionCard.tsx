'use client';

import { useEffect, useState } from 'react';
import { Receipt } from 'lucide-react';
import { whatsappCostsApi, type MessageSource, type WhatsAppConsumption } from '../../lib/api-client';
import { Card, Skeleton } from '../ui';
import { BillingAlert, PaymentMethodSteps } from './BillingAlert';

const SOURCE_LABEL: Record<MessageSource, string> = {
  reminder: 'Recordatorios de cita',
  recall: 'Avisos de rutina',
  broadcast: 'Campañas',
  bot: 'Respuestas del bot',
  agent: 'Respuestas del equipo',
  ready: 'Avisos de pedido listo',
};

const limaMonth = (offset = 0) => {
  const d = new Date(Date.now() - 5 * 3600_000);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + offset);
  return d.toISOString().slice(0, 7);
};
const monthName = (m: string) => new Date(`${m}-15T12:00:00Z`).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });

/** Cuánto le cobra Meta al local por WhatsApp en el mes: cifra oficial (sincronizada a diario) y estimado en tiempo real. */
export function ConsumptionCard({ placeId }: { placeId: string }) {
  const [month, setMonth] = useState(limaMonth());
  const [data, setData] = useState<WhatsAppConsumption | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    whatsappCostsApi.consumption(placeId, month).then(setData).catch((e: Error) => setError(e.message));
  }, [placeId, month]);

  if (error) return null; // sin permiso (agentes) o sin datos: la tarjeta no aplica
  const money = (v: number | null) => (v == null ? '—' : `${data?.currency === 'USD' ? 'US$' : 'S/'} ${v.toFixed(2)}`);
  const months = [0, -1, -2].map(limaMonth);

  return (
    <Card padding="lg" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-text"><Receipt size={20} className="text-primary" aria-hidden /> Consumo de WhatsApp</h2>
        <select aria-label="Mes" value={month} onChange={(e) => setMonth(e.target.value)}
          className="min-h-9 rounded-control border border-border bg-surface px-2 text-sm capitalize text-text">
          {months.map((m) => <option key={m} value={m}>{monthName(m)}</option>)}
        </select>
      </div>

      {!data ? <Skeleton className="h-40" /> : !data.hasNumber ? (
        <p className="text-sm text-text-muted">Conecta tu número con Facebook para ver aquí lo que Meta te cobra por mes.</p>
      ) : (
        <>
          <BillingAlert placeId={placeId} billing={data.billing} />
          {data.paidByWuarikes && <p className="text-sm text-text-muted">Tu número envía desde la cuenta de Wuarikes: estos mensajes los paga Wuarikes.</p>}

          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-control bg-background p-3">
              <dt className="text-xs text-text-muted">Cobrado por Meta{data.officialUntil ? ` (hasta el ${new Date(`${data.officialUntil}T12:00:00Z`).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })})` : ''}</dt>
              <dd className="text-xl font-semibold tabular-nums text-text">{money(data.official)}</dd>
            </div>
            <div className="rounded-control bg-background p-3">
              <dt className="text-xs text-text-muted">Estimado en tiempo real</dt>
              <dd className="text-xl font-semibold tabular-nums text-text">{money(data.estimated)}</dd>
            </div>
            {data.projection != null && (
              <div className="rounded-control bg-background p-3">
                <dt className="text-xs text-text-muted">Proyección a fin de mes</dt>
                <dd className="text-xl font-semibold tabular-nums text-text">{money(data.projection)}</dd>
              </div>
            )}
          </dl>

          {data.freeService.map((n) => {
            const pct = Math.min(100, (n.used / n.limit) * 100);
            const near = n.used >= 800;
            return (
              <div key={n.phoneNumber} className="space-y-1">
                <p className="flex flex-wrap justify-between gap-2 text-sm">
                  <span className="text-text">Respuestas gratis {data.freeService.length > 1 ? `de +${n.phoneNumber}` : 'del mes'}</span>
                  <span className={`tabular-nums ${near ? 'font-semibold text-danger' : 'text-text-muted'}`}>{n.used.toLocaleString('es-PE')} de {n.limit.toLocaleString('es-PE')}</span>
                </p>
                <div className="h-2 rounded-full bg-background" role="progressbar" aria-valuenow={n.used} aria-valuemin={0} aria-valuemax={n.limit} aria-label="Respuestas gratis usadas">
                  <div className={`h-2 rounded-full ${near ? 'bg-danger' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                </div>
                {near && <p className="text-xs text-danger">{n.used >= n.limit ? 'Ya usaste las 1.000 respuestas gratis: desde ahora cada respuesta se cobra.' : 'Te acercas al límite de 1.000 respuestas gratis del mes.'}</p>}
              </div>
            );
          })}

          {data.bySource.length > 0 ? (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-text-muted"><th className="py-1 font-medium">Uso</th><th className="py-1 text-right font-medium">Mensajes</th><th className="py-1 text-right font-medium">Gratis</th><th className="py-1 text-right font-medium">Costo</th></tr></thead>
              <tbody className="divide-y divide-border">
                {data.bySource.map((r) => (
                  <tr key={r.source}>
                    <td className="py-2 text-text">{SOURCE_LABEL[r.source] ?? r.source}{r.freeEntryPoint > 0 && <span className="block text-xs text-text-muted">{r.freeEntryPoint} gratis por venir de un anuncio</span>}</td>
                    <td className="py-2 text-right tabular-nums text-text">{r.messages}</td>
                    <td className="py-2 text-right tabular-nums text-text-muted">{r.free}</td>
                    <td className="py-2 text-right tabular-nums text-text">{money(r.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-sm text-text-muted">Aún no hay mensajes enviados este mes.</p>}
          {data.unpriced > 0 && <p className="text-xs text-text-muted">{data.unpriced} mensajes todavía sin precio: se suman cuando Meta confirma la entrega.</p>}

          <p className="rounded-control bg-background px-3 py-2 text-xs text-text-muted">
            Este monto lo cobra Meta directamente a tu método de pago, no Wuarikes. El estimado usa las tarifas de Meta para Perú; la cifra oficial se actualiza una vez al día.
          </p>
          {data.billing?.status !== 'SIN_PAGO' && !data.paidByWuarikes && (
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-primary-hover">¿Cómo agrego o cambio mi método de pago?</summary>
              <div className="mt-2"><PaymentMethodSteps /></div>
            </details>
          )}
        </>
      )}
    </Card>
  );
}
