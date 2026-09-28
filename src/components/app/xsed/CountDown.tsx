"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Section from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { useDictionary } from "@/hooks/useDictionary";
import { useXsedSoldCount } from "@/lib/hooks/useXsedSoldCount";
import { getXsedCampaignWeek } from "@/lib/xsed/campaign";
import { timezoneToCountry } from "@/lib/xsed/country-tz";
import {
  computeTimeLeft,
  formatTargetDate,
  formatTargetTime,
} from "@/lib/xsed/countdownTime";
import { XsedNotifyForm } from "./XsedNotifyForm";
import {
  detectSupportedTimezone,
  getCountdownTarget,
  isLocalWindowOpen,
} from "@/lib/xsed/window";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CountDownDict {
  ctaHref: string;
  ctaLabel: string;
  daysLabel: string;
  hoursLabel: string;
  minLabel: string;
  nextDropLabel: string;
  windowOpenLabel: string;
  windowClosingLabel: string;
  secLabel: string;
  soldLabel: string;
  subtitle: string;
  openSubtitle: string;
  title: string;
  titleHighlight: string;
}

interface CountDownProps {
  copy?: CountDownDict;
  /** When true, always renders the notify form regardless of phase. */
  useForm?: boolean;
  locale: string;
  campaignStartDate: string;
  initialWeekNumber: number;
  soldCount: number;
  totalSlots: number;
  /** Slug of the current drop — enables server-side sold count polling during open window. */
  dropSlug?: string;
}

const ORANGE = "#D97E4A";

