import QRCode from 'qrcode';

export function qrPublicUrl(token: string) {
  return `${window.location.origin}/q/${token}`;
}

export async function copyQrUrls(qrCodes: { token: string; code: string }[]) {
  const text = qrCodes.map((qr) => `${qr.code}\t${qrPublicUrl(qr.token)}`).join('\n');
  await navigator.clipboard.writeText(text);
}

interface QrWithPlace {
  token: string;
  code: string;
  currentPlaceLogoUrl?: string | null;
  currentPlaceShowLogo?: boolean;
}

export type TemplateId = 'black' | 'white' | 'custom-ay-mi-leche';

interface TemplateConfig {
  label: string;
  src: string;
  size: number;
  // Hueco donde va el QR real, medido sobre el arte original.
  qrBox: { x: number; y: number; size: number };
  // Cuando el restaurante muestra su logo: esta zona se tapa con blanco (el
  // titular "Review us on Google" compite visualmente con el logo) y ahí
  // mismo se dibuja el logo del negocio, grande, en vez de la insignia
  // chica sobre el QR. Opcional: solo aplica a plantillas que lo necesitan.
  headerLogoArea?: { x: number; y: number; w: number; h: number };
}

// Coordenadas medidas sobre el arte real en public/qr-templates/ (2048x2048).
export const TEMPLATES: Record<TemplateId, TemplateConfig> = {
  black: {
    label: 'Fondo negro — Califícanos en Google',
    src: '/qr-templates/review-google-template.jpeg',
    size: 2048,
    qrBox: { x: 1159, y: 749, size: 400 },
  },
  white: {
    label: 'Fondo blanco — Review us on Google',
    src: '/qr-templates/review-google-template_3.jpeg',
    size: 2048,
    qrBox: { x: 1245, y: 1120, size: 450 },
    headerLogoArea: { x: 450, y: 280, w: 1150, h: 330 },
  },
  // Diseño personalizado, hecho a medida para el negocio "Ay mi leche"
  // (nombre e íconos horneados en el arte) — no usar para otros negocios.
  'custom-ay-mi-leche': {
    label: 'Personalizado — Ay mi leche',
    src: '/qr-templates/review-google-template_2.jpeg',
    size: 743,
    qrBox: { x: 460, y: 405, size: 170 },
  },
};

