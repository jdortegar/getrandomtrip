import type { Metadata } from "next";
import MinimalHeader from "@/components/layout/MinimalHeader";

export const metadata: Metadata = {
  title: "Randomtrip",
};

export default function ByTypeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white">
      <MinimalHeader />
      {children}
    </div>
  );
}
