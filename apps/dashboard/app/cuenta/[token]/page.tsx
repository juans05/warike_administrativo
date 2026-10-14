'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { publicOrdersApi } from '../../../lib/api-client';
import { publicStreamUrl, useOrderStream } from '../../../lib/use-order-stream';
import { STATUS_LABEL, soles, OrderStatus } from '../../../lib/orders-format';
import CulqiPay from '../../../components/orders/CulqiPay';

export default function TabPage({ params }: { params: { token: string } }) {
  const [tab, setTab] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  const load = useCallback(() => publicOrdersApi.tab(params.token).then(setTab).catch(() => toast.error('No encontramos esta cuenta')), [params.token]);
  useEffect(() => { load(); }, [load]);
  useOrderStream(publicStreamUrl(params.token), () => load());

  if (!tab) return <main className="p-8 text-center">Cargando...</main>;

  const requestBill = async (thenPay: boolean) => {
    await publicOrdersApi.requestBill(params.token);
    if (thenPay) setPaying(true); else toast.success('Listo, el mozo viene a tu mesa');
    load();
  };

  return (
    <main className="mx-auto max-w-md space-y-6 p-6 pb-24">
      <h1 className="text-2xl font-bold">Tu cuenta</h1>
      {tab.orders.map((o: any) => (
        <section key={o.number} className="rounded-2xl border p-4 space-y-2">
          <p className="flex justify-between font-semibold"><span>Pedido #{o.number}</span><span aria-live="polite">{STATUS_LABEL[o.status as OrderStatus]}</span></p>
          {o.items.map((i: any, idx: number) => <p key={idx} className="flex justify-between text-sm"><span>{i.quantity} x {i.name}</span><span>{soles(i.unitPrice * i.quantity)}</span></p>)}
        </section>
      ))}
      <div className="space-y-1">
        <p className="flex justify-between"><span>Consumo</span><span>{soles(tab.total)}</span></p>
        {tab.paid > 0 && <p className="flex justify-between"><span>Pagado</span><span>-{soles(tab.paid)}</span></p>}
        <p className="flex justify-between text-xl font-bold"><span>Por pagar</span><span>{soles(tab.due)}</span></p>
      </div>
      {tab.due === 0 && tab.total > 0 ? (
        <p className="rounded-2xl bg-green-50 p-4 text-center font-bold text-green-700">¡Cuenta pagada! Gracias por tu visita.</p>
      ) : paying ? (
        <CulqiPay target={{ tabToken: params.token }} label={`Pagar ${soles(tab.due)}`} onPaid={() => { setPaying(false); load(); }} />
      ) : (
        <div className="space-y-3">
          <button onClick={() => requestBill(true)} disabled={tab.due === 0} className="w-full rounded-2xl bg-[#F26122] py-4 font-bold text-white disabled:opacity-50">Pedir la cuenta y pagar aquí</button>
          <button onClick={() => requestBill(false)} disabled={tab.due === 0} className="w-full rounded-2xl border-2 border-[#1A1A1A] py-4 font-bold disabled:opacity-50">Pedir la cuenta al mozo</button>
        </div>
      )}
    </main>
  );
}
