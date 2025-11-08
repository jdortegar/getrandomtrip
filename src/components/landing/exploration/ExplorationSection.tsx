'use client';

import React, { useMemo, useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { ExplorationTabNavigation } from './ExplorationTabNavigation';
import { TravelerTypesCarousel } from './TravelerTypesCarousel';
import { TopTrippersGrid } from './TopTrippersGrid';
import { RoadtripsGrid } from './RoadtripsGrid';
// import TrippersDecodeSearch from '@/app/trippers-decode/TrippersDecodePageContent';
import { EXPLORATION_CONSTANTS } from './exploration.constants';
import Section from '@/components/layout/Section';

const ComingSoon: React.FC = () => (
  <div className="py-4">
    <p className="text-center text-gray-600 italic font-jost text-lg">
      ¡Pronto podrás explorar esta sección!
    </p>
  </div>
);

export function ExplorationSection() {
  const [activeTab, setActiveTab] = useState('By Traveller');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'By Traveller':
        return <TravelerTypesCarousel />;
      case 'Top Trippers':
        return <TopTrippersGrid />;
      case 'Roadtrips':
        return <ComingSoon />;
      case 'Trippers Decode':
        return <ComingSoon />;
      default:
        return <TravelerTypesCarousel />;
    }
  };

  return (
    <Section
      className="relative flex min-h-screen items-center overflow-hidden py-20"
      id="exploration-section"
      subtitle={EXPLORATION_CONSTANTS.SUBTITLE}
      title={EXPLORATION_CONSTANTS.TITLE}
    >
      {/* Tab Navigation */}
      <ExplorationTabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          className="mx-auto mt-8 w-full rt-container min-h-[400px]"
          exit={{ opacity: 0, y: -20, height: '400px' }}
          initial={{ opacity: 0, y: 20, height: '400px' }}
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
    </Section>
  );
}
