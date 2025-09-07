'use client';

import React from 'react';
import AutoTabsCarousel from '@/components/common/AutoTabsCarousel';
import BenefitsCardsOnly from '@/components/landing/BenefitsCardsOnly';
import { BudgetBandsSection } from '@/app/BudgetBandsSection';
import HowItWorksSection from '@/components/landing/HowItWorks';

export default function HomeInfoCarousel() {
  const tabs = [
    { id: 'how', label: '¿Cómo funciona?', content: <HowItWorksSection variant="compact" /> },
    { id: 'benefits', label: 'Beneficios clave', content: <BenefitsCardsOnly /> },
    { id: 'bands', label: 'Bandas & modos de viaje', content: <BudgetBandsSection variant="compact" defaultOpenDetails /> },
  ];

  return (
    <section className="py-16 px-6 sm:px-8 bg-white text-neutral-900">
      <div className="max-w-7xl mx-auto">
        <AutoTabsCarousel tabs={tabs} autoAdvanceMs={7000} className="py-8" />
      </div>
    </section>
  );
}