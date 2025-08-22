import type { Metadata } from 'next';
import FamilyHero from '@/components/by-type/family/FamilyHero';
import FamilyPlanner from '@/components/by-type/family/FamilyPlanner';
import FamilyInspiration from '@/components/by-type/family/FamilyInspiration';
import FamilyTestimonials from '@/components/by-type/family/FamilyTestimonials';
import FooterLanding from "@/components/layout/FooterLanding";

export const metadata: Metadata = {
  title: 'En Familia | Randomtrip',
};

export default function FamiliesPage() {
  return (
    <>
      <FamilyHero />
      <section id="planner" className="scroll-mt-28">
        <FamilyPlanner />
      </section>

      {/* Sección 3 */}
      <FamilyInspiration />

      {/* Sección 4 */}
      <FamilyTestimonials />
      <FooterLanding />
    </>
  );
}