const DEFAULT_TEMPLATE: TemplateId = 'white';
// Franja blanca añadida debajo del arte para el correlativo — evita pisar
// el diseño, que ya usa casi todo el círculo hasta el borde. Proporcional al
// tamaño de la plantilla: las medidas fijas se veían enormes en la de 743px.
const CAPTION_RATIO = 0.031;
// Deja hueco central en el QR para el logo del restaurante sin perder
// escaneabilidad — nivel de corrección de errores alto tolera la oclusión.
const LOGO_QR_OPTIONS = { errorCorrectionLevel: 'H' as const, margin: 1 };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`));
    img.src = src;
  });
}

// Dibuja `img` centrada dentro de (x,y,w,h) preservando su proporción
// (equivalente a `object-fit: contain`), con un margen interno para que no
// toque los bordes del hueco.
function drawContained(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  fillRatio: number,
) {
  const boxW = w * fillRatio;
  const boxH = h * fillRatio;
  const scale = Math.min(boxW / img.width, boxH / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  ctx.drawImage(img, x + (w - drawW) / 2, y + (h - drawH) / 2, drawW, drawH);
}

// El fondo (~1.5MB, 2048x2048) es el mismo para todo un lote — cachearlo
// evita re-descargar/decodificar la misma imagen en cada QR al imprimir 100+.
const templateImageCache = new Map<string, Promise<HTMLImageElement>>();
function loadTemplateImage(src: string): Promise<HTMLImageElement> {
  let cached = templateImageCache.get(src);
  if (!cached) {
    cached = loadImage(src);
    templateImageCache.set(src, cached);
  }
  return cached;
}

// Compone el QR real + correlativo (+ logo del restaurante, si aplica) sobre
// el arte fijo de la plantilla elegida. El logo del restaurante puede vivir
// en otro dominio (CDN/S3) sin CORS configurado: dibujarlo no tira error,
// pero `toDataURL` sí — recién ahí lo notamos, así que reintentamos sin el
// logo en vez de romper toda la descarga.
async function renderTemplate(qr: QrWithPlace, templateId: TemplateId, includeRestaurantLogo: boolean): Promise<string> {
  const template = TEMPLATES[templateId];
  const showLogo = includeRestaurantLogo && !!qr.currentPlaceShowLogo && !!qr.currentPlaceLogoUrl;
  const captionHeight = Math.round(template.size * CAPTION_RATIO);
  const canvas = document.createElement('canvas');
  canvas.width = template.size;
  canvas.height = template.size + captionHeight;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const bg = await loadTemplateImage(template.src);
  ctx.drawImage(bg, 0, 0, template.size, template.size);

  // Plantillas con headerLogoArea reemplazan el titular por el logo grande
  // ahí arriba, y dejan el QR limpio. Las demás ponen una insignia chica
  // centrada sobre el propio QR (con corrección de errores alta).
  if (showLogo && template.headerLogoArea) {
    const { x, y, w, h } = template.headerLogoArea;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, w, h);
    const rLogo = await loadImage(qr.currentPlaceLogoUrl!);
    drawContained(ctx, rLogo, x, y, w, h, 0.85);
  }

  const useLogoQr = showLogo && !template.headerLogoArea;
  const qrDataUrl = await QRCode.toDataURL(qrPublicUrl(qr.token), useLogoQr ? LOGO_QR_OPTIONS : { margin: 1 });
  const qrImg = await loadImage(qrDataUrl);
  const { x, y, size } = template.qrBox;
  ctx.drawImage(qrImg, x, y, size, size);

  if (useLogoQr) {
    const rLogo = await loadImage(qr.currentPlaceLogoUrl!);
    const cx = x + size / 2;
    const cy = y + size / 2;
    const r = size * 0.19;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#F26122';
    ctx.lineWidth = Math.max(2, template.size * 0.002);
    ctx.stroke();
    ctx.clip();
    ctx.drawImage(rLogo, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
  }

  const fontSize = Math.round(template.size * 0.0127);
  ctx.textAlign = 'center';
  ctx.font = `600 ${fontSize}px "Courier New", monospace`;
  ctx.fillStyle = '#6B7280';
  ctx.fillText(qr.code, template.size / 2, template.size + captionHeight / 2 + fontSize * 0.35);

  return canvas.toDataURL('image/png');
}

export async function renderQrTemplate(qr: QrWithPlace, templateId: TemplateId = DEFAULT_TEMPLATE): Promise<string> {
  try {
    return await renderTemplate(qr, templateId, true);
  } catch {
    return renderTemplate(qr, templateId, false);
  }
}

export async function downloadQrPng(qr: QrWithPlace, templateId: TemplateId = DEFAULT_TEMPLATE) {
  const dataUrl = await renderQrTemplate(qr, templateId);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${qr.code}.png`;
  a.click();
}

// Hoja imprimible con todos los QR de un lote — se abre en pestaña nueva,
// el usuario la imprime con Ctrl+P (a PDF o directo a la impresora).
export async function openPrintSheet(qrCodes: QrWithPlace[], templateId: TemplateId = DEFAULT_TEMPLATE) {
  const cells = await Promise.all(
    qrCodes.map(async (qr) => {
      const dataUrl = await renderQrTemplate(qr, templateId);
      return `<div class="cell"><img src="${dataUrl}" alt="${qr.code}" /></div>`;
    }),
  );

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Lote de QR — Wuarikes</title>
<style>
  body { font-family: sans-serif; margin: 24px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
  .cell { text-align: center; padding: 8px; page-break-inside: avoid; }
  .cell img { width: 100%; height: auto; }
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
