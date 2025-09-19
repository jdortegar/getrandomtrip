'use client';

import React from 'react';
import { motion } from 'framer-motion';
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
    <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8">
      <div className="relative flex flex-wrap justify-center gap-8 md:gap-12">
        {EXPLORATION_CONSTANTS.TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative px-4 py-3 font-jost font-medium transition-all duration-300 text-lg
              ${
                activeTab === tab.id
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }
            `}
            aria-label={`Switch to ${tab.label} tab`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                layoutId="activeTab"
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 30,
                }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
