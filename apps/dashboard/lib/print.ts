'use client';

import { ordersApi } from './api-client';

// Impresión desde el navegador: comanda de cocina, precuenta y ticket de caja en papel térmico (58 u 80 mm).
// Se imprime en un iframe oculto; en Chrome con --kiosk-printing sale directo a la impresora predeterminada.

export type PaperWidth = 58 | 80;
export interface PrintSettings { paper: PaperWidth; autoKitchen: boolean; autoTicket: boolean }
const KEY = 'print.settings';
const DEFAULTS: PrintSettings = { paper: 80, autoKitchen: false, autoTicket: false };

/** Ajustes por equipo (cada PC tiene su impresora): se guardan en este navegador. */
export function getPrintSettings(): PrintSettings {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return DEFAULTS; }
}
export function setPrintSettings(s: PrintSettings) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* sin almacenamiento: se usan los valores por defecto */ }
}

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const money = (cents: number) => `S/ ${(Number(cents || 0) / 100).toFixed(2)}`;
const dateTime = (d: string | Date = new Date()) =>
  new Date(d).toLocaleString('es-PE', { timeZone: 'America/Lima', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Imprime un fragmento HTML con el ancho de papel configurado. */
export function printHtml(body: string, title = 'Impresión') {
  const { paper } = getPrintSettings();
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
    @page { size: ${paper}mm auto; margin: 0; }
    * { box-sizing: border-box; }
    body { width: ${paper}mm; margin: 0; padding: 3mm ${paper === 58 ? 2 : 4}mm; font: ${paper === 58 ? 11 : 12}px/1.35 'Courier New', monospace; color: #000; }
    h1 { font-size: 1.4em; margin: 0 0 2px; text-align: center; }
    .c { text-align: center; } .r { text-align: right; } .b { font-weight: bold; } .big { font-size: 1.8em; font-weight: bold; }
    .muted { font-size: .9em; }
    hr { border: 0; border-top: 1px dashed #000; margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; } td { vertical-align: top; padding: 1px 0; }
    .note { font-weight: bold; padding-left: 1.5em; }
  </style></head><body>${body}</body></html>`);
  doc.close();
  const done = () => setTimeout(() => iframe.remove(), 1000);
  iframe.contentWindow!.onafterprint = done;
  setTimeout(() => { iframe.contentWindow!.focus(); iframe.contentWindow!.print(); done(); }, 50);
}

type Line = { quantity: number; description: string; note?: string | null; lineTotal?: number };

const linesTable = (lines: Line[], withPrices: boolean) => `<table>${lines.map((l) => `
  <tr><td class="b" style="width:2.5em">${esc(l.quantity)}x</td><td>${esc(l.description)}${l.note ? `<div class="note">» ${esc(l.note)}</div>` : ''}</td>
  ${withPrices ? `<td class="r">${money(l.lineTotal ?? 0)}</td>` : ''}</tr>`).join('')}</table>`;

/** Comanda para cocina: número grande, origen, platos y notas. Sin precios. */
export function kitchenTicketHtml(order: { number: number; channel?: string; fulfillment?: string; tableName?: string | null; createdAt?: string; notes?: string | null; items: { quantity: number; name: string; note?: string | null }[] }) {
  const origin = order.tableName ? `Mesa ${order.tableName}` : order.channel === 'MESA' ? 'Mesa' : order.channel === 'WHATSAPP' ? 'WhatsApp' : order.channel ?? '';
  return `<p class="c big">#${esc(order.number)}</p>
    <p class="c b">${esc(origin)}${order.fulfillment ? ` · ${esc(order.fulfillment)}` : ''}</p>
    <p class="c muted">${dateTime(order.createdAt)}</p><hr>
    ${linesTable(order.items.map((i) => ({ quantity: i.quantity, description: i.name, note: i.note })), false)}
    ${order.notes ? `<hr><p class="b">Nota: ${esc(order.notes)}</p>` : ''}<hr><p class="c muted">COMANDA</p>`;
}

const header = (place: { name?: string; address?: string | null; phone?: string | null } | null) =>
  `<h1>${esc(place?.name ?? '')}</h1>${place?.address ? `<p class="c muted">${esc(place.address)}</p>` : ''}${place?.phone ? `<p class="c muted">Tel. ${esc(place.phone)}</p>` : ''}<hr>`;

/** Precuenta de mesa: lo consumido y el total, para que el cliente revise antes de pagar. */
export function precuentaHtml(place: { name?: string; address?: string | null } | null, tableName: string, lines: Line[], total: number) {
  return `${header(place)}<p class="c b">PRECUENTA · ${esc(tableName)}</p><p class="c muted">${dateTime()}</p><hr>
    ${linesTable(lines, true)}<hr>
    <table><tr><td class="b">TOTAL</td><td class="r b">${money(total)}</td></tr></table><hr>
    <p class="c muted">Documento no válido como comprobante de pago</p>`;
}

const DOC: Record<string, string> = { TICKET: 'TICKET DE VENTA', BOLETA: 'BOLETA DE VENTA', FACTURA: 'FACTURA' };
const METHOD: Record<string, string> = { EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', YAPE_PLIN: 'Yape / Plin' };

/** Ticket de caja a partir de GET cash/receipts/:id. */
export function receiptHtml(data: { place: { name?: string; address?: string | null; phone?: string | null } | null; receipt: any; lines: Line[] }) {
  const r = data.receipt;
  const customer = r.customerName || r.customerDocNumber
    ? `<p>Cliente: ${esc(r.customerName ?? '')}</p>${r.customerDocNumber ? `<p>${esc(r.customerDocType ?? 'Doc.')}: ${esc(r.customerDocNumber)}</p>` : ''}${r.customerAddress ? `<p>Dir.: ${esc(r.customerAddress)}</p>` : ''}`
    : '<p>Cliente: Cliente genérico</p>';
  return `${header(data.place)}<p class="c b">${esc(DOC[r.docType] ?? r.docType)}</p><p class="c b">${esc(r.code)}</p>
    <p class="c muted">${dateTime(r.createdAt)}${r.tableName ? ` · ${esc(r.tableName)}` : ''}</p><hr>${customer}<hr>
    ${linesTable(data.lines, true)}<hr>
    <table><tr><td class="b">TOTAL</td><td class="r b">${money(r.total)}</td></tr><tr><td>Pago</td><td class="r">${esc(METHOD[r.paymentMethod] ?? r.paymentMethod)}</td></tr></table><hr>
    <p class="c">¡Gracias por su preferencia!</p>`;
}

/** Trae el comprobante y lo imprime. Devuelve false si falló (el cobro ya quedó hecho igual). */
export async function printReceipt(placeId: string, receiptId: string) {
  try { printHtml(receiptHtml(await ordersApi.receiptForPrint(placeId, receiptId)), 'Ticket'); return true; } catch { return false; }
}
