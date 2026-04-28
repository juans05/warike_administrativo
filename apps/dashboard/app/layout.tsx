import './globals.css';
import type { Metadata } from 'next';
import { Inter, Lora, Caveat } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const lora = Lora({ subsets: ['latin'], variable: '--font-lora' });
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat' });

export const metadata: Metadata = {
  title: 'Warique | Reputación & Sazón',
  description: 'Plataforma premium de gestión de reputación para huariques y restaurantes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${lora.variable} ${caveat.variable}`}>
      <body className="antialiased bg-[var(--background)] text-[var(--text)]">
        {children}
      </body>
    </html>
  );
}
