import React, { Suspense } from 'react';
import './globals.css';
import '@/styles/rt.css';
import {
  Barlow,
  Barlow_Condensed,
  Inter,
  Fraunces,
  Jost,
  Caveat,
  Nothing_You_Could_Do,
} from 'next/font/google';
import HeaderGate from '@/components/layout/HeaderGate';
import SiteHeaderOffset from '@/components/layout/SiteHeaderOffset';
import SessionProvider from '@/components/providers/SessionProvider';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import Footer from '@/components/layout/Footer';
import AppTracking from '@/components/tracking/AppTracking';
import { Toaster } from '@/components/ui/toaster';

const barlow = Barlow({
  subsets: ['latin'],
  variable: '--font-barlow',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  display: 'swap',
});
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  variable: '--font-barlow-condensed',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  display: 'swap',
});
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['400', '500', '600', '700'],
  style: ['normal'],
});
const jost = Jost({
  subsets: ['latin'],
  variable: '--font-jost',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});
const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});
const nothingYouCouldDo = Nothing_You_Could_Do({
  subsets: ['latin'],
  variable: '--font-nothing-you-could-do',
  weight: ['400'],
  display: 'swap',
});

// Carga del client component sin SSR
const NewsletterBar = dynamic(
  () => import('@/components/newsletter/NewsletterBar'),
  { ssr: false },
);

export const metadata = {
  title: 'Randomtrip',
  icons: {
    icon: [
      {
        url: '/assets/icons/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
    shortcut: { url: '/assets/icons/favicon-32x32.png', type: 'image/png' },
    apple: { url: '/assets/icons/favicon-32x32.png' },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${barlow.variable} ${barlowCondensed.variable} ${inter.variable} ${fraunces.variable} ${jost.variable} ${caveat.variable} ${nothingYouCouldDo.variable}`}
    >
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#fafafa" />
      </head>
      <body className="bg-neutral-50 text-neutral-900 antialiased overflow-x-hidden font-sans">
        <SessionProvider>
          {/* <SiteHeaderOffset /> */}
          {/* <HeaderGate /> */}
          <Suspense fallback={null}>
            <AppTracking />
          </Suspense>
          <Navbar />
          {children}
          <Footer />
          {/* <NewsletterBar /> 👈 persistente en todo el sitio */}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
