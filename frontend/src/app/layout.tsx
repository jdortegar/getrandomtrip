import type { Metadata } from 'next';
import Script from 'next/script';
import "./globals.css";
import { Inter, Fraunces } from "next/font/google";
import HeaderGate from "@/components/layout/HeaderGate";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["normal"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://getrandomtrip.com'),
  title: "Randomtrip",
  icons: {
    icon: [
      { url: "/assets/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: { url: "/assets/icons/favicon-32x32.png", type: "image/png" },
    apple: { url: "/assets/icons/favicon-32x32.png" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://getrandomtrip.com';

  const ldGlobal = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        url: base,
        name: 'Randomtrip',
        inLanguage: 'es',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${base}/tripper-finder?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        name: 'Randomtrip',
        url: base,
        logo: `${base}/images/journey-types/paws-card.jpg`,
        sameAs: [],
        contactPoint: [{
          '@type': 'ContactPoint',
          contactType: 'customer support',
          availableLanguage: ['es'],
        }],
      },
    ],
  };

  return (
    <html lang="es" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased text-neutral-900">
        <Script id="ld-json-global" type="application/ld+json">
          {JSON.stringify(ldGlobal)}
        </Script>
        <HeaderGate />
        {children}
      </body>
    </html>
  );
}