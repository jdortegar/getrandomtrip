import React from 'react';
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

export const metadata = {
  title: 'Randomtrip',
  icons: {
    icon: [{ url: '/favicon.png', sizes: 'any', type: 'image/png' }],
    shortcut: { url: '/favicon.png', type: 'image/png' },
    apple: { url: '/favicon.png' },
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
        {children}
      </body>
    </html>
  );
}
