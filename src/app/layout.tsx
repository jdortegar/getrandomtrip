import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import "@/styles/rt.css";
import { LenisProvider } from "@/components/providers/LenisProvider";
import {
  Barlow,
  Barlow_Condensed,
  Nothing_You_Could_Do,
} from "next/font/google";
import { JsonLd } from "@/lib/seo/JsonLd";
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
} from "@/lib/seo/schemas";

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
      { alt: "Randomtrip", height: 630, url: "/images/opengraph.jpg", width: 1200 },
    ],
    siteName: "Randomtrip",
    type: "website",
  },
  title: "Randomtrip",
  twitter: {
    card: "summary_large_image",
    images: ["/images/opengraph.jpg"],
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
      <body className="bg-white text-neutral-900 antialiased overflow-x-hidden font-barlow">
        <JsonLd schema={buildOrganizationSchema()} />
        <JsonLd schema={buildWebSiteSchema()} />
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
