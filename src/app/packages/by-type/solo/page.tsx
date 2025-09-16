import type { Metadata } from 'next';
import SoloHero from '@/components/by-type/solo/SoloHero';
import SoloInspiration from '@/components/by-type/solo/SoloInspiration';
import SoloTestimonials from '@/components/by-type/solo/SoloTestimonials';
import SoloPlanner from '@/components/by-type/solo/SoloPlanner';
import FooterLanding from '@/components/layout/FooterLanding';

export const metadata: Metadata = {
  title: 'Solo | Randomtrip',
};

export default function SoloPage() {
  return (
    <main>
      <SoloHero />
      <section id="planes" className="relative scroll-mt-16">
        <SoloPlanner />
      </section>
      <SoloInspiration />
      <SoloTestimonials />
      <FooterLanding />
    </main>
  );
}
