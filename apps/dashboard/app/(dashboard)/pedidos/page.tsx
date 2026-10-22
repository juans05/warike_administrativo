'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Banknote, ChevronLeft, ChevronRight, CreditCard, Receipt, Search, Settings, XCircle } from 'lucide-react';
import { ordersApi } from '../../../lib/api-client';
import { staffStreamUrl, useOrderStream } from '../../../lib/use-order-stream';
import { soles, OrderStatus } from '../../../lib/orders-format';
import { useRestaurant } from '../../../context/RestaurantContext';
import { useCustomerLabels } from '../../../hooks/useCustomerLabels';
import { OrderStatusPill } from '../../../components/orders/OrderStatus';
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select, Skeleton, Tabs, buttonStyles } from '../../../components/ui';

const FILTERS: { label: string; status?: string }[] = [
  { label: 'Activos', status: 'PENDIENTE_PAGO,NUEVO,EN_PREPARACION,LISTO' },
  { label: 'Entregados', status: 'ENTREGADO' },
  { label: 'Cancelados', status: 'CANCELADO' },
  { label: 'Todos' },
];

const FULFILLMENT_LABEL: Record<string, string> = { SALA: 'Sala', RECOJO: 'Recojo', DELIVERY: 'Delivery' };

export default function OrdersPage() {
  const { activePlaceId } = useRestaurant();
  const { label: customerLabel } = useCustomerLabels();
  const [filter, setFilter] = useState(FILTERS[0]);
  const [channel, setChannel] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  // null = todavía no llegó la primera respuesta (se muestra Skeleton).
  const [data, setData] = useState<{ items: any[]; total: number } | null>(null);

  const load = useCallback(() => {
    if (!activePlaceId) return;
    ordersApi.list(activePlaceId, { status: filter.status, channel, q, page }).then(setData).catch((err: Error) => {
      toast.error(err.message);
      setData((d) => d ?? { items: [], total: 0 });
    });
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

  const pages = data ? Math.ceil(data.total / 25) : 0;

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Pedidos"
        subtitle="Se actualiza solo cuando entra o cambia un pedido."
        action={
          <Link href="/pedidos/configuracion" className={buttonStyles('secondary')}>
            <Settings size={20} aria-hidden /> Configurar pedidos y mesas
          </Link>
        }
      />

      <Tabs
        aria-label="Filtrar por estado"
        tabs={FILTERS.map((f) => ({ key: f.label, label: f.label }))}
        value={filter.label}
        onChange={(key) => { setFilter(FILTERS.find((f) => f.label === key) ?? FILTERS[0]); setPage(1); }}
      />

      <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
        <Select label="Canal" value={channel} onChange={(e) => { setChannel(e.target.value); setPage(1); }}>
          <option value="">Todos los canales</option><option value="MESA">Mesa</option><option value="WHATSAPP">WhatsApp</option>
        </Select>
        <Input label="Buscar" type="search" placeholder="#pedido, nombre o teléfono" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
      </div>

      {data === null ? (
        <div role="status" aria-label="Cargando" className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-36 rounded-card" />)}
        </div>
      ) : data.items.length === 0 ? (
        <Card>
          <EmptyState
            icon={q || channel ? Search : Receipt}
            title={q || channel ? 'Ningún pedido coincide' : 'Aún no hay pedidos'}
            description={q || channel ? 'Prueba con otro canal o búsqueda.' : 'Activa los pedidos y crea tus mesas en Configurar pedidos y mesas.'}
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {data.items.map((o) => (
            <li key={o.id}>
              <OrderRow order={o} customerLabel={customerLabel} onPaid={markPaid} onCancel={cancel} />
            </li>
          ))}
        </ul>
      )}

      {data && data.total > 25 && (
        <nav aria-label="Paginación" className="flex items-center justify-center gap-3">
          <Button variant="secondary" icon={ChevronLeft} disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span className="text-base tabular-nums text-text">Página {page} de {pages}</span>
          <Button variant="secondary" disabled={page * 25 >= data.total} onClick={() => setPage(page + 1)}>
            Siguiente <ChevronRight size={20} aria-hidden />
          </Button>
        </nav>
      )}
    </div>
  );
}

function OrderRow({ order: o, customerLabel, onPaid, onCancel }: {
  order: any;
  customerLabel: string;
  onPaid(order: any, method: 'EFECTIVO' | 'POS'): void;
  onCancel(order: any): void;
}) {
  const canCancel = ['PENDIENTE_PAGO', 'NUEVO', 'EN_PREPARACION'].includes(o.status);
  return (
    <Card className="space-y-3 text-base">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-2xl font-bold tabular-nums text-text">#{o.number}</span>
          <span className="text-text-muted">{o.channel === 'MESA' ? 'Mesa' : 'WhatsApp'} · {FULFILLMENT_LABEL[o.fulfillment] ?? o.fulfillment}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {o.refundPending && <Badge tone="danger">Reembolso pendiente</Badge>}
          <OrderStatusPill status={o.status as OrderStatus} />
        </div>
      </div>

      <p className="text-text">{o.items.map((i: any) => `${i.quantity}x ${i.dishNameSnapshot}`).join(', ')}</p>

      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border pt-3">
        <div>
          <p className="text-sm text-text-muted">{customerLabel}</p>
          <p className="text-text">{o.customerName || '—'}{o.customerPhone && <span className="text-text-muted"> · {o.customerPhone}</span>}</p>
        </div>
        <p className="text-xl font-bold tabular-nums text-text">{soles(o.total)}</p>
      </div>

      {(o.status === 'PENDIENTE_PAGO' || canCancel) && (
        <div className="flex flex-wrap gap-2">
          {o.status === 'PENDIENTE_PAGO' && <>
            <Button icon={Banknote} onClick={() => onPaid(o, 'EFECTIVO')}>Pagado en efectivo</Button>
            <Button variant="secondary" icon={CreditCard} onClick={() => onPaid(o, 'POS')}>Pagado con POS</Button>
          </>}
          {canCancel && <Button variant="ghost" icon={XCircle} className="text-danger hover:bg-danger/10 hover:text-danger" onClick={() => onCancel(o)}>Cancelar</Button>}
        </div>
      )}
    </Card>
  );
}
