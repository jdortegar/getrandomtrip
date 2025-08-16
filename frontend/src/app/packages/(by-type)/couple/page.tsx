import type { Metadata } from "next";

import CoupleHero from "@/components/by-type/couple/CoupleHero";
import ExperienceLevels from "@/components/by-type/couple/ExperienceLevels";
import CoupleInspiration from "@/components/by-type/couple/CoupleInspiration";
import Testimonials from "@/components/by-type/couple/Testimonials";

export const metadata: Metadata = {
  title: "En Pareja | Randomtrip",
};

export default function CouplePage() {
  return (
    <main className="relative">
      
      <CoupleHero />
      <ExperienceLevels />
      <CoupleInspiration />
      <Testimonials />
    </main>
  );
}