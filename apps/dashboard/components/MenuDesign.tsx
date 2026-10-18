'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { businessApi } from '../lib/api-client';
import { buildPalette, DEFAULT_THEME, PRESETS, type MenuTheme } from '../lib/menuTheme';
import { Badge, Button, Card, Input, Textarea } from './ui';
import type { CatalogCtx } from './carta/types';

const COLOR_FIELDS: { key: 'headerBg' | 'bodyBg' | 'footerBg' | 'accent'; label: string; help: string }[] = [
  { key: 'headerBg', label: 'Encabezado', help: 'Arriba, donde está tu nombre y logo' },
  { key: 'bodyBg', label: 'Fondo', help: 'Detrás de los ítems' },
  { key: 'footerBg', label: 'Pie', help: 'Abajo, con tus datos' },
  { key: 'accent', label: 'Color de acento', help: 'Precios, botones y categoría elegida' },
];

type TextKey = 'tagline' | 'menuTitle' | 'notice' | 'footerText';

// Los ejemplos de los campos de texto cambian según el rubro; el título usa la etiqueta del catálogo.
function textFields(catalog: CatalogCtx): { key: TextKey; label: string; placeholder: string; max: number; multiline?: boolean }[] {
  const { isFood, labels } = catalog;
  return [
    { key: 'tagline', label: 'Frase bajo tu nombre', placeholder: isFood ? 'Cevichería criolla desde 1998' : 'Atención personalizada desde 1998', max: 90 },
    { key: 'menuTitle', label: 'Título de la página', placeholder: labels.catalog, max: 60 },
    { key: 'notice', label: 'Aviso', placeholder: isFood ? 'Los precios incluyen IGV. Tiempo de preparación: 20 minutos.' : 'Los precios incluyen IGV. Atención con cita previa.', max: 160 },
    { key: 'footerText', label: 'Texto del pie', placeholder: 'Av. Principal 123, Miraflores\nReservas: 999 888 777', max: 240, multiline: true },
  ];
}

// Personalización de la página pública: colores del encabezado, cuerpo y pie, y textos adicionales.
// El color del texto se ajusta solo para que siempre se lea.
export default function MenuDesign({ placeId, logoUrl, placeName, catalog }: { placeId: string; logoUrl: string; placeName?: string; catalog: CatalogCtx }) {
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
  const { isFood, labels } = catalog;

  const save = async () => {
    setSaving(true);
    try {
      const res = await businessApi.setMenuTheme(placeId, theme);
      setTheme(res || {});
      setSaved(JSON.stringify(res || {}));
      toast.success('Diseño guardado. Tu página ya se ve así.');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo guardar el diseño');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card padding="lg" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-text">Colores y textos</h3>
          <p className="mt-0.5 text-sm text-text-muted">Elige los colores y los textos que ve quien abre el enlace. El color de las letras se ajusta solo para que siempre se lean.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setTheme({})} disabled={loading || Object.keys(theme).length === 0}>
            Volver al diseño original
          </Button>
          <Button onClick={save} loading={saving} disabled={loading || !dirty}>Guardar diseño</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-medium text-text">Combinaciones listas</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => set(p.theme)}
                  className="flex min-h-11 items-center gap-2 rounded-control border border-border px-3 text-sm font-medium text-text transition-colors duration-200 motion-reduce:transition-none hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <span aria-hidden className="flex overflow-hidden rounded-md border border-border">
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
                  <span className="mb-1.5 block text-sm font-medium text-text">{label}</span>
                  <span className="flex items-center gap-3">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => set({ [key]: e.target.value.toUpperCase() })}
                      className="h-11 w-14 shrink-0 cursor-pointer rounded-control border border-border bg-surface p-1"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm tabular-nums text-text">{value}</span>
                      <span className="block truncate text-xs text-text-muted">{help}</span>
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="grid gap-4">
            {textFields(catalog).map(({ key, label, placeholder, max, multiline }) => {
              const hint = `${(theme[key] ?? '').length}/${max}`;
              return multiline ? (
                <Textarea key={key} label={label} hint={hint} rows={2} maxLength={max} placeholder={placeholder} value={theme[key] ?? ''} onChange={(e) => set({ [key]: e.target.value })} />
              ) : (
                <Input key={key} label={label} hint={hint} maxLength={max} placeholder={placeholder} value={theme[key] ?? ''} onChange={(e) => set({ [key]: e.target.value })} />
              );
            })}
          </div>

          <p className="text-sm text-text-muted">
            {logoUrl ? 'Tu logo aparece junto al nombre, en el encabezado. Puedes cambiarlo en la tarjeta "Logo del negocio" de arriba.' : 'Sube tu logo en la tarjeta "Logo del negocio" de arriba para que aparezca en el encabezado.'}
          </p>
        </div>

        {/* Vista previa en vivo: los colores salen del tema que elige el dueño, no de los tokens del panel. */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <p className="mb-2 text-sm font-medium text-text">Así se verá</p>
          <div className="overflow-hidden rounded-card border border-border shadow-card" style={{ background: pal.bg, color: pal.text }}>
            <div className="px-4 pb-4 pt-8" style={{ background: pal.headerBg, color: pal.headerText }}>
              <div className="flex items-end gap-3">
                {logoUrl && <img src={logoUrl} alt="" className="h-12 w-12 shrink-0 rounded-control object-cover" />}
                <div className="min-w-0">
                  <p className="truncate text-xl font-bold leading-tight">{placeName || (isFood ? 'Tu restaurante' : 'Tu negocio')}</p>
                  {theme.tagline && <p className="truncate text-xs opacity-90">{theme.tagline}</p>}
                </div>
              </div>
            </div>
            <div className="space-y-3 px-4 py-4">
              {theme.menuTitle && <p className="text-sm font-semibold" style={{ color: pal.muted }}>{theme.menuTitle}</p>}
              <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold" style={{ background: pal.food, color: pal.accentInk }}>
                {isFood ? 'Platos de fondo' : labels.catalog}
              </span>
              {theme.notice && <p className="rounded-control px-3 py-2 text-xs" style={{ background: pal.surface, border: `1px solid ${pal.line}` }}>{theme.notice}</p>}
              <div className="flex items-center justify-between rounded-card p-3" style={{ background: pal.surface }}>
                <div>
                  <p className="text-sm font-semibold">{isFood ? 'Lomo saltado' : `Ejemplo de ${labels.catalogItem.toLowerCase()}`}</p>
                  <p className="text-xs" style={{ color: pal.muted }}>{isFood ? 'Lomo fino al wok con papas' : 'Así se ve la descripción'}</p>
                </div>
                <span className="rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums" style={{ background: pal.food, color: pal.accentInk }}>S/ 38</span>
              </div>
            </div>
            <div className="px-4 py-4 text-center" style={{ background: pal.footerBg, color: pal.footerText, borderTop: `1px solid ${pal.footerLine}` }}>
              {theme.footerText && <p className="mb-2 whitespace-pre-line text-xs">{theme.footerText}</p>}
              <p className="text-xs" style={{ color: pal.footerMuted }}>Carta digital hecha con Wuarike</p>
            </div>
          </div>
          {dirty && <p className="mt-2"><Badge tone="warning">Hay cambios sin guardar</Badge></p>}
        </div>
      </div>
    </Card>
  );
}
