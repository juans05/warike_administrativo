import QRCode from 'qrcode';

export function qrPublicUrl(token: string) {
  return `${window.location.origin}/q/${token}`;
}

export async function copyQrUrls(qrCodes: { token: string; code: string }[]) {
  const text = qrCodes.map((qr) => `${qr.code}\t${qrPublicUrl(qr.token)}`).join('\n');
  await navigator.clipboard.writeText(text);
}

export async function downloadQrPng(qrCode: { token: string; code: string }) {
  const dataUrl = await QRCode.toDataURL(qrPublicUrl(qrCode.token), { width: 512, margin: 2 });
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${qrCode.code}.png`;
  a.click();
}

// Hoja imprimible con todos los QR de un lote — se abre en pestaña nueva,
// el usuario la imprime con Ctrl+P (a PDF o directo a la impresora).
export async function openPrintSheet(qrCodes: { token: string; code: string }[]) {
  const cells = await Promise.all(
    qrCodes.map(async (qr) => {
      const svg = await QRCode.toString(qrPublicUrl(qr.token), { type: 'svg', margin: 1, width: 220 });
      return `<div class="cell">${svg}<p>${qr.code}</p></div>`;
    }),
  );

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Lote de QR — Wuarikes</title>
<style>
  body { font-family: sans-serif; margin: 24px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
  .cell { text-align: center; border: 1px dashed #ccc; padding: 12px; page-break-inside: avoid; }
  .cell svg { width: 100%; height: auto; }
  .cell p { margin: 8px 0 0; font-weight: bold; font-size: 14px; }
  @media print { .cell { border-color: #999; } }
</style>
</head>
<body>
  <div class="grid">${cells.join('')}</div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  window.open(blobUrl, '_blank');
}
