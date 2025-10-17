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
    <li className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-white via-white to-gray-50/50 p-8 shadow-xl transition-all duration-500 hover:scale-[1.05] hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/20">
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative z-10">
        {/* Icon and Title */}
        <div className="mb-6 flex items-start gap-4 text-primary">
          <div className="flex h-12 min-w-[3rem] flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80 text-base font-semibold text-white shadow-lg">
            {step.num}
          </div>
          <h4 className="font-caveat mb-0 text-3xl font-bold bg-gradient-to-br from-primary via-primary to-primary/80 bg-clip-text text-transparent leading-tight">
            {step.title}
          </h4>
        </div>

        {/* Description */}
        <p className="font-jost text-base leading-relaxed text-neutral-700">
          {step.description}
        </p>
      </div>
    </li>
  );
}
