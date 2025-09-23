'use client';

import React from 'react';
import { HowItWorksProps } from './landing/HowItWorks/HowItWorks.types';
import { HOW_IT_WORKS_CONSTANTS } from '@/lib/data/how-it-works';
import { HowItWorksStep } from './HowItWorks.Step';
import { Button } from '@/components/ui/Button';

export default function HowItWorksSection({}: HowItWorksProps) {
  return (
    <section
      aria-label={HOW_IT_WORKS_CONSTANTS.SECTION_ARIA_LABEL}
      className="mt-4"
    >
      <div className="max-w-7xl mx-auto py-6">
        <p className="text-center text-gray-600 italic font-jost text-lg mb-6">
          {HOW_IT_WORKS_CONSTANTS.SUBTITLE}
        </p>

        {/* Steps */}
        <ol className={'grid md:grid-cols-3 gap-8'} role="list">
          {HOW_IT_WORKS_CONSTANTS.STEPS.map((step) => (
            <HowItWorksStep key={step.title} step={step} />
          ))}
        </ol>

        {/* Note */}
        <p className={'mt-4 text-xs text-neutral-500 text-center'}>
          {HOW_IT_WORKS_CONSTANTS.NOTE}
        </p>
      </div>
    </section>
  );
}
