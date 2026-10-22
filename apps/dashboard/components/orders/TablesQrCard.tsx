'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, LayoutGrid, Plus, Power, RefreshCw } from 'lucide-react';
import { ordersApi } from '../../lib/api-client';
import { Badge, Button, Card, EmptyState, Input } from '../ui';

/** Solo panel (Pedidos → configuración): alta de mesas y sus QR. */
export function TablesQrCard({ placeId, tables, onChanged }: { placeId: string; tables: any[]; onChanged(): void }) {
  const [newTable, setNewTable] = useState({ name: '', capacity: 4 });

  const addTable = async () => {
    if (!newTable.name.trim()) { toast.warning('Este campo es obligatorio'); return; }
    await ordersApi.createTable(placeId, newTable).catch((err: Error) => toast.error(err.message));
    setNewTable({ name: '', capacity: 4 }); onChanged();
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
    </Card>
  );
}
