'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { publicOrdersApi } from '../../lib/api-client';
import { soles } from '../../lib/orders-format';
import CulqiPay from './CulqiPay';

interface Line { dishId: string; name: string; unitPrice: number; quantity: number; note: string }
interface TableInfo { place: { id: string; name: string }; table: { name: string }; ordering: { enabled: boolean; tablePaymentMode: 'CUENTA_ABIERTA' | 'PREPAGO'; cashPaymentEnabled: boolean }; pinRequired: boolean }

const Ctx = createContext<{ enabled: boolean; add: (dish: { id: string; name: string; price: string | null }) => void } | null>(null);

export const useTableOrdering = () => useContext(Ctx);

const toCents = (price: string | null) => Math.round(Number(price ?? 0) * 100);

export function TableOrderingProvider({ qrToken, children }: { qrToken: string | null; children: React.ReactNode }) {
  const [info, setInfo] = useState<TableInfo | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{ token: string; total: number } | null>(null);
  // PIN de la mesa: lo da el personal, cambia al pagar la cuenta completa o al cerrar la mesa. Se recuerda en este celular.
  const pinKey = `wuarike:pin:${qrToken}`;
  const [pin, setPin] = useState('');
  useEffect(() => {
    if (!qrToken) return;
    try { setPin(localStorage.getItem(pinKey) ?? ''); } catch { /* sin storage: se pide cada vez */ }
  }, [qrToken, pinKey]);

  useEffect(() => {
    if (!qrToken) return;
    publicOrdersApi.table(qrToken).then(setInfo).catch(() => toast.error('Este código QR ya no es válido. Pide ayuda al personal.'));
  }, [qrToken]);

  const enabled = !!info?.ordering.enabled;
  const add = useCallback((dish: { id: string; name: string; price: string | null }) => {
    if (!dish.price) return;
    setLines((prev) => {
      const found = prev.find((l) => l.dishId === dish.id);
      if (found) return prev.map((l) => (l.dishId === dish.id ? { ...l, quantity: Math.min(50, l.quantity + 1) } : l));
      return [...prev, { dishId: dish.id, name: dish.name, unitPrice: toCents(dish.price), quantity: 1, note: '' }];
    });
    toast.success(`${dish.name} añadido`);
  }, []);

  const total = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const setQty = (dishId: string, delta: number) =>
    setLines((prev) => prev.flatMap((l) => (l.dishId !== dishId ? [l] : l.quantity + delta <= 0 ? [] : [{ ...l, quantity: Math.min(50, l.quantity + delta) }])));

  const send = async () => {
    if (!qrToken || !lines.length) return;
    if (!/^\d{4}$/.test(pin)) { toast.warning('Ingresa el PIN de 4 dígitos de tu mesa. Pídelo al personal.'); return; }
    setSending(true);
    try {
      const result = await publicOrdersApi.createOrder({
        qrToken, pin, customerName: name || undefined, customerPhone: phone || undefined,
        items: lines.map((l) => ({ dishId: l.dishId, quantity: l.quantity, ...(l.note ? { note: l.note } : {}) })),
      });
      try {
        localStorage.setItem(pinKey, pin);
        if (result.tabToken) localStorage.setItem(`wuarike:tab:${qrToken}`, result.tabToken);
      } catch { /* sin storage: igual se redirige */ }
      if (result.requiresPayment) { setPendingPayment({ token: result.orderToken, total: result.total }); return; }
      setLines([]);
      window.location.href = `/cuenta/${result.tabToken}`;
    } catch (err: any) {
      if (/PIN/i.test(err.message || '')) {
        setPin('');
        try { localStorage.removeItem(pinKey); } catch { /* nada */ }
      }
      toast.error(err.message || 'No se pudo enviar el pedido');
    } finally {
      setSending(false);
    }
  };

  const value = useMemo(() => ({ enabled, add }), [enabled, add]);
  const tabToken = (qrToken && typeof window !== 'undefined' ? (() => { try { return localStorage.getItem(`wuarike:tab:${qrToken}`); } catch { return null; } })() : null);

  return (
    <Ctx.Provider value={value}>
      {children}
      {enabled && (
        <div className="fixed inset-x-0 bottom-4 z-40 mx-auto flex max-w-md justify-center gap-2 px-4">
          {tabToken && info?.ordering.tablePaymentMode === 'CUENTA_ABIERTA' && (
            <a href={`/cuenta/${tabToken}`} className="rounded-full bg-white px-5 py-4 text-sm font-bold text-[#1A1A1A] shadow-xl">Ver mi cuenta</a>
          )}
          {lines.length > 0 && (
            <button onClick={() => setOpen(true)} className="flex flex-1 items-center justify-between rounded-full bg-[#F26122] px-6 py-4 text-sm font-bold text-white shadow-xl" aria-label="Ver pedido">
              <span className="flex items-center gap-2"><ShoppingBag size={18} /> {lines.reduce((s, l) => s + l.quantity, 0)} en tu pedido</span>
              <span>{soles(total)}</span>
            </button>
          )}
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" role="dialog" aria-modal="true" aria-label="Tu pedido">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Tu pedido · {info?.table.name}</h2>
              <button onClick={() => setOpen(false)} aria-label="Cerrar"><X /></button>
            </div>
            {pendingPayment ? (
              <CulqiPay target={{ orderToken: pendingPayment.token }} customerName={name} label={`Pagar ${soles(pendingPayment.total)} y enviar a cocina`}
                onPaid={() => { setLines([]); window.location.href = `/pedido/${pendingPayment.token}`; }} />
            ) : (
              <>
                <label className="block space-y-1">
                  <span className="text-sm font-semibold">PIN de tu mesa</span>
                  <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" autoComplete="off"
                    placeholder="4 dígitos" aria-label="PIN de la mesa" className="w-full rounded-xl border border-gray-200 px-3 py-3 text-center text-lg tracking-[0.5em]" />
                  <span className="block text-xs text-gray-500">Pídelo al personal del local. Solo se pide una vez.</span>
                </label>
                <ul className="space-y-4">
                  {lines.map((l) => (
                    <li key={l.dishId} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">{l.name}</span>
                        <div className="flex items-center gap-3">
                          <button onClick={() => setQty(l.dishId, -1)} aria-label={`Quitar uno de ${l.name}`} className="rounded-full border p-1"><Minus size={16} /></button>
                          <span className="w-5 text-center font-bold">{l.quantity}</span>
                          <button onClick={() => setQty(l.dishId, 1)} aria-label={`Agregar uno de ${l.name}`} className="rounded-full border p-1"><Plus size={16} /></button>
                        </div>
                      </div>
                      <input value={l.note} maxLength={200} placeholder="Nota para cocina (ej. sin cebolla)" aria-label={`Nota para ${l.name}`}
                        onChange={(e) => setLines((prev) => prev.map((x) => (x.dishId === l.dishId ? { ...x, note: e.target.value } : x)))}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                    </li>
                  ))}
                </ul>
                <input value={name} maxLength={120} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre (opcional)" aria-label="Tu nombre" className="w-full rounded-xl border border-gray-200 px-3 py-3" />
                <input value={phone} maxLength={30} inputMode="tel" onChange={(e) => setPhone(e.target.value)} placeholder="Tu WhatsApp para sumar puntos (opcional)" aria-label="Tu WhatsApp" className="w-full rounded-xl border border-gray-200 px-3 py-3" />
                <div className="flex items-center justify-between text-lg font-bold"><span>Total</span><span>{soles(total)}</span></div>
                <button onClick={send} disabled={sending} className="w-full rounded-2xl bg-[#F26122] py-4 text-base font-bold text-white disabled:opacity-60">
                  {sending ? 'Enviando...' : info?.ordering.tablePaymentMode === 'PREPAGO' ? 'Continuar al pago' : 'Enviar a cocina'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function AddToCartButton({ dish, className = '' }: { dish: { id: string; name: string; price: string | null }; className?: string }) {
  const ordering = useTableOrdering();
  if (!ordering?.enabled || !dish.price) return null;
  return (
    <button onClick={(e) => { e.stopPropagation(); ordering.add(dish); }}
      className={`inline-flex items-center gap-1 rounded-full bg-[#F26122] px-4 py-2 text-sm font-bold text-white ${className}`} aria-label={`Añadir ${dish.name} al pedido`}>
      <Plus size={16} /> Añadir
    </button>
  );
}
