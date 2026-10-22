'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Banknote, ChefHat, CreditCard, DoorClosed, FileText, Minus, Plus, Search, Smartphone, Trash2, UserRound } from 'lucide-react';
import { ordersApi, publicApi, type ReceiptRequest } from '../../lib/api-client';
import { STATUS_LABEL, soles, type OrderStatus } from '../../lib/orders-format';
import { Badge, Button, Input, Select } from '../ui';
import { DOC_LABEL, EMPTY_RECEIPT, ReceiptFields } from '../caja/ReceiptFields';

type Line = { key: string; dishId?: string; name: string; unitPrice: number; quantity: number };
const toCents = (v: unknown) => Math.round((parseFloat(String(v ?? '0').replace(',', '.')) || 0) * 100);
const CHANNEL_LABEL: Record<string, string> = { MESA: 'Carta digital', MOZO: 'Mozo', WHATSAPP: 'WhatsApp' };

/**
 * Mesa vista por el mozo (celular, tablet o caja): mozo asignado, comanda ya enviada (rondas de la carta digital
 * y del mozo), nueva comanda con platos de la carta u "otro ítem", precuenta y cobro.
 */
export function MesaPanel({ placeId, row, onChanged }: { placeId: string; row: any; onChanged(): void }) {
  const tableId = row.table.id;
  const [detail, setDetail] = useState<any>(null);
  const [menu, setMenu] = useState<any[]>([]);
  const [waiters, setWaiters] = useState<any[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [custom, setCustom] = useState({ name: '', price: '', quantity: 1 });
  const [sending, setSending] = useState(false);
  const [precuenta, setPrecuenta] = useState<ReceiptRequest | null>(null);

  const loadDetail = useCallback(() => {
    ordersApi.tableDetail(placeId, tableId).then(setDetail).catch((err: Error) => toast.error(err.message));
  }, [placeId, tableId]);
  // El tablero se refresca en vivo; cuando cambia esta mesa (total o estado) se recarga su detalle.
  useEffect(() => { loadDetail(); }, [loadDetail, row.total, row.state]);
  useEffect(() => { setLines([]); setNotes(''); setPrecuenta(null); }, [tableId]);
  useEffect(() => {
    publicApi.getPlaceMenu(placeId).then((m: any) => setMenu(m.categories ?? [])).catch(() => setMenu([]));
    ordersApi.waiters(placeId).then(setWaiters).catch(() => setWaiters([]));
  }, [placeId]);

  const dishes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menu
      .filter((c) => category === 'all' || c.id === category)
      .flatMap((c) => (c.dishes ?? []).filter((d: any) => d.isAvailable && toCents(d.price) > 0 && (!q || d.name.toLowerCase().includes(q))));
  }, [menu, category, query]);

  const add = (line: Omit<Line, 'key' | 'quantity'>, quantity = 1) =>
    setLines((prev) => {
      const same = line.dishId ? prev.find((l) => l.dishId === line.dishId) : undefined;
      if (same) return prev.map((l) => (l === same ? { ...l, quantity: Math.min(50, l.quantity + quantity) } : l));
      return [...prev, { ...line, quantity, key: `${line.dishId ?? 'otro'}-${Date.now()}` }];
    });
  const setQty = (key: string, quantity: number) =>
    setLines((prev) => (quantity <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(50, quantity) } : l))));
  const draftTotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  const addCustom = () => {
    const unitPrice = toCents(custom.price);
    if (!custom.name.trim() || unitPrice <= 0) { toast.error('Escribe el nombre y el precio del ítem'); return; }
    add({ name: custom.name.trim(), unitPrice }, custom.quantity);
    setCustom({ name: '', price: '', quantity: 1 });
  };

  const send = async () => {
    setSending(true);
    try {
      await ordersApi.staffOrder(placeId, tableId, {
        items: lines.filter((l) => l.dishId).map((l) => ({ dishId: l.dishId!, quantity: l.quantity })),
        customItems: lines.filter((l) => !l.dishId).map((l) => ({ name: l.name, unitPrice: l.unitPrice, quantity: l.quantity })),
        notes: notes.trim() || undefined,
      });
      toast.success(`Comanda enviada a cocina · ${row.table.name}`);
      setLines([]); setNotes(''); loadDetail(); onChanged();
    } catch (err: any) { toast.error(err.message); } finally { setSending(false); }
  };

  const tab = detail?.tab;
  const act = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); toast.success(ok); loadDetail(); onChanged(); return true; } catch (err: any) { toast.error(err.message); return false; }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold text-text">{row.table.name} <span className="text-sm font-normal text-text-muted">· {row.table.capacity} personas</span></h2>
        {tab && <p className="text-xl font-semibold tabular-nums text-text">{soles(tab.total)}</p>}
      </div>

      {tab && (
        <Select
          label="Mozo"
          value={tab.waiterUserId ?? ''}
          onChange={(e) => act(() => ordersApi.assignWaiter(placeId, tab.id, e.target.value || null), 'Mozo asignado')}
        >
          <option value="">Sin asignar</option>
          {waiters.map((w) => <option key={w.userId} value={w.userId}>{w.fullName}</option>)}
        </Select>
      )}

      {detail?.orders?.length > 0 && (
        <section aria-label="Comanda enviada" className="space-y-3">
          <h3 className="text-sm font-semibold uppercase text-text-muted">Comanda enviada</h3>
          {detail.orders.filter((o: any) => o.status !== 'CANCELADO').map((o: any) => (
            <div key={o.id} className="rounded-control border border-border p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                <Badge tone={o.channel === 'MOZO' ? 'primary' : 'neutral'}>{o.channel === 'MOZO' ? <UserRound size={14} aria-hidden /> : <Smartphone size={14} aria-hidden />}{CHANNEL_LABEL[o.channel] ?? o.channel}</Badge>
                <Badge tone={o.status === 'LISTO' ? 'warning' : o.status === 'ENTREGADO' ? 'success' : 'neutral'}>{STATUS_LABEL[o.status as OrderStatus] ?? o.status}</Badge>
                <span className="text-text-muted">#{o.number} · {new Date(o.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <ul className="space-y-1 text-sm">
                {o.items.map((i: any) => (
                  <li key={i.id} className="flex justify-between gap-3">
                    <span>{i.quantity}× {i.name}{i.note && <span className="text-text-muted"> · {i.note}</span>}</span>
                    <span className="tabular-nums">{soles(i.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              {o.notes && <p className="mt-2 text-xs text-text-muted">Nota: {o.notes}</p>}
            </div>
          ))}
        </section>
      )}

      <section aria-label="Nueva comanda" className="space-y-3 rounded-card border border-dashed border-primary/50 bg-background p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase text-text">Nueva comanda</h3>
          <span className="text-sm text-text-muted">{lines.length} {lines.length === 1 ? 'producto' : 'productos'}</span>
        </div>
        {lines.length === 0 ? (
          <p className="text-sm text-text-muted">Toca los platos de abajo para agregarlos.</p>
        ) : (
          <ul className="space-y-2">
            {lines.map((l) => (
              <li key={l.key} className="flex items-center gap-2 rounded-control bg-surface p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">{l.name}</p>
                  <p className="text-xs text-text-muted">{soles(l.unitPrice)} c/u{!l.dishId && ' · otro ítem'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="secondary" size="sm" aria-label={`Quitar uno de ${l.name}`} onClick={() => setQty(l.key, l.quantity - 1)}>{l.quantity === 1 ? <Trash2 size={16} aria-hidden /> : <Minus size={16} aria-hidden />}</Button>
                  <span className="w-7 text-center font-semibold tabular-nums" aria-label={`Cantidad de ${l.name}`}>{l.quantity}</span>
                  <Button variant="secondary" size="sm" aria-label={`Agregar uno de ${l.name}`} onClick={() => setQty(l.key, l.quantity + 1)}><Plus size={16} aria-hidden /></Button>
                </div>
                <span className="w-20 text-right text-sm font-semibold tabular-nums">{soles(l.unitPrice * l.quantity)}</span>
              </li>
            ))}
          </ul>
        )}
        {lines.length > 0 && (
          <>
            <Input label="Nota para cocina (opcional)" value={notes} maxLength={300} onChange={(e) => setNotes(e.target.value)} />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setLines([])}>Cancelar</Button>
              <Button className="flex-1" icon={ChefHat} loading={sending} onClick={send}>Enviar a cocina · {soles(draftTotal)}</Button>
            </div>
          </>
        )}
      </section>

      <section aria-label="Platos a añadir" className="space-y-3">
        <h3 className="text-sm font-semibold uppercase text-text-muted">Platos a añadir</h3>
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
          <input
            type="search"
            aria-label="Buscar plato"
            placeholder="Buscar plato..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-11 w-full rounded-control border border-border bg-surface pl-10 pr-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Categorías">
          {[{ id: 'all', name: 'Todas' }, ...menu].map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={category === c.id}
              onClick={() => setCategory(c.id)}
              className={`min-h-9 shrink-0 rounded-full border px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${category === c.id ? 'border-primary bg-primary text-white' : 'border-border bg-surface text-text'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
        {dishes.length === 0 ? (
          <p className="text-sm text-text-muted">{menu.length ? 'No hay platos con ese filtro.' : 'Tu carta todavía no tiene platos disponibles.'}</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {dishes.map((d: any) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => add({ dishId: d.id, name: d.name, unitPrice: toCents(d.price) })}
                  className="flex min-h-14 w-full items-center justify-between gap-2 rounded-control border border-border bg-surface px-3 py-2 text-left hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-sm font-medium text-text">{d.name}</span>
                    <span className="text-xs tabular-nums text-text-muted">{soles(toCents(d.price))}</span>
                  </span>
                  <Plus size={20} className="shrink-0 text-primary" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
        <details className="rounded-control border border-border p-3">
          <summary className="cursor-pointer text-sm font-medium text-text">Registrar otro ítem (fuera de carta)</summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_7rem_5rem_auto] sm:items-end">
            <Input label="Nombre" value={custom.name} maxLength={120} onChange={(e) => setCustom({ ...custom, name: e.target.value })} />
            <Input label="Precio (S/)" type="number" min={0} step="0.10" inputMode="decimal" value={custom.price} onChange={(e) => setCustom({ ...custom, price: e.target.value })} />
            <Input label="Cant." type="number" min={1} max={50} value={custom.quantity} onChange={(e) => setCustom({ ...custom, quantity: Math.max(1, +e.target.value || 1) })} />
            <Button variant="secondary" icon={Plus} onClick={addCustom}>Añadir</Button>
          </div>
        </details>
      </section>

      {tab && (
        <section aria-label="Cuenta" className="space-y-3 border-t border-border pt-4">
          {tab.precuenta && !precuenta && (
            <p className="text-sm text-text-muted">Precuenta en caja: {DOC_LABEL[tab.precuenta.docType as keyof typeof DOC_LABEL]}{tab.precuenta.customerName ? ` · ${tab.precuenta.customerName}` : ''}</p>
          )}
          {precuenta ? (
            <div className="space-y-4">
              <ReceiptFields value={precuenta} onChange={setPrecuenta} />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setPrecuenta(null)}>Cancelar</Button>
                <Button className="flex-1" icon={FileText} onClick={() => act(() => ordersApi.precuenta(placeId, tab.id, precuenta), 'Precuenta enviada a caja').then((ok) => ok && setPrecuenta(null))}>Enviar precuenta a caja</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button icon={FileText} onClick={() => setPrecuenta(tab.precuenta ?? EMPTY_RECEIPT)}>{tab.precuenta ? 'Editar precuenta' : 'Pedir precuenta'}</Button>
              <Button variant="secondary" icon={Banknote} onClick={() => act(() => ordersApi.manualPayment(placeId, { tabId: tab.id, method: 'EFECTIVO' }), 'Pago registrado')}>Pagado en efectivo</Button>
              <Button variant="secondary" icon={CreditCard} onClick={() => act(() => ordersApi.manualPayment(placeId, { tabId: tab.id, method: 'POS' }), 'Pago registrado')}>Pagado con POS</Button>
              <Button variant="secondary" icon={DoorClosed} onClick={() => act(() => ordersApi.closeTab(placeId, tab.id), 'Mesa liberada')}>Liberar mesa</Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
