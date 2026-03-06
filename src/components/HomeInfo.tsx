'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';

import { TabSelector } from './ui/TabSelector';
import { Button } from '@/components/ui/Button';
import ThreeColumns from './ThreeColumns';
import Section from './layout/Section';
import type { ThreeColumnsItem } from './ThreeColumns';

const TAB_IDS = [
  { id: 'how', contentKey: 'howItWorks' as const },
  { id: 'benefits', contentKey: 'benefits' as const },
] as const;

interface HomeInfoProps {
  benefitsSteps: ThreeColumnsItem[];
  ctaScrollTarget: string;
  ctaText: string;
  eyebrow: string;
  howItWorksSteps: ThreeColumnsItem[];
  sectionAriaLabel: string;
  tabBenefitsLabel: string;
  tabHowLabel: string;
  title: string;
}

export default function HomeInfo({
  benefitsSteps,
  ctaScrollTarget,
  ctaText,
  eyebrow,
  howItWorksSteps,
  sectionAriaLabel,
  tabBenefitsLabel,
  tabHowLabel,
  title,
}: HomeInfoProps) {
  const tabs = [
    { id: TAB_IDS[0].id, label: tabHowLabel, contentKey: TAB_IDS[0].contentKey },
    { id: TAB_IDS[1].id, label: tabBenefitsLabel, contentKey: TAB_IDS[1].contentKey },
  ];
  const [activeTab, setActiveTab] = useState<string>(tabs[0].id);

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
        <div key={activeTab}>
          {activeTab === 'how' && <ThreeColumns items={howItWorksSteps} />}
          {activeTab === 'benefits' && <ThreeColumns items={benefitsSteps} />}
        </div>
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
