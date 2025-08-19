'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import FamilyIntro from '@/components/by-type/family/FamilyIntro';
import FamilyPlanner from '@/components/by-type/family/FamilyPlanner';
import { usePlannerStore } from '@/stores/planner';

// Placeholder components that were restored
import FamilyHero from '@/components/by-type/family/FamilyHero';
import FamilyBlog from '@/components/by-type/family/FamilyBlog';
import FamilyTestimonials from '@/components/by-type/family/FamilyTestimonials';

export default function FamiliesPage() {
  const [showPlanner, setShowPlanner] = useState(false);
  const plannerRef = useRef<HTMLDivElement | null>(null);

  // Función ÚNICA para abrir el planner desde cualquier CTA
  const openPlanner = useCallback((step: 'budget' | 'type' | 'mood' = 'budget') => {
    if (!showPlanner) {
      setShowPlanner(true);
    }
    // Usamos un timeout corto para asegurar que el DOM se actualice antes de hacer scroll
    setTimeout(() => {
      plannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }, [showPlanner]);

  // Auto-abrir planner si la URL contiene #planner o ?step=
  useEffect(() => {
    const hasPlannerHash = window.location.hash.includes('planner');
    const stepParam = new URLSearchParams(window.location.search).get('step');
    if (hasPlannerHash || stepParam) {
      openPlanner((stepParam as any) ?? 'budget');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listener para que cualquier link a #planner abra el planner
  useEffect(() => {
    const handler = (e: Event) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href*="#planner"]');
      if (anchor) {
        e.preventDefault();
        const step = new URL(anchor.href).searchParams.get('step');
        openPlanner((step as any) ?? 'budget');
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [openPlanner]);

  return (
    <main className="bg-white">
      {/* Sección 1: Hero */}
      <FamilyHero />

      {/* Sección 2: Carátula y Planner unificados */}
      <section id="intro-planner-section">
        <FamilyIntro onStart={() => openPlanner('budget')} />
        <div ref={plannerRef} className="scroll-mt-20">
          {showPlanner && <FamilyPlanner initialStep="budget" />}
        </div>
      </section>

      {/* Sección 3: Testimonials */}
      <FamilyTestimonials />

      {/* Sección 4: Blog */}
      <FamilyBlog />
    </main>
  );
}
