import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Randomtrip",
};

export default function ByTypeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white">
      <Navbar />
      {children}
    </div>
  );
}
