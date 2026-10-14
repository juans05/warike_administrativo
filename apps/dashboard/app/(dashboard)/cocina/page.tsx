'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ordersApi } from '../../../lib/api-client';
import { staffStreamUrl, useOrderStream } from '../../../lib/use-order-stream';
import { minutesSince } from '../../../lib/orders-format';
import { useRestaurant } from '../../../context/RestaurantContext';

const COLUMNS = [
  { status: 'NUEVO', title: 'NUEVO', next: 'EN_PREPARACION', action: 'Empezar' },
  { status: 'EN_PREPARACION', title: 'EN PREPARACIÓN', next: 'LISTO', action: 'Marcar como listo' },
  { status: 'LISTO', title: 'LISTO', next: 'ENTREGADO', action: 'Entregado' },
] as const;

const FULFILLMENT_LABEL: Record<string, string> = { SALA: 'Sala', RECOJO: 'Recojo', DELIVERY: 'Delivery' };
// ponytail: umbral fijo de 20 min; leer prep_time_min con un endpoint de solo lectura para cocina si los locales lo piden.
const OVERDUE_MIN = 20;

// Pitido doble con Web Audio: sin archivo de sonido que mantener.
function beep(ctx: AudioContext) {
  [0, 0.25].forEach((offset) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + offset);
    osc.stop(ctx.currentTime + offset + 0.2);
  });
}

export default function KitchenPage() {
  const { activePlaceId } = useRestaurant();
  const [orders, setOrders] = useState<any[]>([]);
  const [, tick] = useState(0);
  const audio = useRef<AudioContext | null>(null);
  const [soundOn, setSoundOn] = useState(false);

  const load = useCallback(() => {
    if (activePlaceId) ordersApi.kds(activePlaceId).then(setOrders).catch((err: Error) => toast.error(err.message));
  }, [activePlaceId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 30_000); return () => clearInterval(t); }, []);

  useOrderStream(staffStreamUrl(activePlaceId), (event) => {
    if (event.type === 'order.created' && soundOn && audio.current) beep(audio.current);
    load();
  });

  const advance = async (orderId: string, next: string) => {
    try {
      await ordersApi.changeStatus(activePlaceId!, orderId, next);
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Los navegadores bloquean el audio hasta que la persona toca la pantalla una vez.
  const enableSound = () => { audio.current = new AudioContext(); beep(audio.current); setSoundOn(true); };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-[#1A1A1A]">Cocina</h1>
        {!soundOn && <button onClick={enableSound} className="rounded-2xl bg-[#1A1A1A] px-5 py-3 text-sm font-bold text-white">Activar sonido</button>}
      </header>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const list = orders.filter((o) => o.status === col.status);
          return (
            <section key={col.status} className="rounded-3xl bg-gray-50 p-4" aria-label={col.title}>
              <h2 className="mb-4 text-sm font-black tracking-widest text-gray-500">{col.title} · {list.length}</h2>
              <div className="space-y-3">
                {list.map((o) => {
                  const waited = minutesSince(o.createdAt);
                  return (
                    <article key={o.id} className={`rounded-2xl border-2 bg-white p-4 space-y-3 ${waited > OVERDUE_MIN && col.status !== 'LISTO' ? 'border-red-400' : 'border-transparent'}`}>
                      <p className="font-black text-lg">#{o.number} · {o.channel === 'MESA' ? 'Mesa' : 'WhatsApp'} {FULFILLMENT_LABEL[o.fulfillment]} · hace {waited} min</p>
                      <ul className="space-y-1">
                        {o.items.map((i: any) => (
                          <li key={i.id}><span className="font-bold">{i.quantity}x</span> {i.name}{i.note && <span className="block rounded bg-yellow-100 px-2 text-sm font-semibold">{i.note}</span>}</li>
                        ))}
                      </ul>
                      {o.notes && <p className="rounded bg-yellow-100 px-2 text-sm">{o.notes}</p>}
                      <button onClick={() => advance(o.id, col.next)} className="w-full rounded-xl bg-[#F26122] py-4 text-base font-black text-white">{col.action}</button>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
