'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { businessApi } from '../lib/api-client';
import { buildPalette, DEFAULT_THEME, PRESETS, type MenuTheme } from '../lib/menuTheme';

const COLOR_FIELDS: { key: 'headerBg' | 'bodyBg' | 'footerBg' | 'accent'; label: string; help: string }[] = [
  { key: 'headerBg', label: 'Encabezado', help: 'Arriba, donde está tu nombre y logo' },
  { key: 'bodyBg', label: 'Fondo de la carta', help: 'Detrás de los platos' },
  { key: 'footerBg', label: 'Pie', help: 'Abajo, con tus datos' },
  { key: 'accent', label: 'Color de acento', help: 'Precios, botones y categoría elegida' },
];

const TEXT_FIELDS: { key: 'tagline' | 'menuTitle' | 'notice' | 'footerText'; label: string; placeholder: string; max: number; multiline?: boolean }[] = [
  { key: 'tagline', label: 'Frase bajo tu nombre', placeholder: 'Cevichería criolla desde 1998', max: 90 },
  { key: 'menuTitle', label: 'Título de la carta', placeholder: 'Nuestra carta', max: 60 },
  { key: 'notice', label: 'Aviso sobre los platos', placeholder: 'Los precios incluyen IGV. Tiempo de preparación: 20 minutos.', max: 160 },
  { key: 'footerText', label: 'Texto del pie', placeholder: 'Av. Principal 123, Miraflores\nReservas: 999 888 777', max: 240, multiline: true },
];

// Personalización de la carta pública: colores del encabezado, cuerpo y pie, y textos adicionales.
// El color del texto se ajusta solo para que siempre se lea.
export default function MenuDesign({ placeId, logoUrl, placeName }: { placeId: string; logoUrl: string; placeName?: string }) {
  const [theme, setTheme] = useState<MenuTheme>({});
  const [saved, setSaved] = useState<string>('{}');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    businessApi.getMenuTheme(placeId)
      .then((t: MenuTheme) => { setTheme(t || {}); setSaved(JSON.stringify(t || {})); })
      .catch(() => { /* sin diseño guardado: se muestran los valores por defecto */ })
      .finally(() => setLoading(false));
  }, [placeId]);

  const set = (patch: MenuTheme) => setTheme((t) => ({ ...t, ...patch }));
  const dirty = JSON.stringify(theme) !== saved;
  const pal = buildPalette(theme);

  const save = async () => {
    setSaving(true);
    try {
      const res = await businessApi.setMenuTheme(placeId, theme);
      setTheme(res || {});
      setSaved(JSON.stringify(res || {}));
      toast.success('Diseño guardado. Tu carta ya se ve así.');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo guardar el diseño');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-200';

  return (
    <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-black text-gray-900">Diseño de tu carta</h2>
          <p className="mt-0.5 text-xs text-gray-400">Elige los colores y los textos que ven tus clientes. El color de las letras se ajusta solo para que siempre se lean.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => setTheme({})}
            disabled={loading || Object.keys(theme).length === 0}
            className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-black text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            Volver al diseño original
          </button>
          <button
            onClick={save}
            disabled={loading || saving || !dirty}
            className="rounded-xl bg-[#F26122] px-5 py-2 text-xs font-black text-white hover:bg-orange-600 disabled:opacity-40"
          >
            {saving ? 'Guardando…' : 'Guardar diseño'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-xs font-bold text-gray-500">Combinaciones listas</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => set(p.theme)}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:border-orange-300"
                >
                  <span className="flex overflow-hidden rounded-md border border-black/10">
                    {[p.theme.headerBg, p.theme.bodyBg, p.theme.accent].map((c, i) => <span key={i} className="h-5 w-4" style={{ background: c }} />)}
                  </span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {COLOR_FIELDS.map(({ key, label, help }) => {
              const value = theme[key] ?? DEFAULT_THEME[key];
              return (
                <label key={key} className="block">
                  <span className="mb-1 block text-xs font-bold text-gray-700">{label}</span>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => set({ [key]: e.target.value.toUpperCase() })}
                      className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-gray-200 bg-white p-1"
                      aria-label={label}
                    />
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-gray-600">{value}</p>
                      <p className="truncate text-[11px] text-gray-400">{help}</p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="grid gap-4">
            {TEXT_FIELDS.map(({ key, label, placeholder, max, multiline }) => (
              <label key={key} className="block">
                <span className="mb-1 flex items-center justify-between text-xs font-bold text-gray-700">
                  {label}
                  <span className="font-normal text-gray-400">{(theme[key] ?? '').length}/{max}</span>
                </span>
                {multiline ? (
                  <textarea rows={2} maxLength={max} className={inputCls} placeholder={placeholder} value={theme[key] ?? ''} onChange={(e) => set({ [key]: e.target.value })} />
                ) : (
                  <input maxLength={max} className={inputCls} placeholder={placeholder} value={theme[key] ?? ''} onChange={(e) => set({ [key]: e.target.value })} />
                )}
              </label>
            ))}
          </div>

          <p className="text-xs text-gray-400">
            {logoUrl ? 'Tu logo aparece junto al nombre, en el encabezado. Puedes cambiarlo en la tarjeta "Logo del negocio" de arriba.' : 'Sube tu logo en la tarjeta "Logo del negocio" de arriba para que aparezca en el encabezado.'}
          </p>
        </div>

        {/* Vista previa en vivo */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <p className="mb-2 text-xs font-bold text-gray-500">Así se verá</p>
          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm" style={{ background: pal.bg, color: pal.text }}>
            <div className="px-4 pb-4 pt-8" style={{ background: pal.headerBg, color: pal.headerText }}>
              <div className="flex items-end gap-3">
                {logoUrl && <img src={logoUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />}
                <div className="min-w-0">
                  <p className="truncate text-xl font-extrabold leading-tight">{placeName || 'Tu restaurante'}</p>
                  {theme.tagline && <p className="truncate text-xs opacity-90">{theme.tagline}</p>}
                </div>
              </div>
            </div>
            <div className="space-y-3 px-4 py-4">
              {theme.menuTitle && <p className="text-sm font-bold" style={{ color: pal.muted }}>{theme.menuTitle}</p>}
              <span className="inline-block rounded-full px-3 py-1 text-xs font-bold" style={{ background: pal.food, color: pal.accentInk }}>Platos de fondo</span>
              {theme.notice && <p className="rounded-lg px-3 py-2 text-[11px]" style={{ background: pal.surface, border: `1px solid ${pal.line}` }}>{theme.notice}</p>}
              <div className="flex items-center justify-between rounded-xl p-3" style={{ background: pal.surface }}>
                <div>
                  <p className="text-sm font-bold">Lomo saltado</p>
                  <p className="text-[11px]" style={{ color: pal.muted }}>Lomo fino al wok con papas</p>
                </div>
                <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: pal.food, color: pal.accentInk }}>S/ 38</span>
              </div>
            </div>
            <div className="px-4 py-4 text-center" style={{ background: pal.footerBg, color: pal.footerText, borderTop: `1px solid ${pal.footerLine}` }}>
              {theme.footerText && <p className="mb-2 whitespace-pre-line text-[11px]">{theme.footerText}</p>}
              <p className="text-[10px]" style={{ color: pal.footerMuted }}>Carta digital hecha con Wuarike</p>
            </div>
          </div>
          {dirty && <p className="mt-2 text-xs font-bold text-amber-600">Hay cambios sin guardar.</p>}
        </div>
      </div>
    </div>
  );
}
