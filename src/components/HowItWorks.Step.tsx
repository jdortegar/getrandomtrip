import React from 'react';

interface HowItWorksStepProps {
  step: {
    num: string;
    title: string;
    description: string;
    iconKey: string;
  };
}

export function HowItWorksStep({ step }: HowItWorksStepProps) {
  return (
    <li
      className={
        'relative rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-primary/20'
      }
    >
      {/* Icon and Title */}
      <div className="mb-4 flex items-center gap-3 text-primary">
        <div className="flex-shrink-0 h-10 min-w-[2.5rem] rounded-full bg-gradient-to-r from-primary to-primary/80 text-white text-sm font-semibold shadow-lg flex items-center justify-center">
          {step.num}
        </div>
        <h4 className={'text-xl md:text-2xl font-bold mb-2 font-caveat'}>
          {step.title}
        </h4>
      </div>

      {/* Description */}
      <p className={'text-sm text-neutral-700 leading-relaxed font-jost'}>
        {step.description}
      </p>
    </li>
  );
}
