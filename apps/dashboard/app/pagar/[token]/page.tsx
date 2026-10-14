'use client';

import React, { useEffect, useState } from 'react';
import { publicOrdersApi } from '../../../lib/api-client';
import { soles } from '../../../lib/orders-format';
import CulqiPay from '../../../components/orders/CulqiPay';

export default function PayLinkPage({ params }: { params: { token: string } }) {
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');
  useEffect(() => { publicOrdersApi.order(params.token).then(setOrder).catch(() => setError('No encontramos este pedido')); }, [params.token]);

  if (error) return <main className="p-8 text-center">{error}</main>;
  if (!order) return <main className="p-8 text-center">Cargando...</main>;
  if (order.status !== 'PENDIENTE_PAGO') {
    if (typeof window !== 'undefined') window.location.replace(`/pedido/${params.token}`);
    return null;
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-bold">Pagar pedido #{order.number}</h1>
      <ul className="divide-y rounded-2xl border">
        {order.items.map((i: any, idx: number) => <li key={idx} className="flex justify-between p-4"><span>{i.quantity} x {i.name}</span><span>{soles(i.unitPrice * i.quantity)}</span></li>)}
      </ul>
      {order.deliveryFee > 0 && <p className="flex justify-between"><span>Delivery</span><span>{soles(order.deliveryFee)}</span></p>}
      <p className="flex justify-between text-xl font-bold"><span>Total</span><span>{soles(order.total)}</span></p>
      <CulqiPay target={{ orderToken: params.token }} label={`Pagar ${soles(order.total)}`} onPaid={() => window.location.replace(`/pedido/${params.token}`)} />
    </main>
  );
}
