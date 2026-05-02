import './globals.css';
import type { Metadata } from 'next';
import { Inter, Lora, Caveat } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const lora = Lora({ subsets: ['latin'], variable: '--font-lora' });
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat' });

export const metadata: Metadata = {
  metadataBase: new URL('https://warique.com'),
  title: 'Warique | Aumenta tus Reseñas en Google Maps con NFC para Restaurantes',
  description: 'Aumenta las reseñas positivas de tu restaurante en Google Maps y bloquea las negativas en privado. Placas y Stands NFC premium para huariques.',
  keywords: ['aumentar reseñas google', 'nfc para restaurantes', 'reputacion google maps', 'software restaurantes', 'mejorar reseñas google', 'marketing gastronomico'],
  openGraph: {
    title: 'Warique | Aumenta tus Reseñas en Google Maps con NFC',
    description: 'Filtra quejas en privado y multiplica tus 5 estrellas en Google automáticamente. La plataforma definitiva para restaurantes y huariques.',
    url: 'https://warique.com',
    siteName: 'Warique',
    locale: 'es_PE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Warique | Reseñas Google NFC para Restaurantes',
    description: 'Tecnología invisible para resultados visibles. Atrapa quejas antes de que lleguen a Google Maps.',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "Warique",
        "url": "https://warique.com",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web, iOS, Android",
        "description": "Software y hardware NFC para restaurantes que incrementa reseñas positivas en Google Maps y filtra quejas internamente.",
        "offers": {
          "@type": "Offer",
          "price": "28.90",
          "priceCurrency": "EUR"
        }
      },
      {
        "@type": "Organization",
        "name": "Warique",
        "url": "https://warique.com",
        "logo": "https://warique.com/images/hero.png",
        "sameAs": [
          "https://instagram.com/warique_app"
        ]
      }
    ]
  };

  return (
    <html lang="es" className={`${inter.variable} ${lora.variable} ${caveat.variable}`}>
      <body className="antialiased bg-[var(--background)] text-[var(--text)]">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
        />
      </body>
    </html>
  );
}
