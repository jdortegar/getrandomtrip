import React from 'react';
import './globals.css';
import '@/styles/rt.css';
import {
  Barlow,
  Barlow_Condensed,
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
const nothingYouCouldDo = Nothing_You_Could_Do({
  subsets: ['latin'],
  variable: '--font-nothing-you-could-do',
  weight: ['400'],
  display: 'swap',
});

export const metadata = {
  title: 'Randomtrip',
  icons: {
    apple: [{ url: '/favicon.png', sizes: '180x180', type: 'image/png' }],
    icon: [{ url: '/favicon.png', sizes: '48x48', type: 'image/png' }],
    shortcut: [{ url: '/favicon.png', sizes: '48x48', type: 'image/png' }],
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
      className={`${barlow.variable} ${barlowCondensed.variable} ${nothingYouCouldDo.variable}`}
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
