'use client';

import React, { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import Section from '@/components/layout/Section';
import { TabSelector } from '@/components/ui/TabSelector';
import type { TravelerType } from '@/lib/data/travelerTypes';
import { TopTrippersGrid } from './TopTrippersGrid';
import { TravelerTypesCarousel } from './TravelerTypesCarousel';

export interface ExplorationContent {
  buttonTrippers: string;
  carousel: {
    ariaLabelNext: string;
    ariaLabelPrev: string;
    ariaLabelSlide: string;
  };
  comingSoonText: string;
  eyebrow: string;
  subtitle: string;
  tabs: Array<{
    disabled?: boolean;
    href?: string;
    id: string;
    label: string;
  }>;
  title: string;
  travelerTypes: {
    description: string;
    key: string;
    title: string;
  }[];
  trippersHref: string;
}

interface ExplorationSectionProps {
  content: ExplorationContent;
  trippers?: Array<{
    avatarUrl: string | null;
    bio: string | null;
    id: string;
    instagramUrl?: string | null;
    name: string;
    tripperSlug: string | null;
  }>;
  travelerTypes?: TravelerType[];
}

function ComingSoon({ message }: { message: string }) {
  return (
    <div className="py-4">
      <p className="text-center text-lg italic text-gray-600">
        {message}
      </p>
    </div>
  );
}

export function ExplorationSection({
  content,
  trippers = [],
  travelerTypes,
}: ExplorationSectionProps) {
  const {
    buttonTrippers: trippersButtonText,
    carousel,
    comingSoonText,
    eyebrow,
    subtitle,
    tabs,
    title,
    travelerTypes: localizedTravelerTypes,
    trippersHref,
  } = content;
  const [activeTab, setActiveTab] = useState(tabs[0]?.id);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'byTraveller':
        return (
          <TravelerTypesCarousel
            ariaLabelNext={carousel.ariaLabelNext}
            ariaLabelPrev={carousel.ariaLabelPrev}
            ariaLabelSlide={carousel.ariaLabelSlide}
            hideOverflow={false}
            localizedTravelerTypes={localizedTravelerTypes}
            travelerTypes={travelerTypes}
          />
        );
      case 'topTrippers':
        return (
          <TopTrippersGrid
            buttonHref={trippersHref}
            buttonText={trippersButtonText}
            trippers={trippers}
          />
        );
      case 'roadtrips':
        return <ComingSoon message={comingSoonText} />;
      case 'trippersDecode':
        return <ComingSoon message={comingSoonText} />;
      default:
        return null;
    }
  };

  return (
    <Section
      className="relative flex items-center py-20"
      eyebrow={eyebrow}
      id="exploration-section"
      subtitle={subtitle}
      title={title}
    >
      {/* Tab Navigation */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        viewport={{ once: true, margin: '-100px' }}
        whileInView={{ y: 0, opacity: 1 }}
      >
        <TabSelector
          activeTab={activeTab}
          layoutId="activeTab"
          onTabChange={setActiveTab}
          tabs={tabs}
        />
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          className="container mx-auto mt-12 flex justify-center overflow-x-visible px-4 md:px-20"
          animate={{ y: 0, opacity: 1 }}
          initial={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          {renderActiveTab()}
        </motion.div>
      </AnimatePresence>
    </Section>
  );
}
