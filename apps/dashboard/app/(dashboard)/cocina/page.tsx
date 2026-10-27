'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, ChefHat, Clock, Printer, StickyNote, Volume2 } from 'lucide-react';
import { ordersApi } from '../../../lib/api-client';
import { staffStreamUrl, useOrderStream } from '../../../lib/use-order-stream';
import { minutesSince, OrderStatus } from '../../../lib/orders-format';
import { useRestaurant } from '../../../context/RestaurantContext';
import { STATUS_META } from '../../../components/orders/OrderStatus';
import { Badge, Button, Card, EmptyState, PageHeader, Skeleton } from '../../../components/ui';
import { getPrintSettings, kitchenTicketHtml, printHtml } from '../../../lib/print';
import { PrintSettingsButton } from '../../../components/print/PrintSettingsButton';

const printOrder = (o: any) => printHtml(kitchenTicketHtml(o), `Comanda #${o.number}`);

const COLUMNS = [
  { status: 'NUEVO', title: 'Nuevo', next: 'EN_PREPARACION', action: 'Empezar' },
  { status: 'EN_PREPARACION', title: 'En preparación', next: 'LISTO', action: 'Marcar como listo' },
  { status: 'LISTO', title: 'Listo', next: 'ENTREGADO', action: 'Entregado' },
] as const;

type Column = (typeof COLUMNS)[number];

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
  // null = todavía no llegó la primera carga (se muestra Skeleton).
  const [orders, setOrders] = useState<any[] | null>(null);
  const [, tick] = useState(0);
  const audio = useRef<AudioContext | null>(null);
  const [soundOn, setSoundOn] = useState(false);

  // Pedidos ya vistos: al abrir la pantalla no se reimprime lo pendiente, solo lo que entra después.
  const seen = useRef<Set<string> | null>(null);
  const load = useCallback(() => {
    if (activePlaceId) ordersApi.kds(activePlaceId).then((list: any[]) => {
      const fresh = seen.current ? list.filter((o) => o.status === 'NUEVO' && !seen.current!.has(o.id)) : [];
      seen.current = new Set(Array.from(seen.current ?? []).concat(list.map((o) => o.id)));
      if (fresh.length && getPrintSettings().autoKitchen) fresh.forEach(printOrder);
      setOrders(list);
    }).catch((err: Error) => {
      toast.error(err.message);
      setOrders((o) => o ?? []);
    });
  }, [activePlaceId]);

  useEffect(() => { load(); }, [load]);
  // Cada 30 s: refresca los minutos de espera y recarga por si se perdió algún evento del stream.
  useEffect(() => { const t = setInterval(() => { tick((n) => n + 1); load(); }, 30_000); return () => clearInterval(t); }, [load]);

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
      <PageHeader
        title="Cocina"
        subtitle="Los pedidos entran solos. Toca el botón de cada pedido para avanzarlo."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <PrintSettingsButton />
            {soundOn
              ? <Badge tone="success"><Volume2 size={16} aria-hidden /> Sonido activado</Badge>
              : <Button icon={Volume2} onClick={enableSound}>Activar sonido</Button>}
          </div>
        }
      />

      {orders === null ? (
        <div role="status" aria-label="Cargando" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {COLUMNS.map((c) => <Skeleton key={c.status} className="h-64 rounded-card" />)}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <EmptyState icon={ChefHat} title="No hay pedidos en cocina" description="Cuando entre un pedido aparecerá aquí sin recargar la página." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {COLUMNS.map((col) => (
            <KitchenColumn key={col.status} col={col} orders={orders.filter((o) => o.status === col.status)} onAdvance={advance} />
          ))}
        </div>
      )}
    </div>
  );
}

function KitchenColumn({ col, orders, onAdvance }: { col: Column; orders: any[]; onAdvance(orderId: string, next: string): void }) {
  const meta = STATUS_META[col.status as OrderStatus];
  const Icon = meta.icon;
  return (
    <section className="rounded-card border border-border bg-background p-3" aria-label={col.title}>
      <h2 className={`mb-3 flex items-center gap-2 rounded-control border px-3 py-2 text-xl font-semibold ${meta.className}`}>
        <Icon size={24} aria-hidden />
        {col.title}
        <span className="ml-auto tabular-nums">{orders.length}</span>
      </h2>
      {orders.length === 0 ? (
        <p className="px-1 py-6 text-center text-base text-text-muted">Sin pedidos</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => <KitchenTicket key={o.id} order={o} col={col} onAdvance={onAdvance} />)}
        </div>
      )}
    </section>
  );
}

function KitchenTicket({ order: o, col, onAdvance }: { order: any; col: Column; onAdvance(orderId: string, next: string): void }) {
  const waited = minutesSince(o.createdAt);
  const overdue = waited > OVERDUE_MIN && col.status !== 'LISTO';
  const NextIcon = STATUS_META[col.next as OrderStatus].icon;
  return (
    <article className={`space-y-3 rounded-card border-2 bg-surface p-4 text-base shadow-card ${overdue ? 'border-danger' : 'border-transparent'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-3xl font-bold tabular-nums text-text">#{o.number}</p>
        <Button size="sm" variant="ghost" icon={Printer} onClick={() => printOrder(o)} aria-label={`Imprimir comanda #${o.number}`}>Imprimir</Button>
        <p className={`inline-flex items-center gap-1.5 text-base font-semibold tabular-nums ${overdue ? 'text-danger' : 'text-text-muted'}`}>
          {overdue ? <AlertTriangle size={20} aria-hidden /> : <Clock size={20} aria-hidden />}
          {overdue ? 'Demorado · ' : ''}hace {waited} min
        </p>
      </div>
      <p className="text-base font-medium text-text">{o.channel === 'MESA' ? 'Mesa' : 'WhatsApp'} · {FULFILLMENT_LABEL[o.fulfillment] ?? o.fulfillment}</p>
      <ul className="space-y-2 border-t border-border pt-3">
        {o.items.map((i: any) => (
          <li key={i.id} className="text-lg text-text">
            <span className="font-bold tabular-nums">{i.quantity}x</span> {i.name}
            {i.note && <span className="mt-1 block rounded-control bg-secondary/20 px-2 py-1 text-base font-semibold">{i.note}</span>}
          </li>
        ))}
      </ul>
      {o.notes && (
        <p className="flex gap-2 rounded-control bg-secondary/20 px-3 py-2 text-base text-text">
          <StickyNote size={20} aria-hidden className="mt-0.5 shrink-0" /> {o.notes}
        </p>
      )}
      <Button icon={NextIcon} onClick={() => onAdvance(o.id, col.next)} className="h-14 w-full text-lg font-semibold">
        {col.action}
      </Button>
    </article>
  );
}
