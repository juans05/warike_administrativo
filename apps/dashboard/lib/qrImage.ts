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
  currentPlaceName?: string | null;
}

export type TemplateId = 'black' | 'white' | 'custom-ay-mi-leche' | 'plaque-google-colors' | 'plaque-orange';

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
  // Solo en las placas del PDF A4: zona donde va el logo/nombre del
  // restaurante (se cubre el "G + Califícanos en Google" del arte y se
  // reescribe el titular debajo) y rectángulos extra a tapar.
  // Si existe, el correlativo va en blanco sobre el borde de color de la placa
  // (en vez de en una franja blanca añadida debajo): x derecha, y centro.
  codeOnBorder?: { x: number; y: number };
  plaqueHeader?: { x: number; y: number; w: number; h: number; cover: { x: number; y: number; w: number; h: number }[] };
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
  // Placas 12×12 cm con "Toca" (NFC) + "Escanea" (QR). La misma placa sirve
  // para un chip NFC o un QR: ambos llevan la misma URL /q/{token}.
  'plaque-google-colors': {
    label: 'Placa NFC+QR — Colores Google',
    src: '/qr-templates/plaque-google-colors.jpeg',
    size: 1254,
    qrBox: { x: 726, y: 549, size: 314 },
    codeOnBorder: { x: 1060, y: 1215 },
    plaqueHeader: {
      x: 180, y: 105, w: 905, h: 307,
      // El círculo gris de la "G" baja un poco más que el resto del encabezado.
      cover: [{ x: 180, y: 105, w: 905, h: 311 }, { x: 180, y: 405, w: 182, h: 30 }, { x: 362, y: 405, w: 70, h: 14 }],
    },
  },
  'plaque-orange': {
    label: 'Placa NFC+QR — Naranja Wuarikes',
    src: '/qr-templates/plaque-orange.jpeg',
    size: 1254,
    qrBox: { x: 726, y: 549, size: 314 },
    codeOnBorder: { x: 1060, y: 1215 },
    plaqueHeader: {
      x: 180, y: 105, w: 905, h: 307,
      // El círculo gris de la "G" baja un poco más que el resto del encabezado.
      cover: [{ x: 180, y: 105, w: 905, h: 311 }, { x: 180, y: 405, w: 182, h: 30 }, { x: 362, y: 405, w: 70, h: 14 }],
    },
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
  const captionHeight = template.codeOnBorder ? 0 : Math.round(template.size * CAPTION_RATIO);
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

  if (template.codeOnBorder) {
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.round(template.size * 0.016)}px "Courier New", monospace`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(qr.code, template.codeOnBorder.x, template.codeOnBorder.y);
  } else {
    const fontSize = Math.round(template.size * 0.0127);
    ctx.textAlign = 'center';
    ctx.font = `600 ${fontSize}px "Courier New", monospace`;
    ctx.fillStyle = '#6B7280';
    ctx.fillText(qr.code, template.size / 2, template.size + captionHeight / 2 + fontSize * 0.35);
  }

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
  /* 2 placas de 12×12 cm por hoja A4, una debajo de otra — igual que el PDF. */
  @page { size: A4; margin: 0; }
  body { font-family: sans-serif; margin: 0; }
  .cell { width: 120mm; margin: 0 auto; padding-top: 14mm; break-inside: avoid; }
  .cell:nth-child(even) { padding-top: 18mm; break-after: page; }
  .cell img { display: block; width: 100%; height: auto; }
</style>
</head>
<body>
  ${cells.join('')}
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  window.open(blobUrl, '_blank');
}

function triggerDownload(blob: Blob, filename: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// CSV para grabar los chips NFC en lote (NFC Tools, etc.): cada fila es la URL
// que va dentro del chip. El token es el mismo que lleva el QR impreso.
export function downloadNfcCsv(qrCodes: { token: string; code: string }[]) {
  const rows = ['codigo,url', ...qrCodes.map((qr) => `${qr.code},${qrPublicUrl(qr.token)}`)];
  // BOM para que Excel abra el UTF-8 sin romper nada.
  triggerDownload(new Blob(['\ufeff' + rows.join('\n')], { type: 'text/csv;charset=utf-8' }), 'wuarikes-nfc.csv');
}

const A4 = { w: 210, h: 297 };
const PLAQUE_MM = 120;
// 2 placas de 12×12 cm por hoja A4, centradas (margen vertical para el corte).
const PLAQUE_ROWS_Y = [14, 156];

async function fileToDataUrl(src: string): Promise<string> {
  const blob = await (await fetch(src)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Logo del restaurante como PNG (conserva transparencia). Si su dominio no
// permite CORS, `toDataURL` falla: devolvemos null y se usa el nombre en texto.
const logoCache = new Map<string, Promise<{ data: string; w: number; h: number } | null>>();
function loadLogo(url: string) {
  let cached = logoCache.get(url);
  if (!cached) {
    cached = loadImage(url)
      .then((img) => {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        c.getContext('2d')!.drawImage(img, 0, 0);
        return { data: c.toDataURL('image/png'), w: img.width, h: img.height };
      })
      .catch(() => null);
    logoCache.set(url, cached);
  }
  return cached;
}

// PDF descargable con todos los QR: 2 placas de 12×12 cm por hoja A4. El
// fondo se incrusta una sola vez (mismo alias) y el QR se dibuja como vector,
// así un lote de 500 pesa pocos MB y queda nítido al imprimir. Con `personalize`,
// los QR ya asignados llevan el logo (o nombre) de su restaurante en la cabecera.
export async function downloadPlaquePdf(
  qrCodes: QrWithPlace[],
  templateId: TemplateId = 'plaque-google-colors',
  personalize = false,
): Promise<string[]> {
  const [{ jsPDF }, bg] = await Promise.all([import('jspdf'), fileToDataUrl(TEMPLATES[templateId].src)]);
  const template = TEMPLATES[templateId];
  const { size, qrBox, plaqueHeader } = template;
  const mm = PLAQUE_MM / size;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const x0 = (A4.w - PLAQUE_MM) / 2;
  // Restaurantes con logo cargado pero que no se pudo incrustar (p. ej. sin CORS): salen con su nombre.
  const logoFailed = new Set<string>();

  for (let i = 0; i < qrCodes.length; i++) {
    const qr = qrCodes[i];
    if (i > 0 && i % PLAQUE_ROWS_Y.length === 0) doc.addPage();
    const y0 = PLAQUE_ROWS_Y[i % PLAQUE_ROWS_Y.length];

    doc.addImage(bg, 'JPEG', x0, y0, PLAQUE_MM, PLAQUE_MM, templateId);

    if (personalize && plaqueHeader && qr.currentPlaceName) {
      const { x, y, w, h, cover } = plaqueHeader;
      doc.setFillColor(255, 255, 255);
      cover.forEach((r) => doc.rect(x0 + r.x * mm, y0 + r.y * mm, r.w * mm, r.h * mm, 'F'));

      // Zona del logo/nombre: todo el encabezado salvo la línea del titular.
      const boxX = x0 + x * mm;
      const boxY = y0 + y * mm;
      const boxW = w * mm;
      const boxH = (h - 90) * mm;
      const logo = qr.currentPlaceShowLogo && qr.currentPlaceLogoUrl ? await loadLogo(qr.currentPlaceLogoUrl) : null;
      if (qr.currentPlaceShowLogo && qr.currentPlaceLogoUrl && !logo) logoFailed.add(qr.currentPlaceName);
      if (logo) {
        const scale = Math.min((boxW * 0.9) / logo.w, (boxH * 0.9) / logo.h);
        const lw = logo.w * scale;
        const lh = logo.h * scale;
        doc.addImage(logo.data, 'PNG', boxX + (boxW - lw) / 2, boxY + (boxH - lh) / 2, lw, lh, qr.currentPlaceLogoUrl!);
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 26, 26);
        // Achica la letra hasta que el nombre, partido en líneas, entre en la zona.
        let fontSize = 44;
        let lines: string[] = [];
        let lineH = 0;
        do {
          doc.setFontSize(fontSize);
          lines = doc.splitTextToSize(qr.currentPlaceName, boxW * 0.9);
          lineH = fontSize * 0.3528 * 1.15; // pt → mm, con interlineado
          fontSize -= 2;
        } while (fontSize >= 14 && lines.length * lineH > boxH * 0.9);
        const firstY = boxY + boxH / 2 - ((lines.length - 1) * lineH) / 2;
        lines.forEach((line, n) => doc.text(line, boxX + boxW / 2, firstY + n * lineH, { align: 'center', baseline: 'middle' }));
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(26, 26, 26);
      doc.text('Califícanos en Google', boxX + boxW / 2, y0 + (y + h - 22) * mm, { align: 'center' });
    }

    // Tapa el QR de relleno del arte y dibuja el real con 1 módulo de silencio.
    const bx = x0 + qrBox.x * mm;
    const by = y0 + qrBox.y * mm;
    const bs = qrBox.size * mm;
    doc.setFillColor(255, 255, 255);
    doc.rect(bx, by, bs, bs, 'F');
    const { modules } = QRCode.create(qrPublicUrl(qr.token), { errorCorrectionLevel: 'M' });
    const cell = bs / (modules.size + 2);
    doc.setFillColor(0, 0, 0);
    for (let r = 0; r < modules.size; r++) {
      for (let c = 0; c < modules.size; c++) {
        if (modules.get(r, c)) doc.rect(bx + (c + 1) * cell, by + (r + 1) * cell, cell, cell, 'F');
      }
    }

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    doc.rect(x0, y0, PLAQUE_MM, PLAQUE_MM);
    // Correlativo bien chico sobre el borde de color de la placa (o, si la
    // plantilla no tiene borde, en la esquina inferior), para identificar
    // cuál es cuál una vez impresa y recortada.
    doc.setFont('courier', template.codeOnBorder ? 'bold' : 'normal');
    doc.setFontSize(5.5);
    if (template.codeOnBorder) {
      doc.setTextColor(255, 255, 255);
      doc.text(qr.code, x0 + template.codeOnBorder.x * mm, y0 + template.codeOnBorder.y * mm, { align: 'right', baseline: 'middle' });
    } else {
      doc.setTextColor(107, 114, 128);
      doc.text(qr.code, x0 + size * 0.877 * mm, y0 + size * 0.925 * mm, { align: 'right' });
    }
  }

  doc.save('wuarikes-placas-12x12.pdf');
  return Array.from(logoFailed);
}
