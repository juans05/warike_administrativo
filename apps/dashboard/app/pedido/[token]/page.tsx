'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { publicOrdersApi } from '../../../lib/api-client';
import { publicStreamUrl, useOrderStream } from '../../../lib/use-order-stream';
import { STATUS_LABEL, soles, OrderStatus } from '../../../lib/orders-format';

const STEPS: OrderStatus[] = ['NUEVO', 'EN_PREPARACION', 'LISTO', 'ENTREGADO'];

export default function OrderTrackingPage({ params }: { params: { token: string } }) {
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');
  const load = useCallback(() => publicOrdersApi.order(params.token).then(setOrder).catch(() => setError('No encontramos este pedido')), [params.token]);
  useEffect(() => { load(); }, [load]);
  useOrderStream(publicStreamUrl(params.token), () => load());

  if (error) return <main className="p-8 text-center">{error}</main>;
  if (!order) return <main className="p-8 text-center">Cargando...</main>;
  const current = STEPS.indexOf(order.status);

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-bold">Pedido #{order.number}</h1>
      <p className="text-lg font-semibold" aria-live="polite">{STATUS_LABEL[order.status as OrderStatus]}</p>
      {order.status !== 'CANCELADO' && order.status !== 'PENDIENTE_PAGO' && (
        <ol className="flex gap-2" aria-label="Avance del pedido">
          {STEPS.map((s, i) => (
            <li key={s} className={`h-2 flex-1 rounded-full ${i <= current ? 'bg-[#F26122]' : 'bg-gray-200'}`} aria-label={STATUS_LABEL[s]} />
          ))}
        </ol>
      )}
      <ul className="divide-y rounded-2xl border">
        {order.items.map((i: any, idx: number) => (
          <li key={idx} className="flex justify-between p-4"><span>{i.quantity} x {i.name}</span><span>{soles(i.unitPrice * i.quantity)}</span></li>
        ))}
      </ul>
      {order.deliveryFee > 0 && <p className="flex justify-between"><span>Delivery</span><span>{soles(order.deliveryFee)}</span></p>}
      <p className="flex justify-between text-lg font-bold"><span>Total</span><span>{soles(order.total)}</span></p>
      {order.status === 'PENDIENTE_PAGO' && <a href={`/pagar/${params.token}`} className="block rounded-2xl bg-[#F26122] py-4 text-center font-bold text-white">Pagar pedido</a>}
    </main>
  );
}
