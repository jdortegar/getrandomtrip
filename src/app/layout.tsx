import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "@/styles/rt.css";
import { LenisProvider } from "@/components/providers/LenisProvider";
import {
  Barlow,
  Barlow_Condensed,
  Nothing_You_Could_Do,
} from "next/font/google";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
} from "@/lib/seo/schemas";
import { DEFAULT_LOCALE, hasLocale } from "@/lib/i18n/config";

const barlow = Barlow({
  subsets: ["latin"],
  variable: "--font-barlow",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  variable: "--font-barlow-condensed",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});
const nothingYouCouldDo = Nothing_You_Could_Do({
  subsets: ["latin"],
  variable: "--font-nothing-you-could-do",
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  icons: {
    apple: [{ url: "/favicon.png", sizes: "180x180", type: "image/png" }],
    icon: [{ url: "/favicon.png", sizes: "48x48", type: "image/png" }],
    shortcut: [{ url: "/favicon.png", sizes: "48x48", type: "image/png" }],
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://getrandomtrip.com",
  ),
  openGraph: {
    images: [
      { alt: "Randomtrip", height: 630, url: "/images/opengraph.png", width: 1200 },
    ],
    siteName: "Randomtrip",
    type: "website",
  },
  title: "Randomtrip",
  twitter: {
    card: "summary_large_image",
    images: ["/images/opengraph.png"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read the locale injected by middleware (set on /en/... paths).
  // For default-locale rewrites the header is absent; fall back to DEFAULT_LOCALE.
  const headersList = await headers();
  const xLocale = headersList.get("x-locale") ?? undefined;
  const lang = hasLocale(xLocale) ? xLocale : DEFAULT_LOCALE;

  return (
    <html
      className={`${barlow.variable} ${barlowCondensed.variable} ${nothingYouCouldDo.variable}`}
      lang={lang}
    >
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#fafafa" />
      </head>
      <body className="bg-white text-neutral-900 antialiased overflow-x-hidden font-barlow">
        <JsonLd schema={buildOrganizationSchema()} />
        <JsonLd schema={buildWebSiteSchema()} />
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
