'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Banknote, CheckCircle2, ConciergeBell, CreditCard, DoorClosed, LayoutGrid, Receipt, Settings, Users, type LucideIcon } from 'lucide-react';
import { ordersApi } from '../../../lib/api-client';
import { staffStreamUrl, useOrderStream } from '../../../lib/use-order-stream';
import { soles } from '../../../lib/orders-format';
import { useRestaurant } from '../../../context/RestaurantContext';
import { Button, Card, EmptyState, PageHeader, Skeleton, buttonStyles } from '../../../components/ui';

// Estado por color, ícono y texto.
const STATE_STYLE: Record<string, { label: string; icon: LucideIcon; className: string; pulse?: boolean }> = {
  LIBRE: { label: 'Libre', icon: CheckCircle2, className: 'border-success/40 bg-success/10 text-success' },
  OCUPADA: { label: 'Ocupada', icon: Users, className: 'border-primary/40 bg-primary-soft text-primary-hover' },
  POR_SERVIR: { label: 'Por servir', icon: ConciergeBell, className: 'border-secondary bg-secondary/20 text-text' },
  CUENTA_PEDIDA: { label: 'Cuenta pedida', icon: Receipt, className: 'border-danger bg-danger/10 text-danger', pulse: true },
};

export default function TablesPage() {
  const { activePlaceId } = useRestaurant();
  // null = todavía no llegó la primera carga (se muestra Skeleton).
  const [rows, setRows] = useState<any[] | null>(null);
  const [selected, setSelected] = useState<any>(null);

  const load = useCallback(() => {
    if (activePlaceId) ordersApi.tablesBoard(activePlaceId).then((data: any[]) => {
      setRows(data);
      setSelected((prev: any) => (prev ? data.find((r) => r.table.id === prev.table.id) ?? null : null));
    }).catch((err: Error) => { toast.error(err.message); setRows((r) => r ?? []); });
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
      <PageHeader
        title="Mesas"
        subtitle="Toca una mesa con cuenta abierta para cobrarla o cerrarla."
        action={<Link href="/pedidos/configuracion" className={buttonStyles('secondary')}><Settings size={20} aria-hidden /> Crear y editar mesas</Link>}
      />

      <ul className="flex flex-wrap gap-2" aria-label="Leyenda de estados">
        {Object.values(STATE_STYLE).map((s) => (
          <li key={s.label} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${s.className}`}>
            <s.icon size={16} aria-hidden /> {s.label}
          </li>
        ))}
      </ul>

      {rows === null ? (
        <div role="status" aria-label="Cargando" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36 rounded-card" />)}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={LayoutGrid}
            title="Aún no hay mesas"
            description="Créalas en Configurar pedidos y mesas. Cada mesa tiene su QR para pedir desde el celular."
            action={<Link href="/pedidos/configuracion" className={buttonStyles('primary')}>Crear mesas</Link>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {rows.map((r) => <TableTile key={r.table.id} row={r} selected={selected?.table.id === r.table.id} onSelect={() => setSelected(r)} />)}
        </div>
      )}

      {selected?.tab && (
        <Card padding="lg" className="space-y-4" aria-label={`Detalle de ${selected.table.name}`}>
          <h2 className="text-xl font-semibold text-text">{selected.table.name} · <span className="tabular-nums">{soles(selected.total)}</span></h2>
          <div className="flex flex-wrap gap-2">
            <Button icon={Banknote} onClick={() => markPaid('EFECTIVO')}>Pagado en efectivo</Button>
            <Button icon={CreditCard} onClick={() => markPaid('POS')}>Pagado con POS</Button>
            <Button variant="secondary" icon={DoorClosed} onClick={close}>Cerrar mesa</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function TableTile({ row: r, selected, onSelect }: { row: any; selected: boolean; onSelect(): void }) {
  const style = STATE_STYLE[r.state] ?? STATE_STYLE.LIBRE;
  const Icon = style.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${r.table.name}: ${style.label}`}
      className={`rounded-card border-2 p-4 text-left transition-shadow duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${style.className} ${style.pulse ? 'motion-safe:animate-pulse' : ''} ${selected ? 'shadow-modal ring-2 ring-text ring-offset-2' : ''}`}
    >
      <p className="text-lg font-semibold">{r.table.name}</p>
      <p className="text-sm">{r.table.capacity} personas</p>
      {r.table.pin && <p className="mt-2 inline-block rounded-control bg-surface/80 px-2 py-1 font-mono text-base font-bold tracking-widest" aria-label={`PIN de ${r.table.name}`}>PIN {r.table.pin}</p>}
      <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold"><Icon size={16} aria-hidden /> {style.label}</p>
      {r.tab && <p className="text-sm tabular-nums">{soles(r.total)} · {r.minutesOpen} min</p>}
    </button>
  );
}
