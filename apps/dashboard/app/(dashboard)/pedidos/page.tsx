'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ordersApi } from '../../../lib/api-client';
import { staffStreamUrl, useOrderStream } from '../../../lib/use-order-stream';
import { STATUS_LABEL, soles, OrderStatus } from '../../../lib/orders-format';
import { useRestaurant } from '../../../context/RestaurantContext';

const FILTERS: { label: string; status?: string }[] = [
  { label: 'Activos', status: 'PENDIENTE_PAGO,NUEVO,EN_PREPARACION,LISTO' },
  { label: 'Entregados', status: 'ENTREGADO' },
  { label: 'Cancelados', status: 'CANCELADO' },
  { label: 'Todos' },
];

export default function OrdersPage() {
  const { activePlaceId } = useRestaurant();
  const [filter, setFilter] = useState(FILTERS[0]);
  const [channel, setChannel] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: any[]; total: number }>({ items: [], total: 0 });

  const load = useCallback(() => {
    if (!activePlaceId) return;
    ordersApi.list(activePlaceId, { status: filter.status, channel, q, page }).then(setData).catch((err: Error) => toast.error(err.message));
  }, [activePlaceId, filter, channel, q, page]);

  useEffect(() => { load(); }, [load]);
  useOrderStream(staffStreamUrl(activePlaceId), () => load());

  const cancel = async (order: any) => {
    const reason = prompt(`¿Seguro que deseas cancelar el pedido #${order.number}? Escribe el motivo:`);
    if (reason === null) return;
    try { await ordersApi.changeStatus(activePlaceId!, order.id, 'CANCELADO', reason); load(); } catch (err: any) { toast.error(err.message); }
  };

  const markPaid = async (order: any, method: 'EFECTIVO' | 'POS') => {
    try { await ordersApi.manualPayment(activePlaceId!, { orderId: order.id, method }); load(); } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-[#1A1A1A]">Pedidos</h1>
        <Link href="/pedidos/configuracion" className="rounded-2xl border px-5 py-3 text-sm font-bold">Configurar pedidos y mesas</Link>
      </header>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.label} onClick={() => { setFilter(f); setPage(1); }} className={`rounded-full px-4 py-2 text-sm font-bold ${f === filter ? 'bg-[#F26122] text-white' : 'bg-gray-100'}`}>{f.label}</button>
        ))}
        <select aria-label="Canal" value={channel} onChange={(e) => { setChannel(e.target.value); setPage(1); }} className="rounded-full border px-4 py-2 text-sm">
          <option value="">Todos los canales</option><option value="MESA">Mesa</option><option value="WHATSAPP">WhatsApp</option>
        </select>
        <input aria-label="Buscar" placeholder="Buscar #pedido, nombre o teléfono" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="min-w-[240px] flex-1 rounded-full border px-4 py-2 text-sm" />
      </div>
      {data.items.length === 0 ? (
        <p className="rounded-3xl bg-gray-50 p-10 text-center text-gray-500">Aún no hay pedidos. Activa los pedidos y crea tus mesas en Configurar pedidos y mesas.</p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr><th className="p-3">#</th><th className="p-3">Canal</th><th className="p-3">Cliente</th><th className="p-3">Ítems</th><th className="p-3">Total</th><th className="p-3">Estado</th><th className="p-3">Acciones</th></tr>
            </thead>
            <tbody>
              {data.items.map((o) => (
                <tr key={o.id} className="border-t align-top">
                  <td className="p-3 font-bold">#{o.number}</td>
                  <td className="p-3">{o.channel === 'MESA' ? 'Mesa' : 'WhatsApp'} · {o.fulfillment}</td>
                  <td className="p-3">{o.customerName || '—'}<br /><span className="text-gray-400">{o.customerPhone || ''}</span></td>
                  <td className="p-3">{o.items.map((i: any) => `${i.quantity}x ${i.dishNameSnapshot}`).join(', ')}</td>
                  <td className="p-3 font-bold">{soles(o.total)}</td>
                  <td className="p-3">{STATUS_LABEL[o.status as OrderStatus]}{o.refundPending && <span className="block text-xs text-red-500">Reembolso pendiente</span>}</td>
                  <td className="p-3 space-x-2 whitespace-nowrap">
                    {o.status === 'PENDIENTE_PAGO' && !o.tabId && <>
                      <button onClick={() => markPaid(o, 'EFECTIVO')} className="font-bold text-green-700">Pagado en efectivo</button>
                      <button onClick={() => markPaid(o, 'POS')} className="font-bold text-green-700">Pagado con POS</button>
                    </>}
                    {['PENDIENTE_PAGO', 'NUEVO', 'EN_PREPARACION'].includes(o.status) && <button onClick={() => cancel(o)} className="font-bold text-red-500">Cancelar</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data.total > 25 && (
        <div className="flex justify-center gap-3">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-full border px-4 py-2 disabled:opacity-40">Anterior</button>
          <span className="py-2 text-sm">Página {page} de {Math.ceil(data.total / 25)}</span>
          <button disabled={page * 25 >= data.total} onClick={() => setPage(page + 1)} className="rounded-full border px-4 py-2 disabled:opacity-40">Siguiente</button>
        </div>
      )}
    </div>
  );
}
