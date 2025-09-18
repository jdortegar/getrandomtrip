import './globals.css';
import '@/styles/rt.css';
import HeaderGate from '@/components/layout/HeaderGate';
import SiteHeaderOffset from '@/components/layout/SiteHeaderOffset';
import SessionProvider from '@/components/providers/SessionProvider';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';

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
    <html lang="es">
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#fafafa" />
      </head>
      <body className="bg-neutral-50 text-neutral-900 antialiased">
        <SessionProvider>
          {/* <SiteHeaderOffset /> */}
          {/* <HeaderGate /> */}
          <Navbar />
          {children}
          {/* <NewsletterBar /> 👈 persistente en todo el sitio */}
        </SessionProvider>
      </body>
    </html>
  );
}
