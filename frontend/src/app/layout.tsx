import "./globals.css";
import { Inter, Fraunces } from "next/font/google";
import HeaderGate from "@/components/layout/HeaderGate";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["normal"],
});

export const metadata = { title: "Randomtrip" };

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