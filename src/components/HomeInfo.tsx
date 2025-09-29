'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TabSelector } from './ui/TabSelector';
import TrustSignals from './TrustSignals';
import { BudgetBandsSection } from '@/components/BudgetBandsSection';
import BenefitsCardsOnly from './BenefitsCardsOnly';
import HowItWorks from './HowItWorks';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import BudgetSlider from './BudgetSlider';

// Constants
const HOME_INFO_CONSTANTS = {
  TITLE: '¿Qué es Random Trip?',
  SUBTITLE:
    'La plataforma que conecta viajeros auténticos con aventureros que buscan experiencias únicas. Descubre destinos a través de los ojos de quienes los conocen mejor.',
  TABS: [
    {
      id: 'how',
      label: '¿Cómo funciona?',
      contentKey: 'howItWorks',
    },
    {
      id: 'benefits',
      label: 'Beneficios clave',
      contentKey: 'benefits',
    },
    {
      id: 'bands',
      label: 'Bandas & modos de viaje',
      contentKey: 'budgetBands',
    },
  ] as const,
  SECTION_ARIA_LABEL: 'Información sobre Random Trip',
} as const;

export default function HomeInfo() {
  const [activeTab, setActiveTab] = useState<string>(
    HOME_INFO_CONSTANTS.TABS[0].id,
  );

  const renderActiveTab = () => {
    const currentTab = HOME_INFO_CONSTANTS.TABS.find(
      (tab) => tab.id === activeTab,
    );
    if (!currentTab) return null;

    switch (currentTab.contentKey) {
      case 'howItWorks':
        return <HowItWorks />;

      case 'benefits':
        return <BenefitsCardsOnly />;

      case 'budgetBands':
        return <BudgetSlider />;

      default:
        return null;
    }
  };

  return (
    <section
      aria-label={HOME_INFO_CONSTANTS.SECTION_ARIA_LABEL}
      className={`bg-white text-gray-900 py-16 px-4 md:px-8 `}
    >
      {/* Header Section */}
      <div className="mb-8">
        <h2
          data-testid="journey-title"
          tabIndex={-1}
          className="font-caveat text-6xl md:text-5xl font-bold mb-6 text-gray-900 text-center"
        >
          {HOME_INFO_CONSTANTS.TITLE}
        </h2>
        <p className="font-jost text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
          {HOME_INFO_CONSTANTS.SUBTITLE}
        </p>
      </div>

      {/* Tab Navigation */}
      <TabSelector
        tabs={HOME_INFO_CONSTANTS.TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        layoutId="activeTabHomeInfo"
      />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{
            duration: 0.5,
            ease: 'easeInOut',
            height: { duration: 0.4, ease: 'easeInOut' },
          }}
          className="w-full overflow-hidden min-h-[300px] max-w-5xl mx-auto"
        >
          {renderActiveTab()}
        </motion.div>
      </AnimatePresence>

      {/* CTA */}
      <div className={'mt-8 flex justify-center'}>
        <Button asChild variant="default" size="lg">
          <Link href="/?tab=By%20Traveller#start-your-journey-anchor">
            RANDOMTRIPME!
          </Link>
        </Button>
      </div>
      {/* Trust Signals */}
      <TrustSignals variant="compact" />
    </section>
  );
}
