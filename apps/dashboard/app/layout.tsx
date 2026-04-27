import './globals.css';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';

const poppins = Poppins({ 
  subsets: ['latin'], 
  weight: ['400', '600', '700'],
  variable: '--font-poppins'
});

export const metadata: Metadata = {
  title: 'TapWarike | Admin Control Center',
  description: 'Gestión inteligente para restaurantes de vanguardia.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${poppins.variable} font-sans bg-[#F7F8FA] text-[#1A1A1A]`}>
        {children}
      </body>
    </html>
  );
}
