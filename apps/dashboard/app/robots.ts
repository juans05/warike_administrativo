import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://admin.wuarikes.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/inicio', '/bot', '/broadcasts', '/carta', '/chat', '/clientes', '/comunidad', '/configuracion',
          '/email-marketing', '/equipo', '/feedback', '/fidelizacion', '/ia', '/meta-ads', '/mi-cuenta',
          '/moderacion', '/plazbot', '/reportes', '/reputacion', '/social', '/suscripcion', '/suscripciones',
          '/whatsapp', '/forgot-password', '/q/', '/l/', '/tarjeta/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
