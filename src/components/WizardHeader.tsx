'use client';

import React from 'react';

interface WizardStep {
  step: number;
  label: string;
}

interface WizardHeaderProps {
  steps: WizardStep[];
  currentStep: number;
  canNavigateToStep: (step: number) => boolean;
  onStepClick: (step: number) => void;
  className?: string;
  hideProgressBar?: boolean;
}

export function WizardHeader({
  steps,
  currentStep,
  canNavigateToStep,
  onStepClick,
  className = '',
  hideProgressBar = false,
}: WizardHeaderProps) {
  return (
    <div className={className}>
      <div className="rt-container px-4 md:px-8 py-6 text-center">
        {/* Wizard Progress */}

        {/* Progress Bar */}
        {!hideProgressBar && (
          <div className="flex justify-center mb-6">
            <div className="w-full max-w-xs">
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / steps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step Indicators */}
        <div className="flex justify-center">
          <div className="flex items-center space-x-8">
            {steps.map((item, index) => {
              const canNavigate = canNavigateToStep(item.step);
              const isCompleted = currentStep > item.step;
              const isCurrent = currentStep === item.step;

              return (
                <div
                  key={item.step}
                  className={`flex items-center ${
                    canNavigate
                      ? 'cursor-pointer'
                      : 'cursor-not-allowed opacity-50'
                  }`}
                  onClick={() => {
                    if (canNavigate) {
                      onStepClick(item.step);
                    }
                  }}
                >
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200
                      ${
                        isCurrent
                          ? 'bg-primary text-white'
                          : isCompleted
                            ? 'bg-green-500 text-white'
                            : canNavigate
                              ? 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                              : 'bg-neutral-100 text-neutral-400'
                      }
                    `}
                  >
                    {isCompleted ? '✓' : item.step}
                  </div>
                  <span
                    className={`
                      ml-2 text-sm font-medium transition-colors duration-200 text-left font-jost
                      ${
                        isCurrent
                          ? 'text-primary'
                          : canNavigate
                            ? 'text-neutral-600'
                            : 'text-neutral-400'
                      }
                    `}
                  >
                    {item.label}
                  </span>
                  {index < steps.length - 1 && (
                    <div
                      className={`
                        w-8 h-0.5 mx-4 transition-colors duration-200
                        ${isCompleted ? 'bg-green-500' : 'bg-neutral-200'}
                      `}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
