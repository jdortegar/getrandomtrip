'use client';

import React, { useMemo, useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { TravelerTypesCarousel } from './TravelerTypesCarousel';
import { TopTrippersGrid } from './TopTrippersGrid';
import { RoadtripsGrid } from './RoadtripsGrid';
// import TrippersDecodeSearch from '@/app/trippers-decode/TrippersDecodePageContent';
import { EXPLORATION_CONSTANTS } from './exploration.constants';
import Section from '@/components/layout/Section';
import { TabSelector } from '@/components/ui/TabSelector';

const ComingSoon: React.FC = () => (
  <div className="py-4">
    <p className="text-center text-gray-600 italic font-jost text-lg">
      ¡Pronto podrás explorar esta sección!
    </p>
  </div>
);

interface ExplorationSectionProps {
  trippers?: Array<{
    id: string;
    name: string;
    tripperSlug: string | null;
    avatarUrl: string | null;
    bio: string | null;
    instagramUrl?: string | null;
  }>;
}

export function ExplorationSection({ trippers = [] }: ExplorationSectionProps) {
  const [activeTab, setActiveTab] = useState('By Traveller');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'By Traveller':
        return <TravelerTypesCarousel />;
      case 'Top Trippers':
        return <TopTrippersGrid trippers={trippers} />;
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
      eyebrow={EXPLORATION_CONSTANTS.EYEBROW}
      subtitle={EXPLORATION_CONSTANTS.SUBTITLE}
      title={EXPLORATION_CONSTANTS.TITLE}
    >
      {/* Tab Navigation */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        viewport={{ once: true, margin: '-100px' }}
        whileInView={{ y: 0, opacity: 1 }}
      >
        <TabSelector
          tabs={EXPLORATION_CONSTANTS.TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          layoutId="activeTab"
        />
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          className="mt-12 flex justify-center container mx-auto md:px-20 px-4"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          {renderActiveTab()}
        </motion.div>
      </AnimatePresence>
    </Section>
  );
}
