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
    <li className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-white via-white to-gray-50/50 p-6 shadow-xl transition-all duration-500 hover:scale-[1.05] hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/20 md:p-8">
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative z-10">
        {/* Icon and Title */}
        <div className="mb-4 flex items-start gap-3 text-primary md:mb-6 md:gap-4">
          <div className="flex h-10 min-w-[2.5rem] flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80 text-sm font-semibold text-white shadow-lg md:h-12 md:min-w-[3rem] md:text-base">
            {step.num}
          </div>
          <h4 className="font-caveat mb-0 text-2xl font-bold bg-gradient-to-br from-primary via-primary to-primary/80 bg-clip-text text-transparent leading-tight md:text-3xl">
            {step.title}
          </h4>
        </div>

        {/* Description */}
        <p className="font-jost text-sm leading-relaxed text-neutral-700 md:text-base">
          {step.description}
        </p>
      </div>
    </li>
  );
}
