'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface Tab {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
}

interface TabSelectorProps {
  tabs: readonly Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  layoutId?: string;
  className?: string;
}

export function TabSelector({
  tabs,
  activeTab,
  onTabChange,
  layoutId = 'activeTab',
  className = '',
}: TabSelectorProps) {
  return (
    <div
      className={`flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 ${className}`.trim()}
    >
      <div className="relative flex flex-wrap justify-center gap-8 md:gap-12">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            className={`
              relative px-4 py-3 font-jost font-medium transition-all duration-300 text-lg
              ${
                tab.disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : activeTab === tab.id
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
              }
            `}
            aria-label={`Switch to ${tab.label} tab`}
            disabled={tab.disabled}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                layoutId={layoutId}
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
