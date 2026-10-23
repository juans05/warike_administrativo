'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Palette } from 'lucide-react';
import { API_BASE_URL, fetchWithAuth } from '../../lib/api-client';
import { Button, Card } from '../ui';

const SWATCHES = ['#EE5924', '#C84B31', '#B91C1C', '#1F7A4D', '#0F766E', '#1D4ED8', '#6D28D9', '#111827'];
const isHex = (v: string) => /^#[0-9A-Fa-f]{6}$/.test(v);
/** Luminancia relativa (0 = negro, 1 = blanco): con fondos muy claros el texto blanco no se lee. */
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Color de la tarjeta en Google/Apple Wallet, con vista previa igual a la que verá el cliente. */
export function WalletDesignCard({ placeId, stampsToReward, isStamps, rewardTitle }: { placeId: string; stampsToReward: number; isStamps: boolean; rewardTitle?: string }) {
  const [design, setDesign] = useState<{ walletColor: string; logoUrl: string | null; name: string } | null>(null);
  const [color, setColor] = useState('#EE5924');
  const [previewColor, setPreviewColor] = useState('#EE5924');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWithAuth(`/business/places/${placeId}/loyalty/wallet-design`)
      .then((d) => { setDesign(d); setColor(d.walletColor); setPreviewColor(d.walletColor); })
      .catch(() => setDesign(null));
  }, [placeId]);
  // La imagen de la vista previa se pide con una pequeña pausa para no recargarla con cada tecla.
  useEffect(() => {
    if (!isHex(color)) return;
    const t = setTimeout(() => setPreviewColor(color), 250);
    return () => clearTimeout(t);
  }, [color]);

  if (!design) return null;
  const total = Math.min(20, Math.max(1, stampsToReward || 10));
  const sample = Math.min(total - 1, Math.round(total * 0.4));
  const dirty = isHex(color) && color.toUpperCase() !== design.walletColor.toUpperCase();
  const tooLight = isHex(color) && luminance(color) > 0.55;

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetchWithAuth(`/business/places/${placeId}/loyalty/wallet-design`, { method: 'PUT', body: JSON.stringify({ walletColor: color }) });
      setDesign({ ...design, walletColor: r.walletColor });
      toast.success(r.googleUpdated ? 'Color guardado. Las tarjetas guardadas en Google también cambiaron.' : 'Color guardado. Se verá en las tarjetas nuevas y en el próximo sello.');
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <Card padding="lg" className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold text-text"><Palette size={18} aria-hidden /> Diseño de tu tarjeta</h2>
        <p className="mt-1 text-sm text-text-muted">Elige el color con el que tu tarjeta aparece en el Wallet de tus clientes.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Color de la tarjeta">
        {SWATCHES.map((s) => (
          <button key={s} type="button" role="radio" aria-checked={color.toUpperCase() === s} aria-label={`Color ${s}`} onClick={() => setColor(s)}
            className={`h-9 w-9 rounded-full border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${color.toUpperCase() === s ? 'border-text ring-2 ring-offset-2 ring-text' : 'border-white shadow-card'}`}
            style={{ background: s }} />
        ))}
        <label className="ml-1 flex items-center gap-2 text-sm text-text">
          <input type="color" aria-label="Color personalizado" value={isHex(color) ? color : '#EE5924'} onChange={(e) => setColor(e.target.value.toUpperCase())} className="h-9 w-9 cursor-pointer rounded-full border border-border bg-transparent" />
          <input type="text" aria-label="Código de color" value={color} maxLength={7} onChange={(e) => setColor(e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`)}
            className="h-9 w-24 rounded-control border border-border bg-surface px-2 font-mono text-sm uppercase" />
        </label>
      </div>
      {tooLight && (
        <p className="flex items-center gap-2 text-sm text-text"><AlertTriangle size={16} className="text-secondary" aria-hidden /> Es un color muy claro: el texto blanco de la tarjeta casi no se leerá.</p>
      )}

      {/* Vista previa: misma imagen de sellos que genera el servidor para Google/Apple Wallet */}
      <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl text-white shadow-modal" style={{ background: isHex(color) ? color : design.walletColor }} aria-label="Vista previa de la tarjeta">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            {design.logoUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={design.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-full bg-white object-contain" />
              : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white font-bold" style={{ color: isHex(color) ? color : design.walletColor }}>{design.name.charAt(0).toUpperCase()}</span>}
            <span className="truncate font-semibold">{design.name}</span>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase opacity-80">{isStamps ? 'Sellos' : 'Puntos'}</p>
            <p className="font-semibold tabular-nums">{isStamps ? `${sample} / ${total}` : '120 pts'}</p>
          </div>
        </div>
        {isStamps && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`${API_BASE_URL}/api/public/loyalty/wallet/stamps/${placeId}/${sample}/${total}.png?c=${previewColor.slice(1)}`} alt={`${sample} de ${total} sellos`} className="block w-full" />
        )}
        <div className="flex justify-between gap-3 px-4 py-3 text-sm">
          <div><p className="text-[11px] uppercase opacity-80">Cliente</p><p className="font-medium">Luis Pérez</p></div>
          {rewardTitle && <div className="text-right"><p className="text-[11px] uppercase opacity-80">Premio</p><p className="font-medium">{rewardTitle}</p></div>}
        </div>
      </div>
      <p className="text-center text-xs text-text-muted">Vista previa con datos de ejemplo.</p>

      <div className="flex justify-end">
        <Button loading={saving} disabled={!dirty} onClick={save}>Guardar color</Button>
      </div>
    </Card>
  );
}
