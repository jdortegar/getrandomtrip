'use client';

import FamilyHero from '@/components/by-type/family/FamilyHero';
import FamilyWizard from '@/components/by-type/family/FamilyWizard';
import FamilyBlog from '@/components/by-type/family/FamilyBlog';
import FamilyTestimonials from '@/components/by-type/family/FamilyTestimonials';

export default function FamiliesPage() {
  return (
    <main className="bg-white text-neutral-900">
      {/* 1) Hero (espejo de /solo) */}
      <FamilyHero />

      {/* 2) Planner (SECCIÓN 2) — con ancla #planner */}
      <FamilyWizard id="planner" />

      {/* 3) Inspiración (SECCIÓN 3) */}
      <FamilyBlog />

      {/* 4) Testimonios (SECCIÓN 4) */}
      <FamilyTestimonials />
    </main>
  );
}
