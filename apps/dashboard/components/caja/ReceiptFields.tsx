'use client';

import type { ReceiptDocType, ReceiptRequest } from '../../lib/api-client';
import { Input, Select, Tabs } from '../ui';

export const DOC_LABEL: Record<ReceiptDocType, string> = { TICKET: 'Ticket', BOLETA: 'Boleta', FACTURA: 'Factura' };
export const EMPTY_RECEIPT: ReceiptRequest = { docType: 'TICKET' };

/** "Datos del cliente y comprobante": tipo (ticket/boleta/factura) y, según el tipo, documento, nombre y dirección. */
export function ReceiptFields({ value, onChange, series }: { value: ReceiptRequest; onChange(next: ReceiptRequest): void; series?: Record<string, string> }) {
  const set = (patch: Partial<ReceiptRequest>) => onChange({ ...value, ...patch });
  const isFactura = value.docType === 'FACTURA';
  const changeType = (docType: ReceiptDocType) =>
    // La factura siempre va con RUC; al salir de ella se vuelve a DNI.
    set({ docType, customerDocType: docType === 'FACTURA' ? 'RUC' : value.customerDocType === 'RUC' ? 'DNI' : value.customerDocType });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-text">Comprobante</p>
        {series && <span className="font-mono text-xs text-text-muted">Serie: {series[value.docType]}</span>}
      </div>
      <Tabs
        aria-label="Tipo de comprobante"
        value={value.docType}
        onChange={(key) => changeType(key as ReceiptDocType)}
        tabs={(['TICKET', 'BOLETA', 'FACTURA'] as ReceiptDocType[]).map((k) => ({ key: k, label: DOC_LABEL[k] }))}
      />
      {value.docType === 'TICKET' ? (
        <p className="text-sm text-text-muted">Comprobante emitido a Cliente Genérico (venta global).</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
          <Select label="Documento" value={isFactura ? 'RUC' : value.customerDocType ?? 'DNI'} disabled={isFactura} onChange={(e) => set({ customerDocType: e.target.value })}>
            {isFactura ? <option value="RUC">RUC</option> : <><option value="DNI">DNI</option><option value="CE">CE</option></>}
          </Select>
          <Input
            label={isFactura ? 'Número de RUC' : 'Número (opcional hasta S/ 700)'}
            inputMode={value.customerDocType === 'CE' ? 'text' : 'numeric'}
            maxLength={isFactura ? 11 : 12}
            value={value.customerDocNumber ?? ''}
            onChange={(e) => set({ customerDocNumber: e.target.value.trim() })}
          />
          <div className="sm:col-span-2">
            <Input label={isFactura ? 'Razón social' : 'Nombre completo / Cliente'} value={value.customerName ?? ''} onChange={(e) => set({ customerName: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Input label={isFactura ? 'Dirección fiscal' : 'Dirección (opcional)'} value={value.customerAddress ?? ''} onChange={(e) => set({ customerAddress: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  );
}
