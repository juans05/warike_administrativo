import './globals.css';
import type { Metadata } from 'next';
import { Inter, Lora, Caveat } from 'next/font/google';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const lora = Lora({ subsets: ['latin'], variable: '--font-lora' });
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat' });

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PlatformSettingsInfo {
  socialInstagram: string | null;
  socialFacebook: string | null;
  socialTiktok: string | null;
  socialX: string | null;
}

async function getPlatformSettings(): Promise<PlatformSettingsInfo | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/platform-settings`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  metadataBase: new URL('https://warique.com'),
  title: 'Wuarike | SaaS de Reseñas en Google Maps con NFC para Restaurantes',
  description: 'Wuarike es un software como servicio (SaaS) por suscripción mensual que aumenta las reseñas positivas de tu restaurante en Google Maps y bloquea las negativas en privado. Incluye placas y stands NFC premium para huariques.',
  keywords: ['aumentar reseñas google', 'nfc para restaurantes', 'reputacion google maps', 'software restaurantes', 'mejorar reseñas google', 'marketing gastronomico'],
  openGraph: {
    title: 'Wuarike | Aumenta tus Reseñas en Google Maps con NFC',
    description: 'Filtra quejas en privado y multiplica tus 5 estrellas en Google automáticamente. La plataforma definitiva para restaurantes y huariques.',
    url: 'https://warique.com',
    siteName: 'Wuarike',
    locale: 'es_PE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wuarike | Reseñas Google NFC para Restaurantes',
    description: 'Tecnología invisible para resultados visibles. Atrapa quejas antes de que lleguen a Google Maps.',
  }
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getPlatformSettings();
  const sameAs = [
    settings?.socialInstagram,
    settings?.socialFacebook,
    settings?.socialTiktok,
    settings?.socialX,
  ].filter((url): url is string => Boolean(url));

  const schemaMarkup = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "Wuarike",
        "url": "https://warique.com",
        "applicationCategory": "BusinessApplication",
        "applicationSubCategory": "SaaS",
        "operatingSystem": "Web, iOS, Android",
        "description": "Software como servicio (SaaS) por suscripción mensual para restaurantes: gestión de reputación en Google Maps, fidelización de clientes y asistente de WhatsApp con IA. Incluye venta complementaria de hardware NFC.",
        "offers": [
          { "@type": "Offer", "name": "Wuarike Reputación", "price": "79", "priceCurrency": "PEN", "priceSpecification": { "@type": "UnitPriceSpecification", "price": "79", "priceCurrency": "PEN", "unitText": "mes" } },
          { "@type": "Offer", "name": "Wuarike Fidelización+", "price": "149", "priceCurrency": "PEN", "priceSpecification": { "@type": "UnitPriceSpecification", "price": "149", "priceCurrency": "PEN", "unitText": "mes" } },
          { "@type": "Offer", "name": "Wuarike IA Total", "price": "249", "priceCurrency": "PEN", "priceSpecification": { "@type": "UnitPriceSpecification", "price": "249", "priceCurrency": "PEN", "unitText": "mes" } }
        ]
      },
      {
        "@type": "Organization",
        "name": "Wuarike",
        "url": "https://warique.com",
        "logo": "https://warique.com/images/hero.png",
        ...(sameAs.length > 0 ? { sameAs } : {})
      }
    ]
  };

  return (
    <html lang="es" className={`${inter.variable} ${lora.variable} ${caveat.variable} scroll-smooth`}>
      <body className="antialiased bg-[var(--background)] text-[var(--text)]">
        <Toaster position="top-right" richColors closeButton />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
        />
      </body>
    </html>
  );
}
