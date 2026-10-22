'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Banknote, CheckCircle2, CreditCard, DoorClosed, Smartphone, Wallet, type LucideIcon } from 'lucide-react';
import { ordersApi, type CashMethod, type ReceiptRequest } from '../../../lib/api-client';
import { staffStreamUrl, useOrderStream } from '../../../lib/use-order-stream';
import { soles } from '../../../lib/orders-format';
import { useRestaurant } from '../../../context/RestaurantContext';
import { Badge, Button, Card, EmptyState, Input, Modal, PageHeader, Sheet, Skeleton, StatTile } from '../../../components/ui';
import { DOC_LABEL, EMPTY_RECEIPT, ReceiptFields } from '../../../components/caja/ReceiptFields';

const METHODS: { key: CashMethod; label: string; icon: LucideIcon }[] = [
  { key: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
  { key: 'TARJETA', label: 'Tarjeta de crédito/débito', icon: CreditCard },
  { key: 'YAPE_PLIN', label: 'Yape / Plin', icon: Smartphone },
];
const METHOD_LABEL: Record<CashMethod, string> = { EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', YAPE_PLIN: 'Yape / Plin' };
const toCents = (soles: string) => Math.round((parseFloat(soles.replace(',', '.')) || 0) * 100);
const hour = (iso: string) => new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

export default function CajaPage() {
  const { activePlaceId } = useRestaurant();
  const [state, setState] = useState<any>(null);
  const [series, setSeries] = useState<Record<string, string> | undefined>();
  const [charging, setCharging] = useState<any>(null);
  const [closing, setClosing] = useState(false);

  const load = useCallback(() => {
    if (!activePlaceId) return;
    ordersApi.cash(activePlaceId).then(setState).catch((err: Error) => { toast.error(err.message); setState((s: any) => s ?? { session: null, pending: [], receipts: [] }); });
  }, [activePlaceId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    // Las series las ve el supervisor; si el rol no alcanza, el cobro funciona igual sin mostrarlas.
    if (activePlaceId) ordersApi.getSettings(activePlaceId).then((s: any) => setSeries(s.receiptSeries)).catch(() => undefined);
  }, [activePlaceId]);
  useOrderStream(staffStreamUrl(activePlaceId), (event) => {
    if (event.type === 'tab.bill_requested') toast.warning('Llegó una precuenta para cobrar');
    load();
  });

  if (!state) {
    return (
      <div role="status" aria-label="Cargando" className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-card" />)}</div>
      </div>
    );
  }

  const { session, totals, pending, receipts } = state;
  const sales = totals ? totals.EFECTIVO + totals.TARJETA + totals.YAPE_PLIN : 0;

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Caja"
        subtitle="Control de ingresos, cobro de precuentas y emisión de comprobantes de pago."
        action={session && <Button variant="secondary" icon={DoorClosed} onClick={() => setClosing(true)}>Cerrar turno</Button>}
      />

      {!session ? (
        <OpenCashCard placeId={activePlaceId!} onOpened={load} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Apertura de caja" value={soles(session.openingAmount)} />
          <StatTile label="Ventas efectivo" value={soles(totals.EFECTIVO)} />
          <StatTile label="Ventas tarjeta" value={soles(totals.TARJETA)} />
          <StatTile label="Total acumulado" value={soles(session.openingAmount + sales)} />
        </div>
      )}

      <Card padding="lg" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-text">Precuentas pendientes por cobrar</h2>
          <Badge tone={pending.length ? 'warning' : 'neutral'}>{pending.length} pendientes</Badge>
        </div>
        {pending.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="No hay precuentas pendientes de cobro" description="Cuando un mozo o un cliente pida la cuenta, aparecerá aquí." headingLevel="h3" />
        ) : (
          <ul className="divide-y divide-border">
            {pending.map((p: any) => (
              <li key={p.tabId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold text-text">{p.tableName} · <span className="tabular-nums">{soles(p.due)}</span></p>
                  <p className="text-sm text-text-muted">
                    {p.precuenta ? `${DOC_LABEL[p.precuenta.docType as keyof typeof DOC_LABEL]}${p.precuenta.customerName ? ` · ${p.precuenta.customerName}` : ''}` : 'Pedida por el cliente'}
                    {p.requestedAt && ` · ${hour(p.requestedAt)}`}
                  </p>
                </div>
                <Button icon={Wallet} disabled={!session} onClick={() => setCharging(p)}>{session ? 'Cobrar' : 'Abre la caja para cobrar'}</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {session && (
        <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <Card padding="lg" className="min-w-0">
            <h2 className="text-lg font-semibold text-text">Transacciones de caja</h2>
            <p className="mb-3 text-sm text-text-muted">Comprobantes cobrados en el turno actual.</p>
            {receipts.length === 0 ? (
              <p className="text-sm text-text-muted">Todavía no hay comprobantes en este turno.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-text-muted">
                    <tr>{['Comprobante', 'Mesa', 'Cliente', 'Tipo', 'Método de pago', 'Monto', 'Hora'].map((h) => <th key={h} className="whitespace-nowrap px-2 py-2 font-medium">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {receipts.map((r: any) => (
                      <tr key={r.id}>
                        <td className="whitespace-nowrap px-2 py-2 font-mono text-primary-hover">{r.code}</td>
                        <td className="whitespace-nowrap px-2 py-2">{r.tableName ?? '—'}</td>
                        <td className="px-2 py-2">{r.customerName ?? 'Cliente genérico'}</td>
                        <td className="px-2 py-2"><Badge>{DOC_LABEL[r.docType as keyof typeof DOC_LABEL]}</Badge></td>
                        <td className="whitespace-nowrap px-2 py-2">{METHOD_LABEL[r.paymentMethod as CashMethod]}</td>
                        <td className="whitespace-nowrap px-2 py-2 font-semibold tabular-nums">{soles(r.total)}</td>
                        <td className="whitespace-nowrap px-2 py-2 tabular-nums">{hour(r.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-text">Distribución de pagos</h2>
            <p className="mb-4 text-sm text-text-muted">Porcentaje por medio de cobro.</p>
            <ul className="space-y-4">
              {METHODS.map((m) => {
                const pct = sales ? Math.round((totals[m.key] / sales) * 100) : 0;
                return (
                  <li key={m.key}>
                    <div className="mb-1 flex justify-between text-sm"><span>{m.label}</span><span className="font-semibold tabular-nums">{pct}%</span></div>
                    <div className="h-2 rounded-full bg-background" role="progressbar" aria-label={m.label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      )}

      {charging && <ChargeSheet placeId={activePlaceId!} pending={charging} series={series} onClose={() => setCharging(null)} onDone={() => { setCharging(null); load(); }} />}
      {closing && session && <CloseCashModal placeId={activePlaceId!} expectedCash={session.openingAmount + totals.EFECTIVO} onClose={() => setClosing(false)} onDone={() => { setClosing(false); load(); }} />}
    </div>
  );
}

function OpenCashCard({ placeId, onOpened }: { placeId: string; onOpened(): void }) {
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const open = async () => {
    setSaving(true);
    try { await ordersApi.cashOpen(placeId, toCents(amount)); toast.success('Caja abierta'); onOpened(); }
    catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };
  return (
    <Card padding="lg" className="max-w-md space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-text">Apertura de caja</h2>
        <p className="text-sm text-text-muted">Ingresa el efectivo con el que empiezas el turno.</p>
      </div>
      <Input label="Monto inicial (S/)" type="number" min={0} step="0.10" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <Button icon={Wallet} loading={saving} onClick={open}>Abrir caja</Button>
    </Card>
  );
}

function ChargeSheet({ placeId, pending, series, onClose, onDone }: { placeId: string; pending: any; series?: Record<string, string>; onClose(): void; onDone(): void }) {
  const [receipt, setReceipt] = useState<ReceiptRequest>(pending.precuenta ?? EMPTY_RECEIPT);
  const [method, setMethod] = useState<CashMethod>('EFECTIVO');
  const [received, setReceived] = useState('');
  const [saving, setSaving] = useState(false);
  const change = method === 'EFECTIVO' && received ? toCents(received) - pending.due : null;

  const charge = async () => {
    setSaving(true);
    try {
      const r = await ordersApi.cashCharge(placeId, { ...receipt, tabId: pending.tabId, method });
      toast.success(`Cobrado: ${r.code}. ${pending.tableName} liberada.`);
      onDone();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <Sheet open onClose={onClose} title={`Cobrar ${pending.tableName}`}>
      <div className="space-y-6 p-4">
        <p className="text-3xl font-semibold tabular-nums text-text">{soles(pending.due)}</p>
        <ReceiptFields value={receipt} onChange={setReceipt} series={series} />
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium text-text">Método de pago</legend>
          {METHODS.map((m) => (
            <label key={m.key} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-control border px-3 ${method === m.key ? 'border-primary bg-primary-soft' : 'border-border'}`}>
              <input type="radio" name="metodo" className="h-4 w-4 accent-primary" checked={method === m.key} onChange={() => setMethod(m.key)} />
              <m.icon size={20} aria-hidden /> <span className="text-sm text-text">{m.label}</span>
            </label>
          ))}
        </fieldset>
        {method === 'EFECTIVO' && (
          <div className="space-y-1">
            <Input label="Recibido (S/)" type="number" min={0} step="0.10" inputMode="decimal" value={received} onChange={(e) => setReceived(e.target.value)} />
            {change != null && <p className={`text-sm font-medium ${change < 0 ? 'text-danger' : 'text-text'}`}>{change < 0 ? `Faltan ${soles(-change)}` : `Vuelto: ${soles(change)}`}</p>}
          </div>
        )}
        <Button className="w-full" icon={Wallet} loading={saving} disabled={change != null && change < 0} onClick={charge}>Cobrar {soles(pending.due)}</Button>
      </div>
    </Sheet>
  );
}

function CloseCashModal({ placeId, expectedCash, onClose, onDone }: { placeId: string; expectedCash: number; onClose(): void; onDone(): void }) {
  const [counted, setCounted] = useState('');
  const [saving, setSaving] = useState(false);
  const diff = counted ? toCents(counted) - expectedCash : null;
  const close = async () => {
    setSaving(true);
    try {
      const r = await ordersApi.cashClose(placeId, counted ? toCents(counted) : undefined);
      toast.success(r.difference == null || r.difference === 0 ? 'Turno cerrado' : `Turno cerrado con diferencia de ${soles(r.difference)}`);
      onDone();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };
  return (
    <Modal open onClose={onClose} title="Cerrar turno" footer={<Button icon={DoorClosed} loading={saving} onClick={close}>Cerrar turno</Button>}>
      <div className="space-y-3">
        <p className="text-sm text-text">Efectivo esperado en caja (apertura + ventas en efectivo): <span className="font-semibold tabular-nums">{soles(expectedCash)}</span></p>
        <Input label="Efectivo contado (S/, opcional)" type="number" min={0} step="0.10" inputMode="decimal" value={counted} onChange={(e) => setCounted(e.target.value)} />
        {diff != null && <p className={`text-sm font-medium ${diff === 0 ? 'text-success' : 'text-danger'}`}>{diff === 0 ? 'Cuadra exacto' : diff > 0 ? `Sobran ${soles(diff)}` : `Faltan ${soles(-diff)}`}</p>}
      </div>
    </Modal>
  );
}
