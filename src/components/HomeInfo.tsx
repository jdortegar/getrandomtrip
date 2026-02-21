'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';

import { TabSelector } from './ui/TabSelector';
import { Button } from '@/components/ui/Button';
import ThreeColumns from './ThreeColumns';
import Section from './layout/Section';
import {
  HOW_IT_WORKS_CONSTANTS,
  BENEFITS_CONSTANTS,
} from '@/lib/data/how-it-works';

// Constants
const HOME_INFO_CONSTANTS = {
  EYEBROW: 'Tres pasos, cero stress',
  TITLE: '¿Qué hacemos?',
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
  ],
  SECTION_ARIA_LABEL: 'Información sobre Random Trip',
};

const DEFAULT_CTA_SCROLL_TARGET = '#exploration-section';

interface HomeInfoProps {
  /** Anchor hash for the CTA button (e.g. #tripper-traveler-types on tripper pages). */
  ctaScrollTarget?: string;
}

export default function HomeInfo({ ctaScrollTarget = DEFAULT_CTA_SCROLL_TARGET }: HomeInfoProps) {
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
        return <ThreeColumns items={HOW_IT_WORKS_CONSTANTS.STEPS} />;

      case 'benefits':
        return <ThreeColumns items={BENEFITS_CONSTANTS.STEPS} />;

      default:
        return null;
    }
  };

  return (
    <Section
      eyebrow={HOME_INFO_CONSTANTS.EYEBROW}
      // subtitle={HOME_INFO_CONSTANTS.SUBTITLE}
      title={HOME_INFO_CONSTANTS.TITLE}
    >
      {/* Tab Navigation */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <TabSelector
          activeTab={activeTab}
          layoutId="activeTabHomeInfo"
          onTabChange={setActiveTab}
          tabs={HOME_INFO_CONSTANTS.TABS.map(({ id, label }) => ({
            id,
            label,
          }))}
        />
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <div key={activeTab}>{renderActiveTab()}</div>
      </AnimatePresence>
      {/* CTA - Enhanced */}
      <motion.div
        className="mt-12 flex justify-center"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        <Button asChild size="lg" variant="feature">
          <Link href={ctaScrollTarget} scroll={true}>
            GETRANDOMTRIP!
          </Link>
        </Button>
      </motion.div>
    </Section>
  );
}
