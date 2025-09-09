import "./globals.css";
import "@/styles/rt.css";
import { Inter, Fraunces } from "next/font/google";
import HeaderGate from "@/components/layout/HeaderGate";
import SiteHeaderOffset from "@/components/layout/SiteHeaderOffset";
import dynamic from "next/dynamic";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["normal"],
});

// Carga del client component sin SSR
const NewsletterBar = dynamic(() => import("@/components/newsletter/NewsletterBar"), { ssr: false });

export const metadata = {
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
  return (
    <html lang="es" className={`${inter.variable} ${fraunces.variable}`}>
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#fafafa" />
      </head>
      <body className="font-sans bg-neutral-50 text-neutral-900 antialiased">
        <SiteHeaderOffset />
        <HeaderGate />
        {children}
        <NewsletterBar /> {/* 👈 persistente en todo el sitio */}
      </body>
    </html>
  );
}