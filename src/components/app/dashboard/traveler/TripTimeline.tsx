"use client";

import { Check } from "lucide-react";
import { PanelCard } from "@/components/common/PanelCard";
import type { TripDetailDict } from "@/lib/types/dictionary";
import type {
  TripTimelineStep,
  TripTimelineStepKey,
} from "@/types/tripDetails";
import { formatTimelineDate } from "./tripDetailsHelpers";

interface TripTimelineProps {
  /** Caption under the "Trip completed" step (e.g. the leave-a-review hint). */
  completedNote?: string;
  copy: Pick<
    TripDetailDict,
    | "paymentConfirmedLabel"
    | "status"
    | "timelineCurrentLabel"
    | "timelineDepartureLabel"
    | "timelineDestinationRevealedLabel"
    | "timelineDoneLabel"
    | "timelineTitle"
    | "timelineUpcomingLabel"
    | "tripCompletedLabel"
    | "tripCreatedLabel"
  >;
  locale: string;
  steps: TripTimelineStep[];
}

/**
 * Vertical stepper of the trip's lifecycle (built by `buildTripTimeline`):
 * reached steps get a filled Deep Teal check, the next step an Ochre ring
 * plus a "Next step" tag, later steps a muted ring plus a "Later" tag and
 * their planned date.
 */
export function TripTimeline({
  completedNote,
  copy,
  locale,
  steps,
}: TripTimelineProps) {
  const labels: Record<TripTimelineStepKey, string> = {
    created: copy.tripCreatedLabel,
    paid: copy.paymentConfirmedLabel,
    revealed: copy.timelineDestinationRevealedLabel,
    departure: copy.timelineDepartureLabel,
    completed: copy.tripCompletedLabel,
    cancelled: copy.status.CANCELLED,
  };
  const stateLabels = {
    done: copy.timelineDoneLabel,
    current: copy.timelineCurrentLabel,
    upcoming: copy.timelineUpcomingLabel,
  };

  return (
    <PanelCard title={copy.timelineTitle}>
      <ol data-component="TripTimeline">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const isDone = step.state === "done";
          const isCurrent = step.state === "current";
          const date = formatTimelineDate(step.date, locale, step.dateOnly);

          return (
            <li
              key={step.key}
              aria-current={isCurrent ? "step" : undefined}
              className="relative flex gap-4 pb-6 last:pb-0"
            >
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[11px] top-7 bottom-1 w-px ${
                    isDone ? "bg-primary" : "bg-gray-200"
                  }`}
                />
              )}
              <span
                aria-hidden="true"
                className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  isDone
                    ? "bg-primary text-white"
                    : isCurrent
                      ? "border-2 border-feature bg-white"
                      : "border-2 border-gray-200 bg-white"
                }`}
              >
                {isDone ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                ) : null}
                {isCurrent ? (
                  <span className="h-2 w-2 rounded-full bg-feature" />
                ) : null}
              </span>

              <div className="min-w-0 pt-0.5">
                <p
                  className={`text-sm font-medium ${
                    step.state === "upcoming" ? "text-neutral-500" : "text-ink"
                  }`}
                >
                  {labels[step.key]}
                  {isDone ? (
                    <span className="sr-only"> — {stateLabels.done}</span>
                  ) : null}
                </p>
                {isDone ? null : (
                  <p
                    aria-hidden="true"
                    className={`mt-1 text-[11px] font-semibold uppercase tracking-wider ${
                      isCurrent ? "text-primary" : "text-neutral-500"
                    }`}
                  >
                    {stateLabels[step.state]}
                  </p>
                )}
                {date ? (
                  <p className="mt-0.5 text-xs text-neutral-500">{date}</p>
                ) : null}
                {step.key === "completed" && completedNote ? (
                  <p className="mt-1.5 text-xs text-neutral-700">
                    {completedNote}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </PanelCard>
  );
}
