import type { Metadata } from 'next';
import { Open_Sans, Roboto } from 'next/font/google';

import './globals.css';

import { Navigation } from '@/components/Navigation';
import { SessionProvider } from '@/components/providers/SessionProvider';

const openSans = Open_Sans({
  variable: '--font-open-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
});

export const metadata: Metadata = {
  title: 'Random Trip - Luxury Travel Experiences',
  description: 'Descubre tu destino 48h antes de viajar con Random Trip',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={`${openSans.variable} ${roboto.variable} antialiased`}>
        <SessionProvider>
          <Navigation />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
