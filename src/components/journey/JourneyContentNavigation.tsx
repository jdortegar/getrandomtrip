"use client";

import { ArrowLeft, Check } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { isCompleteTransportOrderParam } from "@/lib/helpers/transport";
import {
  JourneyUserBadge,
  type JourneyUserBadgeLabels,
} from "@/components/journey/JourneyUserBadge";

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
  userBadgeLabels: JourneyUserBadgeLabels;
}

export default function JourneyContentNavigation({
  activeTab,
  className,
  onBack,
  onTabChange,
  tabs,
  userBadgeLabels,
}: JourneyContentNavigationProps) {
  const searchParams = useSearchParams();
  const activeTabIndex = tabs.findIndex((item) => item.id === activeTab);

  const isTabComplete = (tabId: string): boolean => {
    const travelType = searchParams.get("travelType");
    const experience = searchParams.get("experience");
    const excuse = searchParams.get("excuse");
    const originCountry = searchParams.get("originCountry");
    const originCity = searchParams.get("originCity");
    const startDate = searchParams.get("startDate");
    const nights = searchParams.get("nights");
    switch (tabId) {
      case "budget":
        return !!(travelType && experience);
      case "excuse":
        return !!(travelType && experience && excuse);
      case "details":
        return !!(originCountry && originCity && startDate && nights);
      case "preferences":
        return isCompleteTransportOrderParam(
          searchParams.get("transportOrder"),
        );
      default:
        return false;
    }
  };

  return (
    <nav
      className={cn("w-full bg-white border-b border-gray-200 py-4", className)}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-center">
          {/* Left Section: User Profile & Back Button */}
          <div className="flex items-center gap-4">
            <JourneyUserBadge labels={userBadgeLabels} />

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
              const isClickable = index <= activeTabIndex;
              const stepNumber = index + 1;
              const isCompleted = isTabComplete(tab.id);

              return (
                <div key={tab.id} className="flex items-center gap-1">
                  {/* Numbered Circle or Check Icon */}
                  <button
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border transition-colors",
                      {
                        "border-light-blue bg-light-blue text-white":
                          isActive || isCompleted,
                        "border-gray-300 bg-gray-100 text-gray-400 opacity-60":
                          !isActive && !isCompleted,
                        "cursor-not-allowed": !isClickable,
                      },
                    )}
                    disabled={!isClickable}
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
                    className={cn("text-sm", {
                      "text-gray-700": isActive,
                      "text-gray-300": !isActive,
                    })}
                  >
                    •
                  </span>

                  {/* Text Label */}
                  <button
                    className={cn(
                      "text-sm font-medium transition-colors whitespace-nowrap",
                      {
                        "text-gray-900": isActive,
                        "text-gray-500 hover:text-gray-700": !isActive,
                        "cursor-not-allowed opacity-60": !isClickable,
                        "cursor-pointer": isClickable,
                      },
                    )}
                    disabled={!isClickable}
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
