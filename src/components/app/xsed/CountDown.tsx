"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Section from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CountDownDict {
  ctaHref: string;
  ctaLabel: string;
  daysLabel: string;
  minLabel: string;
  nextDropLabel: string;
  secLabel: string;
  soldLabel: string; // "Vendidos {sold}/{total}"
  subtitle: string;
  title: string;
  titleHighlight: string;
}

interface CountDownProps {
  copy: CountDownDict;
  locale: string;
  soldCount: number;
  targetDate: string; // ISO 8601
  totalSlots: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface TimeLeft {
  days: number;
  min: number;
  sec: number;
}

function computeTimeLeft(targetDate: string): TimeLeft {
  const diff = Math.max(0, Math.floor((new Date(targetDate).getTime() - Date.now()) / 1000));
  return {
    days: Math.floor(diff / 86400),
    min: Math.floor((diff % 3600) / 60),
    sec: diff % 60,
  };
}

function formatDropDate(targetDate: string, locale: string): string {
  const date = new Date(targetDate);
  const tag = locale === "en" ? "en-US" : "es-ES";
  const dayName = date.toLocaleDateString(tag, { weekday: "long" }).toUpperCase();
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${dayName} ${day}/${month} ${hh}:${mm}HS.`;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ORANGE = "#D97E4A";

// ─── Component ────────────────────────────────────────────────────────────────

export function CountDown({ copy, locale, soldCount, targetDate, totalSlots }: CountDownProps) {
  const [time, setTime] = useState<TimeLeft>(() => computeTimeLeft(targetDate));

  useEffect(() => {
    const id = setInterval(() => setTime(computeTimeLeft(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const pct = totalSlots > 0 ? Math.min(100, (soldCount / totalSlots) * 100) : 0;
  const soldText = copy.soldLabel
    .replace("{sold}", String(soldCount))
    .replace("{total}", String(totalSlots));
  const dropLabel = formatDropDate(targetDate, locale);
  const pad = (n: number) => String(n).padStart(2, "0");

  const units = [
    { label: copy.daysLabel, value: String(time.days) },
    { label: copy.minLabel,  value: pad(time.min) },
    { label: copy.secLabel,  value: pad(time.sec) },
  ];

  const titleHighlight = copy.titleHighlight.replace("{number}", String(soldCount));

  return (
    <Section fullWidth={true} id="xsed" title={`${copy.title} <span class="text-xsed">${titleHighlight}</span>`} subtitle={copy.subtitle}>
      

        {/* Next drop row */}
        <motion.div
          className="flex items-center justify-center gap-2 text-lg uppercase tracking-wide text-neutral-700"
          initial={{ opacity: 0 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <span
            aria-hidden
            className="inline-block h-2 w-2 shrink-0 rounded-full bg-xsed"
          />
          <span className="font-bold">{copy.nextDropLabel}</span>
          <span>{dropLabel}</span>
        </motion.div>

        {/* Countdown digits */}
        <motion.div
          aria-label={`${time.days} ${copy.daysLabel}, ${time.min} ${copy.minLabel}, ${time.sec} ${copy.secLabel}`}
          className="mt-4 flex items-end justify-center"
          initial={{ opacity: 0, y: 20 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          role="timer"
        >
          {units.map((unit, i) => (
            <div className="flex items-end font-barlow-condensed font-extralight" key={unit.label}>
              
              {/* Digit + subscript label */}
              <div className="inline-flex items-end">
                <span className="leading-none tabular-nums text-neutral-800 text-[140px]">
                {i>0 && ':'}{unit.value}
                </span>
                <span className="mb-[0.45rem] ml-0.5 whitespace-nowrap uppercase tracking-[0.18em] text-neutral-400 md:mb-[0.6rem] text-xl font-normal">
                  {unit.label}
                </span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Progress bar */}
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
          <p className="mt-2 text-lg font-semibold text-neutral-700">{soldText}</p>
        </motion.div>

        {/* CTA */}
       
        <motion.div
        className="mt-12 flex justify-center"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        <Button asChild size="lg" variant="tertiary">
          <Link href={copy.ctaHref} scroll={true}>
            {copy.ctaLabel}
          </Link>
        </Button>
      </motion.div>
    </Section>
  );
}
