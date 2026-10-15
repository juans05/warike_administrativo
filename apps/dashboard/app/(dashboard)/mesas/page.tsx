'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ordersApi } from '../../../lib/api-client';
import { staffStreamUrl, useOrderStream } from '../../../lib/use-order-stream';
import { soles } from '../../../lib/orders-format';
import { useRestaurant } from '../../../context/RestaurantContext';

const STATE_STYLE: Record<string, { label: string; className: string }> = {
  LIBRE: { label: 'Libre', className: 'border-green-300 bg-green-50 text-green-800' },
  OCUPADA: { label: 'Ocupada', className: 'border-purple-300 bg-purple-50 text-purple-800' },
  POR_SERVIR: { label: 'Por servir', className: 'border-sky-300 bg-sky-50 text-sky-800' },
  CUENTA_PEDIDA: { label: 'Cuenta pedida', className: 'border-orange-400 bg-orange-50 text-orange-800 motion-safe:animate-pulse' },
};

export default function TablesPage() {
  const { activePlaceId } = useRestaurant();
  const [rows, setRows] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  const load = useCallback(() => {
    if (activePlaceId) ordersApi.tablesBoard(activePlaceId).then((data: any[]) => {
      setRows(data);
      setSelected((prev: any) => (prev ? data.find((r) => r.table.id === prev.table.id) ?? null : null));
    }).catch((err: Error) => toast.error(err.message));
  }, [activePlaceId]);

  useEffect(() => { load(); }, [load]);
  useOrderStream(staffStreamUrl(activePlaceId), (event) => {
    if (event.type === 'tab.bill_requested') toast.warning('Una mesa pidió la cuenta');
    load();
  });

  const markPaid = async (method: 'EFECTIVO' | 'POS') => {
    try { await ordersApi.manualPayment(activePlaceId!, { tabId: selected.tab.id, method }); toast.success('Pago registrado'); load(); } catch (err: any) { toast.error(err.message); }
  };
  const close = async () => {
    try { await ordersApi.closeTab(activePlaceId!, selected.tab.id); setSelected(null); load(); } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-3xl font-black text-[#1A1A1A]">Mesas</h1>
      <div className="flex flex-wrap gap-3 text-xs font-bold">
        {Object.values(STATE_STYLE).map((s) => <span key={s.label} className={`rounded-full border px-3 py-1 ${s.className}`}>{s.label}</span>)}
      </div>
      {rows.length === 0 ? (
        <p className="rounded-3xl bg-gray-50 p-10 text-center text-gray-500">Aún no hay mesas. Créalas en Pedidos → Configurar pedidos y mesas.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {rows.map((r) => {
            const style = STATE_STYLE[r.state];
            return (
              <button key={r.table.id} onClick={() => setSelected(r)} className={`rounded-3xl border-2 p-4 text-left ${style.className}`} aria-label={`${r.table.name}: ${style.label}`}>
                <p className="text-lg font-black">{r.table.name}</p>
                <p className="text-xs">{r.table.capacity} personas</p>
                {r.table.pin && <p className="mt-2 inline-block rounded-lg bg-white/80 px-2 py-1 font-mono text-base font-black tracking-widest" aria-label={`PIN de ${r.table.name}`}>PIN {r.table.pin}</p>}
                <p className="mt-3 text-sm font-bold">{style.label}</p>
                {r.tab && <p className="text-sm">{soles(r.total)} · {r.minutesOpen} min</p>}
              </button>
            );
          })}
        </div>
      )}
      {selected?.tab && (
        <section className="rounded-3xl border bg-white p-6 space-y-4" aria-label={`Detalle de ${selected.table.name}`}>
          <h2 className="text-xl font-black">{selected.table.name} · {soles(selected.total)}</h2>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => markPaid('EFECTIVO')} className="rounded-2xl bg-green-600 px-5 py-3 font-bold text-white">Pagado en efectivo</button>
            <button onClick={() => markPaid('POS')} className="rounded-2xl bg-green-600 px-5 py-3 font-bold text-white">Pagado con POS</button>
            <button onClick={close} className="rounded-2xl border-2 px-5 py-3 font-bold">Cerrar mesa</button>
          </div>
        </section>
      )}
    </div>
  );
}
