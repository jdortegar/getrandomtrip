import type { Metadata } from "next";
import MinimalHeader from "@/components/layout/MinimalHeader";
import CoupleHero from "@/components/by-type/couple/CoupleHero";
import CoupleIntro from "@/components/by-type/couple/CoupleIntro";
import ExperienceLevels from "@/components/by-type/couple/ExperienceLevels";
import FavoritePlaces from "@/components/by-type/couple/FavoritePlaces";
import Testimonials from "@/components/by-type/couple/Testimonials";

export const metadata: Metadata = {
  title: "En Pareja | Randomtrip",
};

export default function CouplePage() {
  return (
    <main className="relative">
      <MinimalHeader />
      <CoupleHero />
      <CoupleIntro />
      <ExperienceLevels />
      <FavoritePlaces />
      <Testimonials />
    </main>
  );
}