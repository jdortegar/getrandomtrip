'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TrustSignals from '../TrustSignals';
import { TabSelector } from '../ui/TabSelector';
import { BudgetBandsSection } from '@/components/BudgetBandsSection';
import BenefitsCardsOnly from '../BenefitsCardsOnly';
import HowItWorksSection from '../HowItWorks';

const HOME_INFO_CAROUSEL_CONSTANTS = {
  SECTION_ARIA_LABEL: 'Información del viaje',
  TITLE: 'Tu aventura te espera',
  SUBTITLE:
    'Descubre cómo funciona Random Trip y por qué miles de viajeros confían en nosotros para sus aventuras.',
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
      id: 'budget',
      label: 'Presupuestos',
      contentKey: 'budgetBands',
    },
  ],
};

export default function HomeInfoCarousel({
  className = '',
  variant = 'default',
}: {
  className?: string;
  variant?: 'default' | 'compact';
} = {}) {
  const [activeTab, setActiveTab] = useState<string>(
    HOME_INFO_CAROUSEL_CONSTANTS.TABS[0].id,
  );

  const renderActiveTab = () => {
    const currentTab = HOME_INFO_CAROUSEL_CONSTANTS.TABS.find(
      (tab) => tab.id === activeTab,
    );
    if (!currentTab) return null;

    switch (currentTab.contentKey) {
      case 'howItWorks':
        return <HowItWorksSection />;

      case 'benefits':
        return <BenefitsCardsOnly />;

      case 'budgetBands':
        return <BudgetBandsSection variant={variant} defaultOpenDetails />;

      default:
        return null;
    }
  };

  return (
    <section
      aria-label={HOME_INFO_CAROUSEL_CONSTANTS.SECTION_ARIA_LABEL}
      className={`bg-white text-gray-900 py-16 px-4 md:px-8`}
    >
      {/* Header Section */}
      <div className="mb-8">
        <h2
          data-testid="journey-title"
          tabIndex={-1}
          className="font-caveat text-6xl md:text-5xl font-bold mb-6 text-gray-900 text-center"
        >
          {HOME_INFO_CAROUSEL_CONSTANTS.TITLE}
        </h2>
        <p className="font-jost text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
          {HOME_INFO_CAROUSEL_CONSTANTS.SUBTITLE}
        </p>
      </div>

      {/* Tab Navigation */}
      <TabSelector
        tabs={HOME_INFO_CAROUSEL_CONSTANTS.TABS}
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
          className="w-full overflow-hidden min-h-[300px]"
        >
          {renderActiveTab()}
        </motion.div>
      </AnimatePresence>
      {/* Trust Signals */}
      <TrustSignals variant="compact" />
    </section>
  );
}
