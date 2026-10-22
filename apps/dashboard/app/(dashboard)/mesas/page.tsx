'use client';

import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { Bell, BellRing, CheckCircle2, ConciergeBell, LayoutGrid, Receipt, Settings, Users, type LucideIcon } from 'lucide-react';
import { ordersApi } from '../../../lib/api-client';
import { staffStreamUrl, useOrderStream } from '../../../lib/use-order-stream';
import { soles } from '../../../lib/orders-format';
import { useRestaurant } from '../../../context/RestaurantContext';
import { Button, Card, EmptyState, PageHeader, Sheet, Skeleton } from '../../../components/ui';
import { TablesQrCard } from '../../../components/orders/TablesQrCard';
import { MesaPanel } from '../../../components/mesas/MesaPanel';
import { enableReadyAlerts, notificationsState, readyAlert } from '../../../lib/ready-alert';

// Estado por color, ícono y texto.
const STATE_STYLE: Record<string, { label: string; icon: LucideIcon; className: string; pulse?: boolean }> = {
  LIBRE: { label: 'Libre', icon: CheckCircle2, className: 'border-success/40 bg-success/10 text-success' },
  OCUPADA: { label: 'Ocupada', icon: Users, className: 'border-primary/40 bg-primary-soft text-primary-hover' },
  POR_SERVIR: { label: 'Por servir', icon: ConciergeBell, className: 'border-secondary bg-secondary/20 text-text' },
  CUENTA_PEDIDA: { label: 'Cuenta pedida', icon: Receipt, className: 'border-danger bg-danger/10 text-danger', pulse: true },
};

// En pantalla ancha (caja, laptop) el panel de la mesa va al lado del salón; en celular/tablet se abre encima.
const WIDE = '(min-width: 1280px)';
const useWide = () => useSyncExternalStore(
  (cb) => { const m = window.matchMedia(WIDE); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); },
  () => window.matchMedia(WIDE).matches,
  () => true,
);

export default function TablesPage() {
  const { activePlaceId } = useRestaurant();
  // null = todavía no llegó la primera carga (se muestra Skeleton).
  const [rows, setRows] = useState<any[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [tables, setTables] = useState<any[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const wide = useWide();
  const [alertsOn, setAlertsOn] = useState(false);
  // El evento en vivo llega antes de recargar el tablero: se lee el mozo de la mesa del último tablero conocido.
  const rowsRef = useRef<any[] | null>(null);
  rowsRef.current = rows;
  const myId = useRef<string | null>(null);
  useEffect(() => {
    try { myId.current = JSON.parse(localStorage.getItem('user') || 'null')?.id ?? null; } catch { myId.current = null; }
    setAlertsOn(notificationsState() === 'granted');
  }, []);
  const turnOnAlerts = async () => {
    const state = await enableReadyAlerts();
    setAlertsOn(true);
    toast.success(state === 'granted' ? 'Avisos activados: te avisaremos cuando cocina termine un pedido de tus mesas' : 'Avisos con sonido activados (las notificaciones del sistema están bloqueadas en este navegador)');
  };

  const load = useCallback(() => {
    if (activePlaceId) ordersApi.tablesBoard(activePlaceId).then(setRows).catch((err: Error) => { toast.error(err.message); setRows((r) => r ?? []); });
  }, [activePlaceId]);
  const loadTables = useCallback(() => {
    if (activePlaceId) ordersApi.tables(activePlaceId).then(setTables).catch(() => undefined);
  }, [activePlaceId]);
  const openEditor = () => { loadTables(); setEditing(true); };

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (activePlaceId) ordersApi.me(activePlaceId).then((r: any) => setRole(r.role)).catch(() => setRole(null));
  }, [activePlaceId]);
  useOrderStream(staffStreamUrl(activePlaceId), (event) => {
    if (event.type === 'tab.bill_requested') toast.warning('Una mesa pidió la cuenta');
    if (event.type === 'order.status_changed' && event.status === 'LISTO') {
      const row = rowsRef.current?.find((r) => r.table.id === event.tableId);
      const waiter = row?.tab?.waiterUserId ?? null;
      // Solo avisa al mozo de esa mesa (o a todos si la mesa no tiene mozo asignado).
      if (row && (!waiter || waiter === myId.current)) {
        const msg = `${row.table.name}: pedido listo para servir`;
        readyAlert('Pedido listo', msg);
        toast.warning(msg, { duration: 15000 });
      }
    }
    load();
  });

  const selected = rows?.find((r) => r.table.id === selectedId) ?? null;
  const canManageTables = role === 'admin' || role === 'supervisor';
  const panel = selected && activePlaceId ? <MesaPanel placeId={activePlaceId} row={selected} onChanged={load} /> : null;

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Mesas y pedidos"
        subtitle="Toca una mesa para tomar el pedido, ver lo que pidieron por la carta digital, pedir la precuenta o liberarla."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant={alertsOn ? 'ghost' : 'primary'} icon={alertsOn ? BellRing : Bell} onClick={turnOnAlerts}>
              {alertsOn ? 'Avisos activos' : 'Activar avisos de pedido listo'}
            </Button>
            {canManageTables && <Button variant="secondary" icon={Settings} onClick={openEditor}>Crear y editar mesas</Button>}
          </div>
        }
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
            description={canManageTables ? 'Crea tus mesas aquí. Cada mesa tiene su QR para pedir desde el celular.' : 'Pide al administrador que cree las mesas del local.'}
            action={canManageTables ? <Button onClick={openEditor}>Crear mesas</Button> : undefined}
          />
        </Card>
      ) : (
        <div className={wide && panel ? 'grid grid-cols-[1fr_30rem] items-start gap-6' : ''}>
          <div className={`grid gap-4 ${wide && panel ? 'grid-cols-3 2xl:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'}`}>
            {rows.map((r) => <TableTile key={r.table.id} row={r} selected={selectedId === r.table.id} onSelect={() => setSelectedId(r.table.id)} />)}
          </div>
          {wide && panel && <Card padding="lg" className="sticky top-4 max-h-[calc(100dvh-2rem)] overflow-y-auto">{panel}</Card>}
        </div>
      )}

      {!wide && (
        <Sheet open={!!panel} onClose={() => setSelectedId(null)} title={selected?.table.name}>
          <div className="p-4">{panel}</div>
        </Sheet>
      )}

      <Sheet open={editing} onClose={() => setEditing(false)} title="Crear y editar mesas">
        {activePlaceId && <TablesQrCard placeId={activePlaceId} tables={tables} onChanged={() => { loadTables(); load(); }} />}
      </Sheet>
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
      className={`rounded-card border-2 p-4 text-left transition-shadow duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${style.className} ${style.pulse ? 'motion-safe:animate-pulse' : ''} ${selected ? 'shadow-modal ring-2 ring-text ring-offset-2' : ''}`}
    >
      <p className="text-lg font-semibold">{r.table.name}</p>
      <p className="text-sm">{r.table.capacity} personas</p>
      {r.table.pin && <p className="mt-2 inline-block rounded-control bg-surface/80 px-2 py-1 font-mono text-base font-bold tracking-widest" aria-label={`PIN de ${r.table.name}`}>PIN {r.table.pin}</p>}
      <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold"><Icon size={16} aria-hidden /> {style.label}</p>
      {r.tab && <p className="text-sm tabular-nums">{soles(r.total)} · {r.minutesOpen} min</p>}
    </button>
  );
}
