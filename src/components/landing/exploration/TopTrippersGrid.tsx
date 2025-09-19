'use client';

import React from 'react';
import TopTrippersGridComponent from '@/components/tripper/TopTrippersGrid';
import { EXPLORATION_CONSTANTS } from './exploration.constants';

export function TopTrippersGrid() {
  return (
    <div className="py-4">
      <p className="text-center text-gray-600 italic font-jost text-lg">
        {EXPLORATION_CONSTANTS.TAB_DESCRIPTIONS['Top Trippers']}
      </p>
      <TopTrippersGridComponent />
    </div>
  );
}
