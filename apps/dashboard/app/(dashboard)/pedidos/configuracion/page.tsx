'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { QRCodeCanvas } from 'qrcode.react';
import { ordersApi } from '../../../../lib/api-client';
import { useRestaurant } from '../../../../context/RestaurantContext';

export default function OrderSettingsPage() {
  const { activePlaceId } = useRestaurant();
  const [settings, setSettings] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [secret, setSecret] = useState('');
  const [newTable, setNewTable] = useState({ name: '', capacity: 4 });

  const load = useCallback(() => {
    if (!activePlaceId) return;
    ordersApi.getSettings(activePlaceId).then(setSettings).catch((err: Error) => toast.error(err.message));
    ordersApi.tables(activePlaceId).then(setTables).catch(() => undefined);
  }, [activePlaceId]);
  useEffect(() => { load(); }, [load]);

  if (!settings) return null;
  const set = (patch: Record<string, unknown>) => setSettings({ ...settings, ...patch });

  const save = async () => {
    try {
      // El backend rechaza campos que no están en el DTO (forbidNonWhitelisted): se quitan los de solo lectura.
      const { culqiConfigured, culqiPublicKeyLast4, webhookUrl, placeId, updatedAt, wuarikesCommissionPct, deliveryFeeSoles, ...body } = settings;
      const deliveryFee = Math.round(Number(deliveryFeeSoles ?? settings.deliveryFee / 100) * 100);
      const saved = await ordersApi.updateSettings(activePlaceId!, { ...body, deliveryFee, ...(secret ? { culqiSecretKey: secret } : {}) });
      setSettings(saved); setSecret(''); toast.success('Configuración guardada');
    } catch (err: any) { toast.error(err.message); }
  };

  const testKeys = async () => {
    try {
      const r = await ordersApi.testCulqi(activePlaceId!);
      r.ok ? toast.success(r.message) : toast.error(r.message);
    } catch (err: any) {
      toast.error(err.message || 'No se pudieron probar las llaves');
    }
  };

  const addTable = async () => {
    if (!newTable.name.trim()) { toast.warning('Este campo es obligatorio'); return; }
    await ordersApi.createTable(activePlaceId!, newTable).catch((err: Error) => toast.error(err.message));
    setNewTable({ name: '', capacity: 4 }); load();
  };

  const downloadQr = (tableId: string, name: string) => {
    const canvas = document.getElementById(`qr-${tableId}`) as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `QR-${name}.png`;
    link.click();
  };

  const field = 'w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm';

  return (
    <div className="max-w-3xl space-y-10 pb-20">
      <h1 className="text-3xl font-black text-[#1A1A1A]">Configurar pedidos</h1>

      <section className="space-y-4 rounded-3xl border bg-white p-6">
        <label className="flex items-center gap-3 font-bold"><input type="checkbox" checked={settings.ordersEnabled} onChange={(e) => set({ ordersEnabled: e.target.checked })} /> Recibir pedidos (carta con QR y WhatsApp)</label>
        <fieldset className="space-y-2">
          <legend className="text-sm font-bold">Cobro en mesa</legend>
          <label className="flex gap-2"><input type="radio" checked={settings.tablePaymentMode === 'CUENTA_ABIERTA'} onChange={() => set({ tablePaymentMode: 'CUENTA_ABIERTA' })} /> Cuenta abierta: piden en rondas y pagan al final</label>
          <label className="flex gap-2"><input type="radio" checked={settings.tablePaymentMode === 'PREPAGO'} onChange={() => set({ tablePaymentMode: 'PREPAGO' })} /> Pago por pedido: pagan antes de que vaya a cocina</label>
        </fieldset>
        <label className="flex items-center gap-3"><input type="checkbox" checked={settings.cashPaymentEnabled} onChange={(e) => set({ cashPaymentEnabled: e.target.checked })} /> Aceptar efectivo o POS en caja</label>
        <label className="flex items-center gap-3"><input type="checkbox" checked={settings.pricesIncludeIgv} onChange={(e) => set({ pricesIncludeIgv: e.target.checked })} /> Los precios de mi carta incluyen IGV</label>
        <label className="block text-sm font-bold">Tiempo de preparación estimado (min)
          <input type="number" min={1} max={180} className={field} value={settings.prepTimeMin} onChange={(e) => set({ prepTimeMin: +e.target.value })} />
        </label>
      </section>

      <section className="space-y-4 rounded-3xl border bg-white p-6">
        <h2 className="text-lg font-black">WhatsApp: recojo y delivery</h2>
        <label className="flex items-center gap-3"><input type="checkbox" checked={settings.pickupEnabled} onChange={(e) => set({ pickupEnabled: e.target.checked })} /> Recojo en el local</label>
        <label className="flex items-center gap-3"><input type="checkbox" checked={settings.deliveryEnabled} onChange={(e) => set({ deliveryEnabled: e.target.checked })} /> Delivery</label>
        {settings.deliveryEnabled && (
          <label className="block text-sm font-bold">Tarifa de delivery (S/)
            <input type="number" min={0} step="0.5" className={field} value={settings.deliveryFeeSoles ?? settings.deliveryFee / 100} onChange={(e) => set({ deliveryFeeSoles: e.target.value })} />
          </label>
        )}
      </section>

      <section className="space-y-4 rounded-3xl border bg-white p-6">
        <h2 className="text-lg font-black">¿Dónde recibes el dinero?</h2>
        <label className="flex gap-2 opacity-50"><input type="radio" disabled checked={settings.paymentDestination === 'WUARIKES'} /> A través de Wuarikes (próximamente: requiere validación legal y de Culqi, ver spec)</label>
        <label className="flex gap-2"><input type="radio" checked={settings.paymentDestination === 'LOCAL'} onChange={() => set({ paymentDestination: 'LOCAL' })} /> En mi propia cuenta Culqi</label>
        {settings.paymentDestination === 'LOCAL' && (
          <div className="space-y-3">
            <label className="block text-sm font-bold">Llave pública (pk_...)
              <input className={field} value={settings.culqiPublicKey ?? ''} onChange={(e) => set({ culqiPublicKey: e.target.value })} />
            </label>
            <label className="block text-sm font-bold">Llave secreta (sk_...) {settings.culqiConfigured && <span className="font-normal text-green-700">· configurada</span>}
              <input className={field} type="password" autoComplete="off" placeholder={settings.culqiConfigured ? 'Déjala vacía para mantener la actual' : ''} value={secret} onChange={(e) => setSecret(e.target.value)} />
            </label>
            <p className="text-sm">Registra este webhook en tu CulqiPanel (Eventos → Webhooks): <code className="break-all rounded bg-gray-100 px-2">{settings.webhookUrl}</code></p>
            <button onClick={testKeys} className="rounded-2xl border px-4 py-2 text-sm font-bold">Probar llaves</button>
          </div>
        )}
      </section>

      <button onClick={save} className="rounded-2xl bg-[#F26122] px-8 py-4 font-black text-white">Guardar configuración</button>

      <section className="space-y-4 rounded-3xl border bg-white p-6">
        <h2 className="text-lg font-black">Mesas y códigos QR</h2>
        <div className="flex flex-wrap gap-2">
          <input aria-label="Nombre de la mesa" placeholder="Mesa 1" className="rounded-2xl border px-4 py-3 text-sm" value={newTable.name} onChange={(e) => setNewTable({ ...newTable, name: e.target.value })} />
          <input aria-label="Personas" type="number" min={1} max={40} className="w-24 rounded-2xl border px-4 py-3 text-sm" value={newTable.capacity} onChange={(e) => setNewTable({ ...newTable, capacity: +e.target.value })} />
          <button onClick={addTable} className="rounded-2xl bg-[#1A1A1A] px-5 py-3 text-sm font-bold text-white">Agregar mesa</button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {tables.map((t) => (
            <div key={t.id} className="flex items-center gap-4 rounded-2xl border p-4">
              <QRCodeCanvas id={`qr-${t.id}`} value={t.qrUrl} size={96} marginSize={2} />
              <div className="space-y-1 text-sm">
                <p className="font-black">{t.name} · {t.capacity} personas {!t.active && '(inactiva)'}</p>
                {t.pin && <p className="font-mono font-bold">PIN actual: {t.pin} <span className="font-sans font-normal text-gray-500">(cambia solo al pagar la cuenta o cerrar la mesa)</span></p>}
                <button onClick={() => downloadQr(t.id, t.name)} className="block font-bold text-[#F26122]">Descargar QR</button>
                <button onClick={() => ordersApi.updateTable(activePlaceId!, t.id, { active: !t.active }).then(load)} className="block">{t.active ? 'Desactivar' : 'Activar'}</button>
                <button onClick={() => ordersApi.regenerateQr(activePlaceId!, t.id).then(load)} className="block text-gray-500">Generar QR nuevo (invalida el impreso)</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
