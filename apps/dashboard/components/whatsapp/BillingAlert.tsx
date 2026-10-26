'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { whatsappCostsApi, type BillingStatus } from '../../lib/api-client';
import { buttonStyles } from '../ui';

export const BILLING_HUB_URL = 'https://business.facebook.com/latest/billing_hub/payment_methods/';

/** Pasos en Meta Business para registrar la tarjeta del local (Meta cobra directo, no Wuarikes). */
export function PaymentMethodSteps() {
  return (
    <div className="space-y-2 text-sm text-text-muted">
      <ol className="list-decimal space-y-1 pl-5">
        <li>Abre Meta Business Suite → <b className="text-text">Configuración</b> → <b className="text-text">Facturación y pagos</b>.</li>
        <li>Elige tu <b className="text-text">cuenta de WhatsApp Business</b>.</li>
        <li>Toca <b className="text-text">Agregar método de pago</b> y elige la moneda <b className="text-text">PEN (soles)</b>.</li>
      </ol>
      <p className="text-xs">Acepta Visa o Mastercard. Si es de débito, activa las compras por internet en tu banco.</p>
      <a href={BILLING_HUB_URL} target="_blank" rel="noopener noreferrer" className={buttonStyles('secondary', 'sm', 'gap-2')}>
        <ExternalLink size={16} aria-hidden /> Abrir facturación de Meta
      </a>
    </div>
  );
}

/**
 * Aviso cuando Meta rechazó un mensaje por falta de método de pago (error 131042). Recibe el estado si la
 * pantalla ya lo tiene; si no, lo consulta.
 */
export function BillingAlert({ placeId, billing }: { placeId: string; billing?: BillingStatus }) {
  const [fetched, setFetched] = useState<BillingStatus>(null);
  useEffect(() => {
    if (billing !== undefined) return;
    whatsappCostsApi.billing(placeId).then((r) => setFetched(r.billing)).catch(() => setFetched(null));
  }, [placeId, billing]);

  const status = billing !== undefined ? billing : fetched;
  if (status?.status !== 'SIN_PAGO') return null;
  return (
    <div role="alert" className="space-y-3 rounded-card border border-danger/40 bg-danger/5 p-4">
      <p className="flex items-start gap-2 font-semibold text-text">
        <AlertTriangle size={20} className="shrink-0 text-danger" aria-hidden />
        Meta no está entregando tus recordatorios y avisos: tu cuenta de WhatsApp no tiene método de pago.
      </p>
      <p className="text-sm text-text-muted">Las respuestas del bot y del equipo siguen llegando. Agrega una tarjeta en Meta y los envíos se reanudan solos.</p>
      <PaymentMethodSteps />
    </div>
  );
}
