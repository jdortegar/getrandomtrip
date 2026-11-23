"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { getRevealCountdown } from "@/lib/helpers/getRevealCountdown";
import type { TripRevealDict } from "@/lib/types/dictionary";

interface TripRevealCountdownProps {
  copy: Pick<
    TripRevealDict,
    | "countdownTitle"
    | "daysLabel"
    | "hoursLabel"
    | "minutesLabel"
    | "pendingAssignment"
    | "secondsLabel"
  >;
  departureTimeZone?: string | null;
  /** ISO start date of the trip; the reveal moment is derived from it. */
  startDate: string;
}

type Countdown = ReturnType<typeof getRevealCountdown>;

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * High-contrast Deep Teal panel on the trip-details page for a confirmed,
 * unrevealed trip:
 * a live countdown to the reveal moment, or — once that moment has passed
 * and the destination is still being assigned — the "being prepared" note.
 */
export function TripRevealCountdown({
  copy,
  departureTimeZone,
  startDate,
}: TripRevealCountdownProps) {
  const [countdown, setCountdown] = useState<Countdown | null>(null);

  useEffect(() => {
    const trip = { startDate: new Date(startDate), departureTimeZone };
    const tick = () => setCountdown(getRevealCountdown(trip, new Date()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startDate, departureTimeZone]);

  if (!countdown) return null;

  const units = [
    { label: copy.daysLabel, value: String(countdown.days) },
    { label: copy.hoursLabel, value: pad(countdown.hours) },
    { label: copy.minutesLabel, value: pad(countdown.minutes) },
    { label: copy.secondsLabel, value: pad(countdown.seconds) },
  ];

  return (
    // A contained Deep Teal panel (content width, not a full-bleed band) —
    // the page's one high-contrast moment while teal stays within the
    // brand's 5–10% share of the view.
    <section className="bg-ground pt-8 md:pt-10" data-component="TripRevealCountdown">
      <div className="rt-container">
        <div className="mx-auto flex max-w-6xl flex-col items-center rounded-2xl bg-primary px-4 py-10 text-center text-white md:py-14">
          <p className="inline-flex items-center text-xs font-semibold uppercase tracking-[0.18em] text-white">
            <span aria-hidden="true" className="mr-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-feature" />
            {copy.countdownTitle}
          </p>

          {countdown.revealed ? (
            <div className="mt-6 flex max-w-md flex-col items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10">
                <Sparkles aria-hidden="true" className="h-6 w-6 text-feature" />
              </span>
              <p className="text-sm text-white/85">{copy.pendingAssignment}</p>
            </div>
          ) : (
            <div className="mt-4 flex items-end justify-center" role="timer">
              {units.map((unit, i) => (
                <div key={unit.label} className="inline-flex items-end font-barlow-condensed font-extralight">
                  <span className="text-[44px] leading-none tabular-nums text-white sm:text-[64px] md:text-[96px]">
                    {i > 0 && <span className="text-white/50">:</span>}
                    {unit.value}
                  </span>
                  <span className="mb-[0.3rem] ml-0.5 whitespace-nowrap text-[10px] font-normal uppercase tracking-[0.18em] text-white/75 sm:mb-[0.4rem] sm:text-sm md:mb-[0.5rem] md:text-base">
                    {unit.label}
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
