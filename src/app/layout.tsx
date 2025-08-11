import type { Metadata } from 'next';
import { Open_Sans, Roboto } from 'next/font/google';
import './globals.css';
import { Navigation } from '@/components/Navigation';

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
  title: 'GetRandomTrip - Luxury Travel Experiences',
  description:
    'Crafting remarkable, tailor-made luxury travel experiences. Put the world in your hands with our expert travel planning.',
  keywords:
    'luxury travel, bespoke holidays, tailor-made trips, luxury vacations, travel experts',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${openSans.variable} ${roboto.variable} antialiased`}>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
