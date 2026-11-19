"use client";

import { ArrowUpRight } from "lucide-react";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import { cn } from "@/lib/utils";
import type { TripperProfileEditorDict } from "@/lib/types/dictionary";
import type { TripperProfileStepId, TripperProfileStepProgress } from "@/types/tripper";

interface ProfileEditorStepNavProps {
  activeStep: TripperProfileStepId;
  copy: TripperProfileEditorDict["nav"];
  onSelect: (step: TripperProfileStepId) => void;
  progress: TripperProfileStepProgress[];
}

/** Step list: vertical sidebar with the essentials counter on desktop, horizontal scroller on mobile. */
export function ProfileEditorStepNav({ activeStep, copy, onSelect, progress }: ProfileEditorStepNavProps) {
  const essentials = progress.filter((step) => step.essential);
  const essentialsDone = essentials.filter((step) => step.complete).length;
  const percent = essentials.length ? Math.round((essentialsDone / essentials.length) * 100) : 0;

  return (
    <nav aria-label={copy.eyebrow} className="flex flex-col gap-6" data-component="ProfileEditorStepNav">
      <div className="hidden flex-col gap-3 lg:flex">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">{copy.eyebrow}</p>
        <p className="flex items-baseline gap-2">
          <span className="font-barlow-condensed text-3xl font-bold leading-none text-ink">
            {interpolateTemplate(copy.essentialsCount, {
              done: String(essentialsDone),
              total: String(essentials.length),
            })}
          </span>
          <span className="text-xs text-neutral-500">{copy.essentialsLabel}</span>
        </p>
        <div
          aria-hidden
          className="h-1 w-full overflow-hidden rounded-full bg-gray-200"
        >
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-xs text-neutral-500">{copy.essentialsHint}</p>
      </div>

      <ol
        className={cn(
          "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1",
          "lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0",
        )}
      >
        {progress.map((step, index) => {
          const isActive = step.id === activeStep;
          const stepCopy = copy.steps[step.id];
          return (
            <li className="shrink-0 lg:shrink" key={step.id}>
              <button
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "relative flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isActive
                    ? "bg-secondary/25 ring-1 ring-secondary"
                    : "bg-white ring-1 ring-gray-200 hover:bg-gray-50 lg:bg-transparent lg:ring-0",
                )}
                onClick={() => onSelect(step.id)}
                type="button"
              >
                <span className={cn("pt-0.5 text-xs tabular-nums", isActive ? "text-primary" : "text-neutral-500")}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block whitespace-nowrap text-sm font-medium", isActive ? "text-primary" : "text-ink")}>
                    {stepCopy.title}
                  </span>
                  <span className="hidden text-xs text-neutral-500 lg:block">{stepCopy.subtitle}</span>
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    step.complete ? "bg-primary" : "bg-gray-300",
                  )}
                />
                <span className="sr-only">{step.complete ? copy.completeLabel : copy.incompleteLabel}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <p className="hidden items-start gap-2 border-t border-gray-200 pt-5 text-xs text-neutral-500 lg:flex">
        <ArrowUpRight aria-hidden className="h-4 w-4 shrink-0 text-primary" />
        {copy.scopeNote}
      </p>
    </nav>
  );
}
