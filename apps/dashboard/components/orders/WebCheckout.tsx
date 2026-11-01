'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { publicOrdersApi, type WebOrdering } from '../../lib/api-client';
import { soles } from '../../lib/orders-format';
import { Input, Select, Sheet } from '../ui';

type Mode = 'SALA' | 'RECOJO' | 'DELIVERY';
type Pay = 'ONLINE' | 'ENTREGA';

interface Props {
  open: boolean;
  onClose(): void;
  placeId: string;
  web: WebOrdering;
  lines: { dishId: string; quantity: number; note: string }[];
  /** Subtotal en céntimos; el envío se suma aquí solo para mostrarlo, el backend calcula el total real. */
  total: number;
  /** Lista editable del carrito (la misma del pedido en mesa). */
  cartList: React.ReactNode;
  onSent(): void;
}

const MODE_LABEL: Record<Mode, string> = { SALA: 'Comer aquí', RECOJO: 'Para llevar', DELIVERY: 'Delivery' };
const pinKey = (qrToken: string) => `wuarike:pin:${qrToken}`;
const tabKey = (qrToken: string) => `wuarike:tab:${qrToken}`;

/** Pedido desde la carta abierta por el QR general o NFC: comer aquí (mesa + PIN), para llevar o delivery. */
export default function WebCheckout({ open, onClose, placeId, web, lines, total, cartList, onSent }: Props) {
  const modes = (['SALA', 'RECOJO', 'DELIVERY'] as Mode[]).filter((m) => (m === 'SALA' ? web.dineIn : m === 'RECOJO' ? web.pickup : web.delivery));
  const [mode, setMode] = useState<Mode | null>(modes.length === 1 ? modes[0] : null);
  const [tables, setTables] = useState<{ name: string; qrToken: string }[] | null>(null);
  const [tableQr, setTableQr] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [reference, setReference] = useState('');
  const [pay, setPay] = useState<Pay>(web.payOnline ? 'ONLINE' : 'ENTREGA');
  const [sending, setSending] = useState(false);
  // El <dialog> del Sheet tapa los toasts (capa superior), por eso cada aviso también se muestra dentro.
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode !== 'SALA' || tables) return;
    publicOrdersApi.placeTables(placeId).then(setTables).catch((err: Error) => {
      const message = err.message || 'No se pudieron cargar las mesas';
      setError(message);
      toast.error(message);
    });
  }, [mode, tables, placeId]);

  const pickTable = (qr: string) => {
    setTableQr(qr);
    try { setPin(qr ? localStorage.getItem(pinKey(qr)) ?? '' : ''); } catch { setPin(''); }
  };

  const shipping = mode === 'DELIVERY' ? web.deliveryFee : 0;
  const payLater = mode === 'DELIVERY' ? 'Pagar al recibir' : 'Pagar al recoger';
  const goesToPayment = (mode === 'RECOJO' || mode === 'DELIVERY') && pay === 'ONLINE';

  const send = async () => {
    if (!lines.length || !mode) return;
    const fail = (message: string, level: 'warning' | 'error' = 'error') => { setError(message); toast[level](message); };
    setError('');
    if (mode === 'SALA') {
      if (!tableQr) return fail('Elige tu mesa', 'warning');
      if (!/^\d{4}$/.test(pin)) return fail('Ingresa el PIN de 4 dígitos de tu mesa. Pídelo al personal.', 'warning');
    } else {
      if (!name.trim()) return fail('Ingresa tu nombre', 'warning');
      if (phone.replace(/\D/g, '').length < 9) return fail('Ingresa un celular válido de 9 dígitos', 'warning');
      if (mode === 'DELIVERY' && !address.trim()) return fail('Ingresa la dirección de entrega', 'warning');
    }
    const items = lines.map((l) => ({ dishId: l.dishId, quantity: l.quantity, ...(l.note ? { note: l.note } : {}) }));
    setSending(true);
    try {
      if (mode === 'SALA') {
        // Mismo flujo que el QR de la mesa: el PIN y el tabToken se recuerdan con las mismas claves.
        const result = await publicOrdersApi.createOrder({
          qrToken: tableQr, pin, customerName: name.trim() || undefined, customerPhone: phone.trim() || undefined, items,
        });
        try {
          localStorage.setItem(pinKey(tableQr), pin);
          if (result.tabToken) localStorage.setItem(tabKey(tableQr), result.tabToken);
        } catch { /* sin storage: igual se redirige */ }
        onSent();
        window.location.href = result.requiresPayment ? `/pagar/${result.orderToken}` : result.tabToken ? `/cuenta/${result.tabToken}` : `/pedido/${result.orderToken}`;
      } else {
        const result = await publicOrdersApi.createWebOrder(placeId, {
          fulfillment: mode, items, customerName: name.trim(), customerPhone: phone.trim(),
          ...(mode === 'DELIVERY' ? { deliveryAddress: address.trim(), ...(reference.trim() ? { deliveryReference: reference.trim() } : {}) } : {}),
          payOnDelivery: pay === 'ENTREGA',
        });
        onSent();
        window.location.href = result.requiresPayment ? `/pagar/${result.orderToken}` : `/pedido/${result.orderToken}`;
      }
    } catch (err: any) {
      if (mode === 'SALA' && /PIN/i.test(err.message || '')) {
        setPin('');
        try { localStorage.removeItem(pinKey(tableQr)); } catch { /* nada */ }
      }
      fail(err.message || 'No se pudo enviar el pedido');
    } finally {
      setSending(false);
    }
  };

  const radio = (label: string, checked: boolean, onChange: () => void) => (
    <label key={label} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm font-semibold ${checked ? 'border-[#F26122] bg-[#F26122]/10' : 'border-gray-200'}`}>
      <input type="radio" className="h-4 w-4 shrink-0 accent-[#F26122]" checked={checked} onChange={onChange} />
      {label}
    </label>
  );

  return (
    <Sheet open={open} onClose={onClose} title="Tu pedido">
      <div className="space-y-5 p-4">
        {lines.length === 0 ? <p className="text-sm text-gray-500">Tu pedido está vacío. Cierra y añade platos de la carta.</p> : cartList}

        <fieldset className="space-y-2">
          <legend className="mb-1 text-base font-bold">¿Cómo lo quieres?</legend>
          {modes.map((m) => radio(MODE_LABEL[m], mode === m, () => { setMode(m); setError(''); }))}
        </fieldset>

        {mode === 'SALA' && (
          <div className="space-y-3">
            <Select label="Tu mesa" value={tableQr} onChange={(e) => pickTable(e.target.value)}>
              <option value="">{tables ? 'Elige tu mesa' : 'Cargando mesas...'}</option>
              {tables?.map((t) => <option key={t.qrToken} value={t.qrToken}>{t.name}</option>)}
            </Select>
            <Input label="PIN de tu mesa" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" autoComplete="off"
              placeholder="4 dígitos" hint="Pídelo al personal del local. Solo se pide una vez." className="text-center tracking-[0.5em]" />
            <Input label="Tu nombre (opcional)" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
            <Input label="Tu WhatsApp para sumar puntos (opcional)" value={phone} maxLength={30} inputMode="tel" onChange={(e) => setPhone(e.target.value)} />
          </div>
        )}

        {(mode === 'RECOJO' || mode === 'DELIVERY') && (
          <div className="space-y-3">
            <Input label="Tu nombre" value={name} maxLength={120} autoComplete="name" onChange={(e) => setName(e.target.value)} />
            <Input label="Tu celular" value={phone} maxLength={30} inputMode="tel" autoComplete="tel" onChange={(e) => setPhone(e.target.value)} />
            {mode === 'DELIVERY' && (
              <>
                <Input label="Dirección de entrega" value={address} maxLength={300} autoComplete="street-address" onChange={(e) => setAddress(e.target.value)} />
                <Input label="Referencia (opcional)" value={reference} maxLength={200} placeholder="Ej. casa verde, frente al parque" onChange={(e) => setReference(e.target.value)} />
                <p className="text-sm text-gray-600">Envío {web.deliveryFee > 0 ? soles(web.deliveryFee) : 'gratis'}{web.deliveryNote ? ` · ${web.deliveryNote}` : ''}</p>
              </>
            )}
            {web.payOnline && web.payOnDelivery ? (
              <fieldset className="space-y-2">
                <legend className="mb-1 text-sm font-semibold">¿Cómo pagas?</legend>
                {radio('Pagar ahora', pay === 'ONLINE', () => setPay('ONLINE'))}
                {radio(payLater, pay === 'ENTREGA', () => setPay('ENTREGA'))}
              </fieldset>
            ) : (
              <p className="text-sm text-gray-600">{web.payOnline ? 'Pagas ahora, en línea, al enviar el pedido.' : `${payLater}. El local confirma tu pedido primero.`}</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-lg font-bold"><span>Total</span><span>{soles(total + shipping)}</span></div>
        {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}
        <button onClick={send} disabled={sending || !mode || !lines.length} className="w-full rounded-2xl bg-[#F26122] py-4 text-base font-bold text-white disabled:opacity-60">
          {sending ? 'Enviando...' : goesToPayment ? 'Continuar al pago' : 'Enviar pedido'}
        </button>
      </div>
    </Sheet>
  );
}