export function CountDown({
  copy: copyProp,
  useForm = false,
  locale,
  campaignStartDate,
  initialWeekNumber,
  totalSlots: totalSlotsProp,
  dropSlug,
}: CountDownProps) {
  const dictCopy = useDictionary((d) => d.xsedPage.countdown);
  const copy = copyProp ?? dictCopy;
  const notifyCopy = useDictionary((d) => d.xsedPage.hero);

  // tz starts null (SSR-safe); detected and set on client mount via useEffect.
  const [weekNumber, setWeekNumber] = useState(initialWeekNumber);
  const [tz, setTz] = useState<string | null>(null);
  const [phase, setPhase] = useState<"open" | "waiting">("waiting");
  const [target, setTarget] = useState<Date>(() => getCountdownTarget(null));
  const [time, setTime] = useState(() =>
    computeTimeLeft(getCountdownTarget(null)),
  );
  const countryCount = useXsedSoldCount(
    dropSlug,
    timezoneToCountry(tz),
    phase === "open" ? target.toISOString() : null,
  );
  // The SSR count is global, so never render it as a country's inventory.
  const soldCount = countryCount?.displayedSold ?? 0;
  const totalSlots = countryCount?.totalSlots ?? totalSlotsProp;

  // Synchronize the browser timezone after hydration, before the first tick.
  useEffect(() => {
    const initialSync = setTimeout(() => {
      const detected = detectSupportedTimezone();
      const resolvedTz = detected ?? "America/Argentina/Buenos_Aires";
      const now = new Date();
      const newPhase = isLocalWindowOpen(resolvedTz, now) ? "open" : "waiting";
      const newTarget = getCountdownTarget(resolvedTz, now);
      setWeekNumber(getXsedCampaignWeek(campaignStartDate, now, resolvedTz));
      setTz(detected);
      setPhase(newPhase);
      setTarget(newTarget);
      setTime(computeTimeLeft(newTarget));
    }, 0);
    return () => clearTimeout(initialSync);
  }, [campaignStartDate]);

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      const resolvedTz = tz ?? "America/Argentina/Buenos_Aires";
      setWeekNumber(getXsedCampaignWeek(campaignStartDate, now, resolvedTz));

      // Re-evaluate phase on every tick — detects transitions without page reload
      const currentPhase = isLocalWindowOpen(resolvedTz, now)
        ? "open"
        : "waiting";
      if (currentPhase !== phase || target <= now) {
        const newTarget = getCountdownTarget(resolvedTz, now);
        setPhase(currentPhase);
        setTarget(newTarget);
        setTime(computeTimeLeft(newTarget));
        return;
      }

      setTime(computeTimeLeft(target));
    }, 1000);

    return () => clearInterval(id);
  }, [campaignStartDate, target, phase, tz]);

  const pct =
    totalSlots > 0 ? Math.min(100, (soldCount / totalSlots) * 100) : 0;
  const soldText = copy.soldLabel
    .replace("{sold}", String(soldCount))
    .replace("{total}", String(totalSlots));
  const dropLabel = formatTargetDate(target, locale);
  const pad = (n: number) => String(n).padStart(2, "0");

  const allUnits = [
    { label: copy.daysLabel, value: String(time.days), hideWhenOpen: true },
    { label: copy.hoursLabel, value: pad(time.hours), hideWhenOpen: false },
    { label: copy.minLabel, value: pad(time.min), hideWhenOpen: false },
    { label: copy.secLabel, value: pad(time.sec), hideWhenOpen: false },
  ];
  const units =
    phase === "open" ? allUnits.filter((u) => !u.hideWhenOpen) : allUnits;

  const titleHighlight = copy.titleHighlight.replace(
    "{number}",
    String(weekNumber),
  );

  // Show notify form when: useForm override OR window is not open
  const showForm = useForm || phase === "waiting";

  return (
    <Section
      fullWidth={true}
      id="xsed"
      title={`${copy.title} <span class="text-xsed">${titleHighlight}</span>`}
      subtitle={phase === "open" ? copy.openSubtitle : copy.subtitle}
      data-component="CountDown"
    >
      {/* Drop status row */}
      <motion.div
        className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm sm:text-lg uppercase tracking-wide text-neutral-700"
        initial={{ opacity: 0 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {phase === "open" ? (
          <>
            <span aria-hidden className="relative inline-flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-xsed opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-xsed" />
            </span>
            <span className="font-bold text-xsed">{copy.windowOpenLabel}</span>
            <span className="text-neutral-400">
              {copy.windowClosingLabel} {formatTargetTime(target)}
            </span>
          </>
        ) : (
          <>
            <span
              aria-hidden
              className="inline-block h-2 w-2 shrink-0 rounded-full bg-xsed"
            />
            <span className="font-bold">{copy.nextDropLabel}</span>
            <span>{dropLabel}</span>
          </>
        )}
      </motion.div>

      {/* Countdown digits */}
      <motion.div
        className="mt-4 flex items-end justify-center"
        initial={{ opacity: 0, y: 20 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        role="timer"
      >
        {units.map((unit, i) => (
          <div
            className="flex items-end font-barlow-condensed font-extralight"
            key={unit.label}
          >
            <div className="inline-flex items-end">
              <span className="leading-none tabular-nums text-neutral-800 text-[52px] sm:text-[80px] md:text-[140px]">
                {i > 0 && ":"}
                {unit.value}
              </span>
              <span className="mb-[0.3rem] ml-0.5 whitespace-nowrap uppercase tracking-[0.18em] text-neutral-400 sm:mb-[0.45rem] md:mb-[0.6rem] text-xs sm:text-base md:text-xl font-normal">
                {unit.label}
              </span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Progress bar */}
      {phase === "open" && countryCount && (
        <motion.div
          className="mx-auto mt-8 max-w-xs"
          initial={{ opacity: 0 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div
            aria-label={soldText}
            aria-valuemax={totalSlots}
            aria-valuemin={0}
            aria-valuenow={soldCount}
            className="h-2 w-full overflow-hidden rounded-full bg-orange-100"
            role="progressbar"
          >
            <div
              className="h-full rounded-full transition-[width] duration-700"
              style={{ backgroundColor: ORANGE, width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-lg font-semibold text-neutral-700">
            {soldText}
          </p>
        </motion.div>
      )}

      {/* CTA */}
      <motion.div
        className="mt-12 flex justify-center"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        {showForm ? (
          <div className="rt-container mx-auto flex justify-center text-center">
            <XsedNotifyForm content={notifyCopy} variant="light" />
          </div>
        ) : (
          <Button asChild size="lg" variant="tertiary">
            <Link href={`/${locale}/xsed/book`} scroll={true}>
              {copy.ctaLabel}
            </Link>
          </Button>
        )}
      </motion.div>
    </Section>
  );
}
