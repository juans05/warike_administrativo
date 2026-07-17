import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Directorio de los Mejores Huariques y Restaurantes | Wuarike',
  description: 'Descubre los mejores huariques, bares y restaurantes ocultos con reseñas 100% verificadas por la comunidad mediante tecnología NFC.',
  keywords: ['mejores huariques', 'restaurantes recomendados', 'guia gastronomica', 'reseñas verificadas', 'donde comer en lima', 'huariques peru'],
  openGraph: {
    title: 'Directorio de los Mejores Huariques | Wuarike',
    description: 'Encuentra la verdadera sazón. Restaurantes ocultos y huariques validados por clientes reales.',
    url: 'https://warique.com/explorar',
    type: 'website',
  }
};

export default function ExplorarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "item": {
          "@type": "Restaurant",
          "name": "Cevichería El Puerto",
          "url": "https://warique.com/l/1",
          "image": "https://warique.com/images/hero.png"
        }
      },
      {
        "@type": "ListItem",
        "position": 2,
        "item": {
          "@type": "Restaurant",
          "name": "Ten1 Tapas",
          "url": "https://warique.com/l/2",
          "image": "https://warique.com/images/interior.png"
        }
      },
      {
        "@type": "ListItem",
        "position": 3,
        "item": {
          "@type": "Restaurant",
          "name": "Anticuchos de la Tía",
          "url": "https://warique.com/l/3",
          "image": "https://warique.com/images/stand.png"
        }
      }
    ]
  };

  return (
    <>
      {children}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />
    </>
  );
}
