'use client';

import { ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  description: string;
  isComplete: boolean;
  number: number;
  title: string;
}

interface JourneyProgressSidebarProps {
  className?: string;
  currentStep: number;
  onBack?: () => void;
  progress: number;
  steps: Step[];
  user?: {
    avatar?: string;
    name?: string;
  };
}

export default function JourneyProgressSidebar({
  className,
  currentStep,
  onBack,
  progress,
  steps,
  user,
}: JourneyProgressSidebarProps) {
  return (
    <aside
      className={cn(
        'w-full md:w-80 flex-shrink-0 bg-white p-6 space-y-8',
        className,
      )}
    >
      {/* Progress Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-left gap-10 text-xs">
          <span className="text-sm font-bold text-gray-700">Progreso</span>
          <span className="text-sm font-bold text-[#4F96B6]">{progress}%</span>
        </div>

        {/* Steps */}
        <div className="relative">
          {steps.map((step, index) => {
            const isActive = step.number === currentStep;
            const isCompleted = step.isComplete || step.number < currentStep;
            const isUpcoming = step.number > currentStep;

            return (
              <div key={step.number} className="relative flex gap-4 pb-8">
                {/* Vertical Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute left-5 top-10 w-0.5',
                      isCompleted
                        ? 'bg-[#4F96B6]'
                        : isActive
                          ? 'bg-blue-300'
                          : 'bg-gray-200',
                    )}
                    style={{ height: 'calc(100% - 2rem)' }}
                  />
                )}

                {/* Step Circle */}
                <div className="relative z-10 flex-shrink-0">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                      {
                        'bg-[#4F96B6] text-white': isActive || isCompleted,
                        'bg-white border-2 border-gray-300 text-gray-400':
                          isUpcoming,
                      },
                    )}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : step.number}
                  </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 pt-1">
                  <h3
                    className={cn('text-sm font-semibold mb-1', {
                      'text-gray-900': isActive || isCompleted,
                      'text-gray-400': isUpcoming,
                    })}
                  >
                    {step.title}
                  </h3>
                  <p
                    className={cn(
                      'text-xs leading-relaxed font-barlow-condensed',
                      {
                        'text-gray-600': isActive || isCompleted,
                        'text-gray-400': isUpcoming,
                      },
                    )}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
