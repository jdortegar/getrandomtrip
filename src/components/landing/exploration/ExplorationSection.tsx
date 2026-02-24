'use client';

import React, { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import Section from '@/components/layout/Section';
import { TabSelector } from '@/components/ui/TabSelector';
import type { TravelerType } from '@/lib/data/travelerTypes';
import { TopTrippersGrid } from './TopTrippersGrid';
import { TravelerTypesCarousel } from './TravelerTypesCarousel';

interface ExplorationTab {
  href?: string;
  id: string;
  label: string;
}

interface ExplorationSectionProps {
  comingSoonText: string;
  eyebrow: string;
  subtitle: string;
  tabs: ExplorationTab[];
  title: string;
  trippers?: Array<{
    avatarUrl: string | null;
    bio: string | null;
    id: string;
    instagramUrl?: string | null;
    name: string;
    tripperSlug: string | null;
  }>;
  trippersButtonText: string;
  trippersHref: string;
  travelerTypes?: TravelerType[];
}

function ComingSoon({ message }: { message: string }) {
  return (
    <div className="py-4">
      <p className="text-center font-jost text-lg italic text-gray-600">
        {message}
      </p>
    </div>
  );
}

export function ExplorationSection({
  comingSoonText,
  eyebrow,
  subtitle,
  tabs,
  title,
  trippers = [],
  trippersButtonText,
  trippersHref,
  travelerTypes,
}: ExplorationSectionProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? 'byTraveller');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'byTraveller':
        return (
          <TravelerTypesCarousel
            fullViewportWidth
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
        return (
          <TravelerTypesCarousel
            fullViewportWidth
            travelerTypes={travelerTypes}
          />
        );
    }
  };

  const tabSelectorTabs = tabs.map((tab) => ({
    disabled: false,
    href: tab.href,
    id: tab.id,
    label: tab.label,
  }));

  return (
    <Section
      className="relative flex min-h-screen items-center overflow-hidden py-20"
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
          tabs={tabSelectorTabs}
        />
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          className="container mx-auto mt-12 flex justify-center px-4 md:px-20"
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
