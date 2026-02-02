'use client';

import { ArrowLeft, Check, User } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
}

interface JourneyContentNavigationProps {
  activeTab: string;
  className?: string;
  onBack?: () => void;
  onTabChange: (tabId: string) => void;
  tabs: Tab[];
  user?: {
    avatar?: string;
    name?: string;
  };
}

export default function JourneyContentNavigation({
  activeTab,
  className,
  onBack,
  onTabChange,
  tabs,
  user,
}: JourneyContentNavigationProps) {
  const searchParams = useSearchParams();

  const isTabComplete = (tabId: string): boolean => {
    const travelType = searchParams.get('travelType');
    const experience = searchParams.get('experience');
    const excuse = searchParams.get('excuse');
    const originCountry = searchParams.get('originCountry');
    const originCity = searchParams.get('originCity');
    const startDate = searchParams.get('startDate');
    const nights = searchParams.get('nights');
    const transport = searchParams.get('transport');

    switch (tabId) {
      case 'budget':
        return !!(travelType && experience);
      case 'excuse':
        return !!(travelType && experience && excuse);
      case 'details':
        return !!(originCountry && originCity && startDate && nights);
      case 'preferences':
        return !!transport;
      default:
        return false;
    }
  };

  return (
    <nav
      className={cn('w-full bg-white border-b border-gray-200 py-4', className)}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-center">
          {/* Left Section: User Profile & Back Button */}
          <div className="flex items-center gap-4">
            {/* User Profile */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                {user?.avatar ? (
                  <img
                    alt={user.name || 'User'}
                    className="w-full h-full rounded-full object-cover"
                    src={user.avatar}
                  />
                ) : (
                  <User className="w-6 h-6 text-gray-400" />
                )}
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase leading-tight">
                  Nivel de
                </span>
                <span className="text-xs text-gray-500 uppercase leading-tight">
                  Randomtripeo
                </span>
                <span className="text-sm font-medium text-gray-900 leading-tight">
                  {user?.name || 'Nombre usuario'}
                </span>
                <span className="text-sm font-medium text-gray-900 leading-tight">
                  o perfil de Guest
                </span>
              </div>
            </div>

            {/* Back Button */}
            {onBack && (
              <button
                className="p-2 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0"
                onClick={onBack}
                type="button"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>

          {/* Right Section: Navigation Tabs */}
          <div className="flex items-center justify-center gap-10 overflow-x-auto">
            {tabs.map((tab, index) => {
              const isActive = tab.id === activeTab;
              const stepNumber = index + 1;
              const isCompleted = isTabComplete(tab.id);

              return (
                <div key={tab.id} className="flex items-center gap-1">
                  {/* Numbered Circle or Check Icon */}
                  <button
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full border transition-colors',
                      {
                        'border-[#4F96B6] bg-[#4F96B6] text-white':
                          isActive || isCompleted,
                        'border-gray-300 bg-gray-100 text-gray-400':
                          !isActive && !isCompleted,
                      },
                    )}
                    onClick={() => onTabChange(tab.id)}
                    type="button"
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" strokeWidth={3} />
                    ) : (
                      <span className="text-sm font-medium">{stepNumber}</span>
                    )}
                  </button>

                  {/* Bullet Point */}
                  <span
                    className={cn('text-sm', {
                      'text-gray-700': isActive,
                      'text-gray-300': !isActive,
                    })}
                  >
                    •
                  </span>

                  {/* Text Label */}
                  <button
                    className={cn(
                      'text-sm font-medium transition-colors whitespace-nowrap',
                      {
                        'text-gray-900': isActive,
                        'text-gray-500 hover:text-gray-700': !isActive,
                      },
                    )}
                    onClick={() => onTabChange(tab.id)}
                    type="button"
                  >
                    {tab.label}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
