import "./globals.css";
import { Inter, Fraunces } from "next/font/google";
import HeaderGate from "@/components/layout/HeaderGate";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["normal"],
});

export const metadata = {
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
  return (
    <html lang="es" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased text-neutral-900">
        <HeaderGate />
        {children}
      </body>
    </html>
  );
}