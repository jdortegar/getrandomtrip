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
import Section from './layout/Section';

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
    <Section
      className="flex min-h-screen flex-col justify-center py-20"
      subtitle={HOME_INFO_CONSTANTS.SUBTITLE}
      title={HOME_INFO_CONSTANTS.TITLE}
    >
      {/* Tab Navigation */}
      <TabSelector
        activeTab={activeTab}
        layoutId="activeTabHomeInfo"
        onTabChange={setActiveTab}
        tabs={HOME_INFO_CONSTANTS.TABS}
      />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          className="mx-auto w-full max-w-5xl min-h-[300px]"
          exit={{ opacity: 0, y: -20, height: 0 }}
          initial={{ opacity: 0, y: 20, height: 0 }}
          key={activeTab}
          transition={{
            duration: 0.5,
            ease: 'easeInOut',
            height: { duration: 0.4, ease: 'easeInOut' },
          }}
        >
          {renderActiveTab()}
        </motion.div>
      </AnimatePresence>

      {/* CTA - Enhanced */}
      <div className="mt-12 flex justify-center">
        <Button
          asChild
          className="shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30"
          size="lg"
          variant="default"
        >
          <Link href="#exploration-section" scroll={true}>
            RANDOMTRIP-ME!
          </Link>
        </Button>
      </div>

      {/* Trust Signals - Full Width */}
      <div className="relative left-1/2 right-1/2 -mx-[50vw] mt-12 w-screen">
        <TrustSignals variant="compact" />
      </div>
    </Section>
  );
}
