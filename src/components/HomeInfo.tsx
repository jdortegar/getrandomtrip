'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';

import { TabSelector } from './ui/TabSelector';
import { Button } from '@/components/ui/Button';
import ThreeColumns from './ThreeColumns';
import Section from './layout/Section';
import {
  FALLBACK_BENEFITS_STEPS,
  FALLBACK_HOW_IT_WORKS_STEPS,
} from '@/lib/data/how-it-works';
import type { ThreeColumnsItem } from './ThreeColumns';

const TAB_IDS = [
  { id: 'how', contentKey: 'howItWorks' as const },
  { id: 'benefits', contentKey: 'benefits' as const },
] as const;

const DEFAULT_CTA_SCROLL_TARGET = '#exploration-section';

interface HomeInfoProps {
  /** Localized benefits steps (title, description, imageSrc, imageAlt). */
  benefitsSteps?: ThreeColumnsItem[];
  /** Anchor hash for the CTA button (e.g. #tripper-traveler-types on tripper pages). */
  ctaScrollTarget?: string;
  /** Localized copy (from dictionary). When provided, overrides defaults. */
  ctaText?: string;
  eyebrow?: string;
  /** Localized how-it-works steps (title, description, imageSrc, imageAlt). */
  howItWorksSteps?: ThreeColumnsItem[];
  sectionAriaLabel?: string;
  tabBenefitsLabel?: string;
  tabHowLabel?: string;
  title?: string;
}

export default function HomeInfo({
  benefitsSteps,
  ctaScrollTarget = DEFAULT_CTA_SCROLL_TARGET,
  ctaText = 'GETRANDOMTRIP!',
  eyebrow = 'Tres pasos, cero stress',
  howItWorksSteps,
  sectionAriaLabel,
  tabBenefitsLabel = 'Beneficios clave',
  tabHowLabel = '¿Cómo funciona?',
  title = '¿Qué hacemos?',
}: HomeInfoProps) {
  const howSteps = howItWorksSteps?.length ? howItWorksSteps : FALLBACK_HOW_IT_WORKS_STEPS;
  const benefitSteps = benefitsSteps?.length ? benefitsSteps : FALLBACK_BENEFITS_STEPS;
  const tabs = [
    { id: TAB_IDS[0].id, label: tabHowLabel, contentKey: TAB_IDS[0].contentKey },
    { id: TAB_IDS[1].id, label: tabBenefitsLabel, contentKey: TAB_IDS[1].contentKey },
  ];
  const [activeTab, setActiveTab] = useState<string>(tabs[0].id);

  const renderActiveTab = () => {
    const currentTab = tabs.find((tab) => tab.id === activeTab);
    if (!currentTab) return null;

    switch (currentTab.contentKey) {
      case 'howItWorks':
        return <ThreeColumns items={howSteps} />;
      case 'benefits':
        return <ThreeColumns items={benefitSteps} />;
      default:
        return null;
    }
  };

  return (
    <Section
      eyebrow={eyebrow}
      title={title}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <TabSelector
          activeTab={activeTab}
          layoutId="activeTabHomeInfo"
          onTabChange={setActiveTab}
          tabs={tabs.map(({ id, label }) => ({ id, label }))}
        />
      </motion.div>

      <AnimatePresence mode="wait">
        <div key={activeTab}>{renderActiveTab()}</div>
      </AnimatePresence>
      <motion.div
        className="mt-12 flex justify-center"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        <Button asChild size="lg" variant="feature">
          <Link href={ctaScrollTarget} scroll={true}>
            {ctaText}
          </Link>
        </Button>
      </motion.div>
    </Section>
  );
}
