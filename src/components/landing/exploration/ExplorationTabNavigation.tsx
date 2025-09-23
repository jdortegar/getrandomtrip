'use client';

import React from 'react';
import { TabSelector } from '@/components/ui/TabSelector';
import { EXPLORATION_CONSTANTS } from './exploration.constants';

interface ExplorationTabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ExplorationTabNavigation({
  activeTab,
  onTabChange,
}: ExplorationTabNavigationProps) {
  return (
    <TabSelector
      tabs={EXPLORATION_CONSTANTS.TABS}
      activeTab={activeTab}
      onTabChange={onTabChange}
      layoutId="activeTab"
    />
  );
}
