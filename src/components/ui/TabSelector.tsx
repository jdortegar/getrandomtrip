'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TabSelectorProps {
  tabs: {
    id: string;
    label: string;
    disabled?: boolean | undefined;
    href?: string | undefined;
  }[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  layoutId?: string;
}

export function TabSelector({
  tabs,
  activeTab,
  onTabChange,
  layoutId = 'activeTab',
}: TabSelectorProps) {
  return (
    <div className="flex gap-8 justify-center text-[#172C36] text-xl mb-20">
      {tabs.map((tab) => (
        <button
          // className={`relative flex-shrink-0 px-3 py-3 font-jost font-medium transition-all duration-300 text-base md:px-4 md:text-lg whitespace-nowrap ${getButtonStyles(activeTab === tab.id, !!tab.disabled)}`}
          className={cn(
            'relative cursor-pointer',
            activeTab === tab.id ? 'text-[#172C36]' : 'text-[#858585]',
          )}
          disabled={tab.disabled}
          key={tab.id}
          onClick={() => !tab.disabled && onTabChange(tab.id)}
        >
          {tab.label}
          {activeTab === tab.id && (
            <motion.div
              className={cn(
                'absolute -bottom-4 left-0 right-0 w-1/2 m-auto h-[2px] bg-[#4F96B6]',
              )}
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
  );
}
