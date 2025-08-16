import type { Metadata } from "next";
import MinimalHeader from "@/components/by-type/couple/MinimalHeader";

export const metadata: Metadata = {
  title: "Randomtrip",
};

export default function ByTypeLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-white">
        <MinimalHeader />
        {children}
      </body>
    </html>
  );
}