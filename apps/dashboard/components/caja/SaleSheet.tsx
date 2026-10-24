'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Minus, Plus, Search, Trash2, Wallet } from 'lucide-react';
import { ordersApi, publicApi, type CashMethod, type ReceiptRequest } from '../../lib/api-client';
import { soles } from '../../lib/orders-format';
import { Button, Input, Sheet } from '../ui';
import { EMPTY_RECEIPT, ReceiptFields } from './ReceiptFields';

type Line = { key: string; dishId?: string; name: string; unitPrice: number; quantity: number };
const toCents = (v: unknown) => Math.round((parseFloat(String(v ?? '0').replace(',', '.')) || 0) * 100);
const METHODS: { key: CashMethod; label: string }[] = [
  { key: 'EFECTIVO', label: 'Efectivo' }, { key: 'TARJETA', label: 'Tarjeta' }, { key: 'YAPE_PLIN', label: 'Yape / Plin' },
];

/**
 * Venta directa en mostrador (productos y servicios del catálogo u "otro ítem") o cobro de una cita:
 * con cita, su servicio ya viene incluido y se pueden sumar productos (ej. una cera después del corte).
 */
export function SaleSheet({ placeId, appointment, series, onClose, onDone }: { placeId: string; appointment?: any; series?: Record<string, string>; onClose(): void; onDone(): void }) {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [custom, setCustom] = useState({ name: '', price: '' });
  const [receipt, setReceipt] = useState<ReceiptRequest>(appointment ? { ...EMPTY_RECEIPT, customerName: appointment.customerName } : EMPTY_RECEIPT);
  const [method, setMethod] = useState<CashMethod>('EFECTIVO');
  const [received, setReceived] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    publicApi.getPlaceMenu(placeId).then((m: any) => setCatalog((m.categories ?? []).flatMap((c: any) => c.dishes ?? []).filter((d: any) => d.isAvailable && toCents(d.price) > 0))).catch(() => setCatalog([]));
  }, [placeId]);
  const found = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? catalog.filter((d) => d.name.toLowerCase().includes(q)).slice(0, 12) : catalog.slice(0, 12);
  }, [catalog, query]);

  const add = (line: Omit<Line, 'key' | 'quantity'>) => setLines((prev) => {
    const same = line.dishId ? prev.find((l) => l.dishId === line.dishId) : undefined;
    return same ? prev.map((l) => (l === same ? { ...l, quantity: l.quantity + 1 } : l)) : [...prev, { ...line, quantity: 1, key: `${line.dishId ?? 'otro'}-${Date.now()}` }];
  });
  const setQty = (key: string, q: number) => setLines((prev) => (q <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, quantity: q } : l))));
  const total = (appointment?.price ?? 0) + lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const change = method === 'EFECTIVO' && received ? toCents(received) - total : null;

  const charge = async () => {
    setSaving(true);
    try {
      const r = await ordersApi.cashSale(placeId, {
        ...receipt, method, appointmentId: appointment?.id,
        items: lines.map((l) => (l.dishId ? { dishId: l.dishId, quantity: l.quantity } : { name: l.name, unitPrice: l.unitPrice, quantity: l.quantity })),
      });
      toast.success(`Cobrado: ${r.code} · ${soles(r.total)}`);
      onDone();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <Sheet open onClose={onClose} title={appointment ? `Cobrar cita · ${appointment.customerName}` : 'Venta directa'}>
      <div className="space-y-5 p-4">
        <ul className="space-y-2">
          {appointment && (
            <li className="flex items-center justify-between rounded-control bg-primary-soft/50 p-2 text-sm">
              <span><span className="font-medium">{appointment.serviceName}</span> <span className="text-text-muted">· {appointment.professionalName}</span></span>
              <span className="font-semibold tabular-nums">{soles(appointment.price)}</span>
            </li>
          )}
          {lines.map((l) => (
            <li key={l.key} className="flex items-center gap-2 rounded-control border border-border p-2">
              <span className="min-w-0 flex-1 truncate text-sm">{l.name}</span>
              <Button variant="secondary" size="sm" aria-label={`Quitar uno de ${l.name}`} onClick={() => setQty(l.key, l.quantity - 1)}>{l.quantity === 1 ? <Trash2 size={16} aria-hidden /> : <Minus size={16} aria-hidden />}</Button>
              <span className="w-6 text-center font-semibold tabular-nums">{l.quantity}</span>
              <Button variant="secondary" size="sm" aria-label={`Agregar uno de ${l.name}`} onClick={() => setQty(l.key, l.quantity + 1)}><Plus size={16} aria-hidden /></Button>
              <span className="w-20 text-right text-sm font-semibold tabular-nums">{soles(l.unitPrice * l.quantity)}</span>
            </li>
          ))}
          {!appointment && !lines.length && <li className="text-sm text-text-muted">Agrega productos o servicios desde abajo.</li>}
        </ul>
        <p className="flex justify-between text-xl font-semibold text-text"><span>Total</span><span className="tabular-nums">{soles(total)}</span></p>

        <section className="space-y-2" aria-label="Agregar ítems">
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
            <input type="search" aria-label="Buscar en el catálogo" placeholder="Buscar producto o servicio..." value={query} onChange={(e) => setQuery(e.target.value)}
              className="min-h-11 w-full rounded-control border border-border bg-surface pl-10 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {found.map((d) => (
              <li key={d.id}>
                <button type="button" onClick={() => add({ dishId: d.id, name: d.name, unitPrice: toCents(d.price) })}
                  className="flex min-h-12 w-full items-center justify-between gap-2 rounded-control border border-border px-3 py-2 text-left text-sm hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <span className="line-clamp-2">{d.name}</span>
                  <span className="shrink-0 tabular-nums text-text-muted">{soles(toCents(d.price))}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-[1fr_6rem_auto] items-end gap-2">
            <Input label="Otro ítem" value={custom.name} maxLength={150} onChange={(e) => setCustom({ ...custom, name: e.target.value })} />
            <Input label="Precio S/" type="number" min={0} step="0.10" inputMode="decimal" value={custom.price} onChange={(e) => setCustom({ ...custom, price: e.target.value })} />
            <Button variant="secondary" icon={Plus} aria-label="Añadir otro ítem" disabled={!custom.name.trim() || toCents(custom.price) <= 0}
              onClick={() => { add({ name: custom.name.trim(), unitPrice: toCents(custom.price) }); setCustom({ name: '', price: '' }); }} />
          </div>
        </section>

        <ReceiptFields value={receipt} onChange={setReceipt} series={series} />

        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium text-text">Método de pago</legend>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => (
              <button key={m.key} type="button" aria-pressed={method === m.key} onClick={() => setMethod(m.key)}
                className={`min-h-11 rounded-control border text-sm font-medium ${method === m.key ? 'border-primary bg-primary-soft text-primary-hover' : 'border-border'}`}>{m.label}</button>
            ))}
          </div>
        </fieldset>
        {method === 'EFECTIVO' && (
          <div className="space-y-1">
            <Input label="Recibido (S/)" type="number" min={0} step="0.10" inputMode="decimal" value={received} onChange={(e) => setReceived(e.target.value)} />
            {change != null && <p className={`text-sm font-medium ${change < 0 ? 'text-danger' : 'text-text'}`}>{change < 0 ? `Faltan ${soles(-change)}` : `Vuelto: ${soles(change)}`}</p>}
          </div>
        )}
        <Button className="w-full" icon={Wallet} loading={saving} disabled={total <= 0 || (change != null && change < 0)} onClick={charge}>Cobrar {soles(total)}</Button>
      </div>
    </Sheet>
  );
}
