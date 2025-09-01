import type { Metadata } from "next";

import CoupleHero from "@/components/by-type/couple/CoupleHero";
import CouplePlanner from "@/components/by-type/couple/CouplePlanner";
import CoupleInspiration from "@/components/by-type/couple/CoupleInspiration";
import Testimonials from "@/components/by-type/couple/Testimonials";
import FooterLanding from "@/components/layout/FooterLanding";

export const metadata: Metadata = {
  title: "En Pareja | Randomtrip",
};

export default function CouplePage() {
  return (
    <main className="relative">
      
      <CoupleHero />
      <CouplePlanner />
      <CoupleInspiration />
      <Testimonials />
      <FooterLanding />
    </main>
  );
}