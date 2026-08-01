"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { Clock, Lock } from "lucide-react";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Locale } from "@/lib/i18n/config";
import type { InviteTravelersDict } from "@/lib/types/dictionary";
import type { TravelerDTO, TravelerRoster } from "@/types/traveler";
import { TravelerRow, type TravelerRowHandle } from "./TravelerRow";

export interface TravelerRosterSectionHandle {
  /** Persists every row's current field values. Called by the page-level Save action. */
  saveAll: () => Promise<void>;
}

interface TravelerRosterSectionProps {
  copy: InviteTravelersDict;
  locale: Locale;
  roster: TravelerRoster;
}

const SUPPORT_HREF = "/contact";

export const TravelerRosterSection = forwardRef<
  TravelerRosterSectionHandle,
  TravelerRosterSectionProps
>(function TravelerRosterSection({ copy, locale, roster }, ref) {
  const [travelers, setTravelers] = useState<TravelerDTO[]>(roster.travelers);
  const rowRefs = useRef<Map<string, TravelerRowHandle>>(new Map());

  useEffect(() => {
    setTravelers(roster.travelers);
  }, [roster.travelers]);

  useImperativeHandle(ref, () => ({
    saveAll: async () => {
      await Promise.all(
        Array.from(rowRefs.current.values()).map((row) => row.save()),
      );
    },
  }));

  if (roster.cap === 0) return null;

  const submitted = travelers.filter((t) => t.status === "COMPLETE").length;
  const supportHref = pathForLocale(locale, SUPPORT_HREF);
  const supportLink = (
    <Link className="text-light-blue underline" href={supportHref}>
      {copy.supportLinkLabel}
    </Link>
  );

  function handleUpdated(updated: TravelerDTO) {
    setTravelers((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t)),
    );
  }

  const deadlineDate = roster.deadline
    ? new Date(roster.deadline).toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
      })
    : null;

  return (
    <div className="w-full max-w-3xl text-left">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
          {copy.eyebrow}
        </p>
        <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
          {copy.heading}
        </h2>
      </div>
      <p className="mt-2 max-w-xl text-sm text-neutral-600">
        {copy.subtitle.replace("{count}", String(roster.cap + 1))}
      </p>

      {roster.locked ? (
        <div className="mt-6 flex items-center gap-2.5 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-neutral-700">
          <Lock aria-hidden className="h-4 w-4 shrink-0 text-neutral-500" />
          <span>
            {
              copy.lockedBanner
                .replace(
                  "{days}",
                  roster.deadline
                    ? String(
                        Math.max(
                          0,
                          Math.ceil(
                            (new Date(roster.deadline).getTime() - Date.now()) /
                              (24 * 60 * 60 * 1000),
                          ),
                        ),
                      )
                    : "0",
                )
                .split("{supportLink}")[0]
            }
            {supportLink}
          </span>
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap items-center gap-2.5 rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          <Clock aria-hidden className="h-4 w-4 shrink-0" />
          <span>
            {deadlineDate
              ? copy.deadlineLabel
                  .replace("{date}", deadlineDate)
                  .replace("{days}", "7")
              : null}
          </span>
          <span className="ml-auto whitespace-nowrap font-semibold text-gray-900">
            {copy.progressLabel
              .replace("{submitted}", String(submitted))
              .replace("{cap}", String(roster.cap))}
          </span>
        </div>
      )}

      <div className="mt-4 space-y-3.5">
        {travelers.map((traveler, index) => (
          <TravelerRow
            copy={copy}
            key={traveler.id}
            locked={roster.locked}
            onUpdated={handleUpdated}
            ref={(el) => {
              if (el) rowRefs.current.set(traveler.id, el);
              else rowRefs.current.delete(traveler.id);
            }}
            traveler={traveler}
            travelerNumber={index + 2}
          />
        ))}
      </div>

      <p className="mt-3 text-xs text-neutral-400">
        {copy.footnote.split("{supportLink}")[0]}
        {supportLink}
      </p>
    </div>
  );
});
