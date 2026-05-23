"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Section from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { useDictionary } from "@/hooks/useDictionary";
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
  number: number;
  soldCount: number;
  totalSlots: number;
  /** Slug of the current drop — enables server-side sold count polling during open window. */
  dropSlug?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface TimeLeft {
  days: number;
  hours: number;
  min: number;
  sec: number;
}

function computeTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const min = Math.floor((diff % 3600) / 60);
  const sec = diff % 60;
  return { days, hours, min, sec };
}

function formatTargetTime(target: Date): string {
  const hh = String(target.getHours()).padStart(2, "0");
  const mm = String(target.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}HS.`;
}

function formatTargetDate(target: Date, locale: string): string {
  const tag = locale === "en" ? "en-US" : "es-ES";
  const dayName = target
    .toLocaleDateString(tag, { weekday: "long" })
    .toUpperCase();
  const day = target.getDate();
  const month = target.getMonth() + 1;
  const hh = String(target.getHours()).padStart(2, "0");
  const mm = String(target.getMinutes()).padStart(2, "0");
  return `${dayName} ${day}/${month} ${hh}:${mm}HS.`;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ORANGE = "#D97E4A";

// ─── Component ────────────────────────────────────────────────────────────────

export function CountDown({
  copy: copyProp,
  useForm = false,
  locale,
  number,
  soldCount: soldCountProp,
  totalSlots: totalSlotsProp,
  dropSlug,
}: CountDownProps) {
  const dictCopy = useDictionary((d) => d.xsedPage.countdown);
  const copy = copyProp ?? dictCopy;

  // tz starts null (SSR-safe); detected and set on client mount via useEffect.
  const [tz, setTz] = useState<string | null>(null);
  const [phase, setPhase] = useState<"open" | "waiting">("waiting");
  const [target, setTarget] = useState<Date>(() => getCountdownTarget(null));
  const [time, setTime] = useState<TimeLeft>(() =>
    computeTimeLeft(getCountdownTarget(null)),
  );
  const [soldCount, setSoldCount] = useState(soldCountProp);
  const [totalSlots, setTotalSlots] = useState(totalSlotsProp);

  // Detect timezone on client mount and sync phase/target immediately.
  useEffect(() => {
    const detected = detectSupportedTimezone();
    const resolvedTz = detected ?? "America/Argentina/Buenos_Aires";
    const now = new Date();
    const newPhase = isLocalWindowOpen(resolvedTz, now) ? "open" : "waiting";
    const newTarget = getCountdownTarget(resolvedTz, now);
    setTz(detected);
    setPhase(newPhase);
    setTarget(newTarget);
    setTime(computeTimeLeft(newTarget));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      const resolvedTz = tz ?? "America/Argentina/Buenos_Aires";

      // Re-evaluate phase on every tick — detects transitions without page reload
      const currentPhase = isLocalWindowOpen(resolvedTz, now)
        ? "open"
        : "waiting";
      if (currentPhase !== phase) {
        const newTarget = getCountdownTarget(resolvedTz, now);
        setPhase(currentPhase);
        setTarget(newTarget);
        setTime(computeTimeLeft(newTarget));
        return;
      }

      setTime(computeTimeLeft(target));
    }, 1000);

    return () => clearInterval(id);
  }, [target, phase, tz]);

  // Poll sold count from server every 30s while window is open
  useEffect(() => {
    if (phase !== "open" || !dropSlug) return;

    let stopped = false;

    async function poll() {
      try {
        const res = await fetch(`/api/xsed/drops/${dropSlug}/sold-count`);
        if (!res.ok || stopped) return;
        const data = (await res.json()) as {
          displayedSold: number;
          totalSlots: number;
          isSoldOut: boolean;
        };
        setSoldCount(data.displayedSold);
        setTotalSlots(data.totalSlots);
        if (data.isSoldOut) stopped = true;
      } catch {
        // network error — skip this tick
      }
    }

    poll();
    const id = setInterval(() => {
      if (!stopped) poll();
    }, 30_000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [phase, dropSlug]);

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
    String(number),
  );

  // Show notify form when: useForm override OR window is not open
  const showForm = useForm || phase === "waiting";

  return (
    <Section
      fullWidth={true}
      id="xsed"
      title={`${copy.title} <span class="text-xsed">${titleHighlight}</span>`}
      subtitle={phase === "open" ? copy.openSubtitle : copy.subtitle}
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
      {phase === "open" && (
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
            <XsedNotifyForm variant="light" />
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
