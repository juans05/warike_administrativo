'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { Download, LayoutGrid, Plus, Power, Printer, RefreshCw } from 'lucide-react';
import { ordersApi } from '../../lib/api-client';
import { useRestaurant } from '../../context/RestaurantContext';
import { Badge, Button, Card, EmptyState, Input } from '../ui';

/** Solo panel (Pedidos → configuración): alta de mesas y sus QR. */
export function TablesQrCard({ placeId, tables, onChanged }: { placeId: string; tables: any[]; onChanged(): void }) {
  const { activePlace } = useRestaurant();
  const [newTable, setNewTable] = useState({ name: '', capacity: 4 });
  const [bulk, setBulk] = useState({ prefix: 'Mesa', from: 1, to: 10, capacity: 4 });

  const addTable = async () => {
    if (!newTable.name.trim()) { toast.warning('Este campo es obligatorio'); return; }
    await ordersApi.createTable(placeId, newTable).catch((err: Error) => toast.error(err.message));
    setNewTable({ name: '', capacity: 4 }); onChanged();
  };

  const addTables = async () => {
    if (bulk.to < bulk.from) { toast.warning('El número final debe ser mayor o igual al inicial'); return; }
    if (bulk.to - bulk.from >= 100) { toast.warning('Crea como máximo 100 mesas por vez'); return; }
    try {
      const created = await ordersApi.createTables(placeId, bulk);
      toast.success(created.length ? `${created.length} mesas creadas` : 'Esas mesas ya existían');
      onChanged();
    } catch (err: any) { toast.error(err.message); }
  };

  const downloadQr = (tableId: string, name: string) => {
    const canvas = document.getElementById(`qr-${tableId}`) as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `QR-${name}.png`;
    link.click();
  };

  return (
    <Card padding="lg" className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-text">Mesas y códigos QR</h2>
        <p className="mt-1 text-sm text-text-muted">Cada mesa tiene su QR. El PIN cambia solo al pagar la cuenta o cerrar la mesa.</p>
      </div>

      <div className="grid items-end gap-3 sm:grid-cols-[1fr_120px_auto]">
        <Input label="Nombre de la mesa" placeholder="Mesa 1" value={newTable.name} onChange={(e) => setNewTable({ ...newTable, name: e.target.value })} />
        <Input label="Personas" type="number" min={1} max={40} value={newTable.capacity} onChange={(e) => setNewTable({ ...newTable, capacity: +e.target.value })} />
        <Button variant="secondary" icon={Plus} onClick={addTable}>Agregar mesa</Button>
      </div>

      <fieldset className="space-y-3 rounded-card border border-border p-4">
        <legend className="px-1 text-sm font-semibold text-text">Varias a la vez</legend>
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_90px_90px_100px_auto]">
          <Input label="Nombre base" value={bulk.prefix} maxLength={30} onChange={(e) => setBulk({ ...bulk, prefix: e.target.value })} />
          <Input label="Desde" type="number" min={1} value={bulk.from} onChange={(e) => setBulk({ ...bulk, from: +e.target.value })} />
          <Input label="Hasta" type="number" min={1} value={bulk.to} onChange={(e) => setBulk({ ...bulk, to: +e.target.value })} />
          <Input label="Personas" type="number" min={1} max={40} value={bulk.capacity} onChange={(e) => setBulk({ ...bulk, capacity: +e.target.value })} />
          <Button variant="secondary" icon={Plus} onClick={addTables}>Crear {bulk.prefix} {bulk.from} a {bulk.to}</Button>
        </div>
      </fieldset>

      {tables.some((t) => t.active) && (
        <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Imprimir todos los QR (o guardar como PDF)</Button>
      )}

      {tables.length === 0 ? (
        <EmptyState icon={LayoutGrid} headingLevel="h3" title="Aún no hay mesas" description="Agrega tu primera mesa para generar su QR." />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {tables.map((t) => (
            <li key={t.id} className="flex items-start gap-4 rounded-card border border-border p-4">
              <QRCodeCanvas id={`qr-${t.id}`} value={t.qrUrl} size={96} marginSize={2} />
              <div className="min-w-0 space-y-2 text-sm">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-text">
                  {t.name} · {t.capacity} personas {!t.active && <Badge>Inactiva</Badge>}
                </p>
                {t.pin && <p className="font-mono font-semibold text-text">PIN actual: {t.pin}</p>}
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="secondary" icon={Download} onClick={() => downloadQr(t.id, t.name)}>Descargar QR</Button>
                  <Button size="sm" variant="ghost" icon={Power} onClick={() => ordersApi.updateTable(placeId, t.id, { active: !t.active }).then(onChanged)}>
                    {t.active ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button size="sm" variant="ghost" icon={RefreshCw} onClick={() => ordersApi.regenerateQr(placeId, t.id).then(onChanged)}>
                    Generar QR nuevo
                  </Button>
                </div>
                <p className="text-xs text-text-muted">Generar QR nuevo invalida el que ya imprimiste.</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Hoja para imprimir o "Guardar como PDF": 6 QR por A4, solo mesas activas. Va en <body> porque la
          tarjeta vive dentro de un Sheet con scroll, que cortaría la impresión a una sola página. */}
      {typeof document !== 'undefined' && createPortal(<>
      <style>{`@media print { @page { size: A4; margin: 10mm; } body * { visibility: hidden; } dialog::backdrop { display: none; } #qr-sheet, #qr-sheet * { visibility: visible; } #qr-sheet { position: absolute; left: 0; top: 0; width: 100%; } }`}</style>
      <div id="qr-sheet" className="hidden grid-cols-2 gap-6 print:grid">
        {tables.filter((t) => t.active).map((t) => (
          <div key={t.id} className="flex flex-col items-center gap-2 rounded-xl border-2 border-black p-4 text-center text-black" style={{ breakInside: 'avoid' }}>
            <p className="text-sm font-bold">{activePlace?.name}</p>
            <QRCodeSVG value={t.qrUrl} size={180} marginSize={2} />
            <p className="text-2xl font-black">{t.name}</p>
            <p className="text-xs">Escanea para ver la carta y pedir desde tu mesa</p>
          </div>
        ))}
      </div>
      </>, document.body)}
    </Card>
  );
}
