import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://admin.wuarikes.com';

// Solo páginas públicas. El panel (grupo `(dashboard)`) y los enlaces con token (/q, /l, /tarjeta) quedan fuera.
// ponytail: /menu/[id] no se lista; hace falta un endpoint que enumere cartas. Agregarlo cuando exista.
const PUBLIC_ROUTES: { path: string; changeFrequency: 'daily' | 'monthly' | 'yearly'; priority: number }[] = [
  { path: '', changeFrequency: 'daily', priority: 1 },
  { path: '/explorar', changeFrequency: 'daily', priority: 0.8 },
  { path: '/login', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terminos-y-condiciones', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/politica-de-privacidad', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/politica-de-cambios-y-devoluciones', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/libro-de-reclamaciones', changeFrequency: 'yearly', priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  }));
}
