export interface MenuTheme {
  headerBg?: string;
  bodyBg?: string;
  footerBg?: string;
  accent?: string;
  tagline?: string;
  menuTitle?: string;
  notice?: string;
  footerText?: string;
}

export const DEFAULT_THEME = {
  headerBg: '#14110F',
  bodyBg: '#14110F',
  footerBg: '#14110F',
  accent: '#F2A900',
} as const;

// Combinaciones listas para elegir con un toque.
export const PRESETS: { id: string; label: string; theme: Required<Pick<MenuTheme, 'headerBg' | 'bodyBg' | 'footerBg' | 'accent'>> }[] = [
  { id: 'carbon', label: 'Carbón y ají', theme: { headerBg: '#14110F', bodyBg: '#14110F', footerBg: '#14110F', accent: '#F2A900' } },
  { id: 'mantel', label: 'Mantel claro', theme: { headerBg: '#1F3A2E', bodyBg: '#F7F3EA', footerBg: '#1F3A2E', accent: '#C8452C' } },
  { id: 'rocoto', label: 'Rocoto', theme: { headerBg: '#7A1420', bodyBg: '#FFF8F0', footerBg: '#7A1420', accent: '#D9381E' } },
  { id: 'costa', label: 'Costa', theme: { headerBg: '#0E3B43', bodyBg: '#F2F8F8', footerBg: '#0E3B43', accent: '#C25E12' } },
];

const hex = (c: string) => {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};
const toHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');

/** Luminancia relativa (WCAG) de un color #RRGGBB. */
function luminance(c: string): number {
  const [r, g, b] = hex(c).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const LIGHT_TEXT = '#F4EEE3';
const DARK_TEXT = '#1B1511';

/** Texto claro u oscuro, el que más contraste dé sobre el fondo: así nada se vuelve ilegible. */
export function readableOn(bg: string): string {
  return contrast(bg, LIGHT_TEXT) >= contrast(bg, DARK_TEXT) ? LIGHT_TEXT : DARK_TEXT;
}

export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hex(a);
  const [br, bg, bb] = hex(b);
  return toHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

const valid = (c?: string) => (c && /^#[0-9a-fA-F]{6}$/.test(c) ? c : undefined);

export interface Palette {
  headerBg: string; headerText: string; headerMuted: string;
  bg: string; text: string; muted: string; surface: string; line: string;
  footerBg: string; footerText: string; footerMuted: string; footerLine: string;
  accent: string; accentInk: string; veg: string;
  food: string; drink: string; dessert: string; other: string;
}

/** Todos los colores de la carta salen de 4 elegidos por el dueño; el resto se calcula. */
export function buildPalette(theme?: MenuTheme | null): Palette {
  const headerBg = valid(theme?.headerBg) ?? DEFAULT_THEME.headerBg;
  const bg = valid(theme?.bodyBg) ?? DEFAULT_THEME.bodyBg;
  const footerBg = valid(theme?.footerBg) ?? DEFAULT_THEME.footerBg;
  const accent = valid(theme?.accent) ?? DEFAULT_THEME.accent;

  const text = readableOn(bg);
  const dark = text === LIGHT_TEXT; // fondo oscuro
  const headerText = readableOn(headerBg);
  const footerText = readableOn(footerBg);

  return {
    headerBg, headerText, headerMuted: mix(headerText, headerBg, 0.4),
    bg, text, muted: mix(text, bg, 0.4),
    surface: mix(bg, text, dark ? 0.07 : 0.05),
    line: mix(bg, text, dark ? 0.16 : 0.14),
    footerBg, footerText, footerMuted: mix(footerText, footerBg, 0.4), footerLine: mix(footerBg, footerText, 0.18),
    accent, accentInk: readableOn(accent),
    // Sobre fondo claro los tonos pastel no se leen: se usan versiones más profundas.
    veg: dark ? '#8CC46B' : '#3F7A2A',
    // Platos usa el acento del restaurante; bebidas y postres mantienen su color propio.
    food: contrast(accent, bg) >= 3 ? accent : text,
    drink: dark ? '#5CC8C0' : '#0F7F78',
    dessert: dark ? '#F28CB1' : '#B83A72',
    other: dark ? '#C9B28A' : '#7C6234',
  };
}
