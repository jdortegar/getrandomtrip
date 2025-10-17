'use client';

import React from 'react';
import { HOW_IT_WORKS_CONSTANTS } from '@/lib/data/how-it-works';
import { Button } from '@/components/ui/button';
import { HowItWorksStep } from './HowItWorks.Step';

export default function HowItWorksSection() {
  return (
    <div
      aria-label={HOW_IT_WORKS_CONSTANTS.SECTION_ARIA_LABEL}
      className="mt-4"
      data-testid="how-it-works"
    >
      <div className="mx-auto max-w-7xl py-8">
        <p className="font-jost mb-10 text-center text-xl italic text-gray-600">
          {HOW_IT_WORKS_CONSTANTS.SUBTITLE}
        </p>

        {/* Steps */}
        <ol className="grid gap-8 md:grid-cols-3" role="list">
          {HOW_IT_WORKS_CONSTANTS.STEPS.map((step) => (
            <HowItWorksStep key={step.title} step={step} />
          ))}
        </ol>

        {/* Note */}
        <p className="mt-10 text-center text-sm text-neutral-500">
          {HOW_IT_WORKS_CONSTANTS.NOTE}
        </p>
      </div>
    </div>
  );
}
