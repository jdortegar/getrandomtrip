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
  /** Variant: 'light' = light text for dark backgrounds, 'dark' = dark text for light backgrounds (default) */
  variant?: 'light' | 'dark';
}

export function TabSelector({
  tabs,
  activeTab,
  onTabChange,
  layoutId = 'activeTab',
  className = '',
  variant = 'dark',
}: TabSelectorProps) {
  const getButtonStyles = (isActive: boolean, disabled: boolean) => {
    if (disabled) {
      return variant === 'light'
        ? 'text-white/30 cursor-not-allowed'
        : 'text-gray-300 cursor-not-allowed';
    }
    if (isActive) {
      return variant === 'light' ? 'text-white' : 'text-gray-900';
    }
    return variant === 'light'
      ? 'text-white/60 hover:text-white/90'
      : 'text-gray-500 hover:text-gray-700';
  };

  const getUnderlineStyles = () => {
    return variant === 'light' ? 'bg-white' : 'bg-primary';
  };
  return (
    <div className={`w-full overflow-hidden ${className}`.trim()}>
      <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8">
        <div className="relative flex justify-start md:justify-center gap-6 md:gap-12 overflow-x-auto hide-scrollbar w-full px-4 md:px-0">
          {tabs.map((tab, index) => (
            <button
              aria-label={`Switch to ${tab.label} tab`}
              className={`relative flex-shrink-0 px-3 py-3 font-jost font-medium transition-all duration-300 text-base md:px-4 md:text-lg whitespace-nowrap ${getButtonStyles(activeTab === tab.id, !!tab.disabled)}`}
              disabled={tab.disabled}
              key={tab.id}
              onClick={() => !tab.disabled && onTabChange(tab.id)}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  className={`absolute bottom-0 left-0 right-0 h-0.5 ${getUnderlineStyles()}`}
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
    </div>
  );
}
