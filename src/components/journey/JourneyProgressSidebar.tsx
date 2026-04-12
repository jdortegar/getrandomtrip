"use client";

import { Check } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { getHasExcuseStep } from "@/lib/helpers/excuse-helper";
import { isCompleteTransportOrderParam } from "@/lib/helpers/transport";
import { JOURNEY_ADDONS_ENABLED } from "config/journey-features";

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
  /** Shown as a badge when add-ons substep exists but is disabled (journey flag). */
  addonsComingSoonLabel: string;
  className?: string;
  onStepClick?: (tabId: string, substepId?: string) => void;
  tabs: ContentTab[];
}

export default function JourneyProgressSidebar({
  activeTab,
  addonsComingSoonLabel,
  className,
  onStepClick,
  tabs,
}: JourneyProgressSidebarProps) {
  const searchParams = useSearchParams();

  const getActiveTabIndex = () => {
    return tabs.findIndex((tab) => tab.id === activeTab);
  };

  const activeIndex = getActiveTabIndex();

  const isTabComplete = (tabId: string): boolean => {
    const travelType = searchParams.get("travelType");
    const experience = searchParams.get("experience");
    const excuse = searchParams.get("excuse");
    const originCountry = searchParams.get("originCountry");
    const originCity = searchParams.get("originCity");
    const startDate = searchParams.get("startDate");
    const nights = searchParams.get("nights");
    const hasExcuseStep = getHasExcuseStep(travelType ?? "", experience);

    switch (tabId) {
      case "budget":
        return !!(travelType && experience);
      case "excuse":
        return !!(travelType && experience && (excuse || !hasExcuseStep));
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

  const isSubstepComplete = (tabId: string, substepId: string): boolean => {
    const travelType = searchParams.get("travelType");
    const experience = searchParams.get("experience");
    const excuse = searchParams.get("excuse");
    const refineDetails = searchParams.get("refineDetails");
    const originCountry = searchParams.get("originCountry");
    const originCity = searchParams.get("originCity");
    const startDate = searchParams.get("startDate");
    const nights = searchParams.get("nights");
    const transportOrder = searchParams.get("transportOrder");
    const addons = searchParams.get("addons");
    const hasExcuseStep = getHasExcuseStep(travelType ?? "", experience);

    if (tabId === "budget") {
      if (substepId === "travel-type") {
        return !!travelType;
      }
      if (substepId === "experience") {
        return !!experience;
      }
    }

    if (tabId === "excuse") {
      if (substepId === "reason") {
        return !!excuse || !hasExcuseStep;
      }
      if (substepId === "refine-details") {
        return !!refineDetails || !hasExcuseStep;
      }
    }

    if (tabId === "details") {
      if (substepId === "origin") {
        return !!(originCountry && originCity);
      }
      if (substepId === "dates") {
        return !!(startDate && nights);
      }
      if (substepId === "transport") {
        return !!transportOrder;
      }
    }

    if (tabId === "preferences") {
      if (substepId === "filters") {
        return isCompleteTransportOrderParam(transportOrder);
      }
      if (substepId === "addons") {
        if (!JOURNEY_ADDONS_ENABLED) return true;
        return !!addons;
      }
    }

    return false;
  };

  return (
    <aside
      className={cn("w-full md:w-80 flex-shrink-0 bg-white p-6", className)}
    >
      <div className="relative pl-5">
        {/* Steps */}
        <div className="space-y-8">
          {tabs.map((tab, tabIndex) => {
            const isActive = tab.id === activeTab;
            const isCompleted = isTabComplete(tab.id);
            const isUpcoming = tabIndex > activeIndex;
            const stepNumber = tabIndex + 1;
            const hasSubsteps = tab.substeps.length > 0;
            const lastTabIndex = tabs.length - 1;

            return (
              <div
                className="cursor-pointer relative"
                key={tab.id}
                onClick={() => onStepClick?.(tab.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onStepClick?.(tab.id);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                {/* Connecting line from main circle to next step */}
                {tabIndex < tabs.length - 1 && (
                  <div
                    className={cn("absolute left-[20px] top-10 w-0.5", {
                      "bg-light-blue": isActive || isCompleted,
                      "bg-gray-300": !isActive && !isCompleted,
                    })}
                    style={{ bottom: "-2rem" }}
                  />
                )}

                {/* Vertical line for last step: from circle down to last substep */}
                {tabIndex === lastTabIndex && hasSubsteps && isActive && (
                  <>
                    <div
                      className="absolute left-[20px] top-10 w-0.5 bg-light-blue z-10"
                      style={{ height: "calc(100% - 11.3rem)" }}
                    />
                    <div
                      className="absolute left-[20px] top-10 w-0.5 bg-gray-300"
                      style={{ height: "calc(100% - 4.75rem)" }}
                    />
                  </>
                )}

                {/* Main Step Circle */}
                <div className="flex items-start gap-4">
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={cn(
                        "relative w-10 h-10 rounded-full flex items-center justify-center text-base font-bold transition-all",
                        {
                          "bg-light-blue text-white": isCompleted,
                          "bg-white border-2 border-light-blue text-light-blue":
                            isActive && !isCompleted,
                          "bg-white border-2 border-gray-300 text-gray-400":
                            !isActive && !isCompleted,
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
                      className={cn("text-lg font-bold mb-6", {
                        "text-light-blue": isActive && !isCompleted,
                        "text-gray-900": isCompleted,
                        "text-gray-400": isUpcoming,
                      })}
                    >
                      {tab.label}
                    </h2>

                    {/* Substeps (only when this step is active) */}
                    {hasSubsteps && isActive && (
                      <div className="space-y-6 ml-0">
                        {tab.substeps.map((substep, substepIndex) => {
                          const isAddonsComingSoon =
                            tab.id === "preferences" &&
                            substep.id === "addons" &&
                            !JOURNEY_ADDONS_ENABLED;
                          const isSubstepActive =
                            isActive && substepIndex === 0;
                          const isSubstepCompleted = isSubstepComplete(
                            tab.id,
                            substep.id,
                          );
                          const isLastSubstep =
                            substepIndex === tab.substeps.length - 1;

                          return (
                            <div
                              aria-disabled={isAddonsComingSoon}
                              className={cn(
                                "flex gap-3 items-start relative",
                                isAddonsComingSoon
                                  ? "cursor-not-allowed opacity-60"
                                  : "cursor-pointer",
                              )}
                              key={substep.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isAddonsComingSoon) return;
                                onStepClick?.(tab.id, substep.id);
                              }}
                              onKeyDown={(e) => {
                                if (isAddonsComingSoon) return;
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onStepClick?.(tab.id, substep.id);
                                }
                              }}
                              role="button"
                              tabIndex={isAddonsComingSoon ? -1 : 0}
                            >
                              {/* Horizontal line connecting to vertical timeline */}
                              <div
                                className={cn("absolute top-[7px] h-0.5", {
                                  "bg-light-blue":
                                    !isAddonsComingSoon &&
                                    (isSubstepActive || isSubstepCompleted),
                                  "bg-gray-300":
                                    isAddonsComingSoon ||
                                    (!isSubstepActive && !isSubstepCompleted),
                                })}
                                style={{ width: "40px", left: "-36px" }}
                              />

                              {/* Substep Bullet */}
                              <div className="relative z-10 flex-shrink-0 mt-1">
                                <div
                                  className={cn("w-2 h-2 rounded-full", {
                                    "bg-light-blue":
                                      isSubstepCompleted && !isAddonsComingSoon,
                                    "bg-white border border-light-blue":
                                      isSubstepActive &&
                                      !isSubstepCompleted &&
                                      !isAddonsComingSoon,
                                    "bg-white border border-gray-300":
                                      isAddonsComingSoon ||
                                      (!isSubstepActive && !isSubstepCompleted),
                                  })}
                                />
                              </div>

                              {/* Substep Content */}
                              <div className="flex-1">
                                <h3
                                  className={cn(
                                    "mb-1 flex flex-wrap items-center gap-2 text-sm font-bold uppercase",
                                    {
                                      "text-light-blue":
                                        (isSubstepActive ||
                                          isSubstepCompleted) &&
                                        !isAddonsComingSoon,
                                      "text-gray-400":
                                        (!isSubstepActive &&
                                          !isSubstepCompleted) ||
                                        isAddonsComingSoon,
                                    },
                                  )}
                                >
                                  {substep.title}
                                  {isAddonsComingSoon ? (
                                    <span className="inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-wide text-gray-700">
                                      {addonsComingSoonLabel}
                                    </span>
                                  ) : null}
                                </h3>
                                <p
                                  className={cn("text-xs leading-relaxed", {
                                    "text-gray-700":
                                      (isSubstepActive || isSubstepCompleted) &&
                                      !isAddonsComingSoon,
                                    "text-gray-400":
                                      (!isSubstepActive &&
                                        !isSubstepCompleted) ||
                                      isAddonsComingSoon,
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
