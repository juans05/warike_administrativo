'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { toast } from 'sonner';
import { publicOrdersApi } from '../../lib/api-client';
import { soles } from '../../lib/orders-format';

declare global {
  interface Window { CulqiCheckout: any }
}

interface Props {
  target: { orderToken?: string; tabToken?: string };
  customerName?: string;
  onPaid: () => void;
  label?: string;
}

export default function CulqiPay({ target, customerName, onPaid, label = 'Pagar' }: Props) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [waitingCip, setWaitingCip] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopPolling = () => { if (timer.current) clearInterval(timer.current); timer.current = null; };
  useEffect(() => stopPolling, []);

  const waitForConfirmation = (paymentId: string) => {
    setWaitingCip(true);
    stopPolling();
    timer.current = setInterval(async () => {
      const { status } = await publicOrdersApi.paymentStatus(paymentId).catch(() => ({ status: 'PENDIENTE' }));
      if (status === 'PAGADO') { stopPolling(); setWaitingCip(false); onPaid(); }
      if (status === 'EXPIRADO' || status === 'FALLIDO') { stopPolling(); setWaitingCip(false); toast.error('El código de pago venció'); }
    }, 5000);
  };

  const pay = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) { toast.warning('Ingresa un correo válido para tu comprobante'); return; }
    if (!window.CulqiCheckout) { toast.warning('Cargando procesador de pagos...'); return; }
    setBusy(true);
    try {
      const intent = await publicOrdersApi.paymentIntent({ ...target, email, name: customerName });
      const checkout = new window.CulqiCheckout(intent.publicKey, {
        settings: { title: intent.title, currency: 'PEN', amount: intent.amount, ...(intent.culqiOrderId ? { order: intent.culqiOrderId } : {}) },
        client: { email },
        options: {
          lang: 'auto', installments: false, modal: true,
          paymentMethods: { tarjeta: true, yape: true, billetera: false, bancaMovil: !!intent.culqiOrderId, agente: !!intent.culqiOrderId, cuotealo: false },
          paymentMethodsSort: ['tarjeta', 'yape', 'bancaMovil', 'agente'],
        },
        appearance: { menuType: 'sidebar', buttonCardPayText: `Pagar ${soles(intent.amount)}` },
      });
      checkout.culqi = async () => {
        if (checkout.token) {
          checkout.close();
          try {
            await publicOrdersApi.payWithToken(intent.paymentId, checkout.token.id);
            onPaid();
          } catch (err: any) {
            toast.error(err.message || 'No se pudo procesar el pago');
          }
        } else if (checkout.order) {
          // PagoEfectivo: el cliente paga el CIP después; el backend lo confirma por webhook o revisión periódica.
          waitForConfirmation(intent.paymentId);
        } else if (checkout.error) {
          toast.error(checkout.error.user_message || 'Culqi no pudo procesar el pago');
        }
      };
      checkout.open();
    } catch (err: any) {
      toast.error(err.message || 'No se pudo iniciar el pago');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <Script src="https://js.culqi.com/checkout-js" strategy="afterInteractive" onReady={() => setReady(true)} />
      <label className="block text-sm font-semibold" htmlFor="pay-email">Correo para tu comprobante</label>
      <input id="pay-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-base" placeholder="tucorreo@gmail.com" />
      <button onClick={pay} disabled={busy || !ready || waitingCip}
        className="w-full rounded-2xl bg-[#F26122] py-4 text-base font-bold text-white disabled:opacity-60">
        {waitingCip ? 'Esperando tu pago...' : busy ? 'Procesando...' : label}
      </button>
    </div>
  );
}
