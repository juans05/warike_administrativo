import './globals.css';
import type { Metadata } from 'next';
import { Inter, Lora, Caveat } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const lora = Lora({ subsets: ['latin'], variable: '--font-lora' });
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat' });

export const metadata: Metadata = {
  title: 'Warique | Reputación & Sazón',
  description: 'Plataforma premium de gestión de reputación para huariques y restaurantes en Perú y España. Protege tu sazón con tecnología NFC de filtrado inteligente.',
  keywords: ['software restaurantes', 'reputacion google', 'huariques', 'stands nfc', 'mejorar reseñas google', 'software gastronómico'],
  openGraph: {
    title: 'Warique | Reputación & Sazón',
    description: 'Aumenta tus estrellas en Google hasta un 40%. La plataforma definitiva para restaurantes y huariques.',
    url: 'https://warique.com',
    siteName: 'Warique',
    locale: 'es_PE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Warique | Reputación & Sazón',
    description: 'Tecnología invisible para resultados visibles. Filtra tus reseñas negativas antes de que lleguen a Google.',
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
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "description": "Plataforma de gestión de reputación y reseñas de Google para restaurantes y huariques usando tecnología NFC.",
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
