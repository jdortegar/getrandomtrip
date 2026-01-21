'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Substep {
  description: string;
  id: string;
  title: string;
}

interface ContentTab {
  id: string;
  label: string;
  substeps: Substep[];
}

interface JourneyProgressSidebarProps {
  activeTab: string;
  className?: string;
  tabs: ContentTab[];
}

export default function JourneyProgressSidebar({
  activeTab,
  className,
  tabs,
}: JourneyProgressSidebarProps) {
  const getActiveTabIndex = () => {
    return tabs.findIndex((tab) => tab.id === activeTab);
  };

  const activeIndex = getActiveTabIndex();

  return (
    <aside
      className={cn(
        'w-full md:w-80 flex-shrink-0 bg-white p-6',
        className,
      )}
    >
      <div className="relative pl-5">
       

        {/* Steps */}
        <div className="space-y-8">
          {tabs.map((tab, tabIndex) => {
            const isActive = tab.id === activeTab;
            const isCompleted = tabIndex < activeIndex;
            const isUpcoming = tabIndex > activeIndex;
            const stepNumber = tabIndex + 1;
            const hasSubsteps = tab.substeps.length > 0;
            const lastTabIndex = tabs.length - 1;

            return (
              <div key={tab.id} className="relative">
                {/* Connecting line from main circle to next step */}
                {tabIndex < tabs.length - 1 && (
                  <div
                    className={cn(
                      'absolute left-[20px] top-10 w-0.5',
                      {
                        'bg-[#4F96B6]': isActive || isCompleted,
                        'bg-gray-300': isUpcoming,
                      },
                    )}
                    style={{
                      bottom: '-2rem',
                    }}
                  />
                )}

                {/* Main Step Circle */}
                <div className="flex items-start gap-4">
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={cn(
                        'relative w-10 h-10 rounded-full flex items-center justify-center text-base font-bold transition-all',
                        {
                          'bg-[#4F96B6] text-white': isCompleted,
                          'bg-white border-2 border-[#4F96B6] text-[#4F96B6]':
                            isActive && !isCompleted,
                          'bg-white border-2 border-gray-300 text-gray-400':
                            isUpcoming,
                        },
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6" strokeWidth={3} />
                      ) : (
                        stepNumber
                      )}
                    </div>
                  </div>

                  {/* Main Step Heading */}
                  <div className="flex-1 pt-1">
                    <h2
                      className={cn('text-lg font-bold mb-6', {
                        'text-gray-900': isActive || isCompleted,
                        'text-gray-400': isUpcoming,
                      })}
                    >
                      {tabIndex === 0 ? tab.label : `${stepNumber} ${tab.label}`}
                    </h2>

                    {/* Substeps */}
                    {hasSubsteps && (
                      <div className="space-y-6 ml-0">
                        {tab.substeps.map((substep, substepIndex) => {
                          const isSubstepActive =
                            isActive && substepIndex === 0;
                          const isSubstepCompleted =
                            isCompleted ||
                            (isActive && substepIndex < tab.substeps.length);
                          const isLastSubstep =
                            substepIndex === tab.substeps.length - 1;

                          return (
                            <div
                              key={substep.id}
                              className="relative flex items-start gap-3"
                            >
                              {/* Horizontal line connecting to vertical timeline */}
                              <div
                                className={cn(
                                  'absolute top-[7px] h-0.5',
                                  {
                                    'bg-[#4F96B6]':
                                      isSubstepActive || isSubstepCompleted,
                                    'bg-gray-300':
                                      !isSubstepActive && !isSubstepCompleted,
                                  },
                                )}
                                style={{ width: '40px', left: '-36px' }}
                              />

                              {/* Substep Bullet */}
                              <div className="relative z-10 flex-shrink-0 mt-1">
                                <div
                                  className={cn(
                                    'w-2 h-2 rounded-full',
                                    {
                                      'bg-[#4F96B6]':
                                        isSubstepActive || isSubstepCompleted,
                                      'bg-white border border-gray-300':
                                        !isSubstepActive && !isSubstepCompleted,
                                    },
                                  )}
                                />
                              </div>

                              {/* Substep Content */}
                              <div className="flex-1">
                                <h3
                                  className={cn(
                                    'text-sm font-bold uppercase mb-1',
                                    {
                                      'text-[#4F96B6]':
                                        isSubstepActive || isSubstepCompleted,
                                      'text-gray-400':
                                        !isSubstepActive && !isSubstepCompleted,
                                    },
                                  )}
                                >
                                  {substep.title}
                                </h3>
                                <p
                                  className={cn('text-xs leading-relaxed', {
                                    'text-gray-700':
                                      isSubstepActive || isSubstepCompleted,
                                    'text-gray-400':
                                      !isSubstepActive && !isSubstepCompleted,
                                  })}
                                >
                                  {substep.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
