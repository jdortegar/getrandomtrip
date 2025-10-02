'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ExplorationTabNavigation } from './ExplorationTabNavigation';
import { TravelerTypesCarousel } from './TravelerTypesCarousel';
import { TopTrippersGrid } from './TopTrippersGrid';
import { RoadtripsGrid } from './RoadtripsGrid';
import { TrippersDecodeSearch } from './TrippersDecodeSearch';
import { EXPLORATION_CONSTANTS } from './exploration.constants';
import Section from '@/components/layout/Section';

const ALLOWED_TABS = new Set([
  'By Traveller',
  'Top Trippers',
  'Roadtrips',
  'Trippers Decode',
]);

function normalizeTab(input: string | null): string | null {
  if (!input) return null;
  try {
    input = decodeURIComponent(input);
  } catch {}
  input = input.replace(/\s+/g, ' ').trim();
  return ALLOWED_TABS.has(input) ? input : null;
}

export function ExplorationSection() {
  // const router = useRouter();
  // const searchParams = useSearchParams();
  // const rawTab = searchParams.get('tab');
  // const safeTab = normalizeTab(rawTab);

  const [activeTab, setActiveTab] = useState('By Traveller');

  // useEffect(() => {
  //   const tab = searchParams.get('tab');
  //   if (tab) {
  //     setActiveTab(tab);
  //     const el = document.getElementById('start-your-journey-anchor');
  //     if (el) {
  //       el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  //       const heading = document.querySelector(
  //         'section[aria-label="Comienza tu Viaje"] h2',
  //       ) as HTMLElement | null;
  //       if (heading)
  //         setTimeout(() => heading.focus({ preventScroll: true }), 350);
  //     }
  //   } else if (
  //     typeof window !== 'undefined' &&
  //     window.location.hash === '#start-your-journey-anchor'
  //   ) {
  //     const el = document.getElementById('start-your-journey-anchor');
  //     if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  //   }
  // }, [searchParams]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'By Traveller':
        return <TravelerTypesCarousel />;
      case 'Top Trippers':
        return <TopTrippersGrid />;
      case 'Roadtrips':
        return <RoadtripsGrid />;
      case 'Trippers Decode':
        return <TrippersDecodeSearch />;
      default:
        return <TravelerTypesCarousel />;
    }
  };

  return (
    <Section
      title={EXPLORATION_CONSTANTS.TITLE}
      subtitle={EXPLORATION_CONSTANTS.SUBTITLE}
      id="exploration-section"
    >
      {/* Tab Navigation */}
      <ExplorationTabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
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
          className="w-full mt-6 min-h-[300px] max-w-5xl mx-auto"
        >
          {renderActiveTab()}
        </motion.div>
      </AnimatePresence>
    </Section>
  );
}
