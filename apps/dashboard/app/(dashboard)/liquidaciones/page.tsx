'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ordersApi } from '../../../lib/api-client';
import { soles } from '../../../lib/orders-format';

const lastMonth = () => { const d = new Date(); d.setMonth(d.getMonth() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

export default function PayoutsPage() {
  const [period, setPeriod] = useState(lastMonth());
  const [rows, setRows] = useState<any[]>([]);
  const load = useCallback(() => ordersApi.adminPayouts(period).then(setRows).catch((err: Error) => toast.error(err.message)), [period]);
  useEffect(() => { load(); }, [load]);

  const generate = async () => { const created = await ordersApi.adminGeneratePayouts(period); toast.success(`${created.length} liquidaciones nuevas`); load(); };
  const pay = async (id: string) => {
    const reference = prompt('N.º de operación de la transferencia:');
    if (!reference) return;
    await ordersApi.adminPayPayout(id, reference); load();
  };

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-3xl font-black text-[#1A1A1A]">Liquidaciones de ventas</h1>
      <div className="flex gap-3">
        <input type="month" aria-label="Mes" value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-2xl border px-4 py-3" />
        <button onClick={generate} className="rounded-2xl bg-[#1A1A1A] px-5 py-3 font-bold text-white">Generar del mes</button>
      </div>
      <table className="w-full rounded-3xl border bg-white text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="p-3">Local</th><th className="p-3">Bruto</th><th className="p-3">Comisión</th><th className="p-3">Culqi</th><th className="p-3">Neto</th><th className="p-3">Estado</th><th className="p-3" /></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-3 font-mono text-xs">{r.placeId}</td><td className="p-3">{soles(r.gross)}</td><td className="p-3">{soles(r.commission)}</td><td className="p-3">{soles(r.culqiFees)}</td>
              <td className="p-3 font-bold">{soles(r.net)}</td><td className="p-3">{r.status}{r.reference && ` · ${r.reference}`}</td>
              <td className="p-3">{r.status === 'BORRADOR' && <button onClick={() => pay(r.id)} className="font-bold text-green-700">Marcar pagada</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
