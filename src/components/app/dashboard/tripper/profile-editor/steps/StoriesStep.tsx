"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import Img from "@/components/common/Img";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { ProfileEditorCard } from "@/components/app/dashboard/tripper/profile-editor/ProfileEditorCard";
import {
  TRIPPER_PROFILE_MAX_FEATURED_STORIES,
  TRIPPER_PROFILE_STORIES_PAGE_SIZE,
} from "@/lib/constants/TRIPPER_PROFILE_LIMITS";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import { cn } from "@/lib/utils";
import type { TripperProfileEditorDict } from "@/lib/types/dictionary";
import type { TripperProfileStoryOption } from "@/types/tripper";

interface StoriesStepProps {
  blogHref: string;
  copy: TripperProfileEditorDict["stories"];
  featuredIds: string[];
  onChange: (ids: string[]) => void;
  onPreview: () => void;
  stories: TripperProfileStoryOption[];
}

const PAGE_BUTTON_CLASS = cn(
  "flex h-11 w-11 items-center justify-center rounded-md border border-gray-200 text-primary transition-colors",
  "hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
  "disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:border-gray-200",
);

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function StoriesStep({ blogHref, copy, featuredIds, onChange, onPreview, stories }: StoriesStepProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = normalize(query.trim());
    if (!needle) return stories;
    return stories.filter((story) => normalize(`${story.title} ${story.category}`).includes(needle));
  }, [query, stories]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / TRIPPER_PROFILE_STORIES_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * TRIPPER_PROFILE_STORIES_PAGE_SIZE;
  const pageItems = filtered.slice(start, start + TRIPPER_PROFILE_STORIES_PAGE_SIZE);
  const isAtMax = featuredIds.length >= TRIPPER_PROFILE_MAX_FEATURED_STORIES;
  const meta = interpolateTemplate(copy.meta, {
    count: String(featuredIds.length),
    max: String(TRIPPER_PROFILE_MAX_FEATURED_STORIES),
  });

  function handleToggle(id: string) {
    if (featuredIds.includes(id)) {
      onChange(featuredIds.filter((other) => other !== id));
    } else if (!isAtMax) {
      onChange([...featuredIds, id]);
    }
  }

  return (
    <div className="flex flex-col gap-6" data-component="StoriesStep">
      <ProfileEditorCard meta={meta} title={copy.cardTitle}>
        {stories.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-xl bg-ground px-5 py-6">
            <h4 className="font-barlow-condensed text-xl font-bold text-ink">{copy.emptyTitle}</h4>
            <p className="text-sm text-neutral-600">{copy.emptyBody}</p>
            <Button asChild size="sm" variant="secondary">
              <Link href={blogHref}>
                {copy.emptyCta}
                <ArrowUpRight aria-hidden />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <FormField
              id="stories-search"
              label={copy.searchLabel}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder={copy.searchPlaceholder}
              type="search"
              value={query}
            />
            {pageItems.length === 0 ? (
              <p className="text-sm text-neutral-500">{copy.noResults}</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {pageItems.map((story) => {
                  const isSelected = featuredIds.includes(story.id);
                  const inputId = `story-${story.id}`;
                  return (
                    <li key={story.id}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-4 py-4",
                          !isSelected && isAtMax && "cursor-not-allowed opacity-60",
                        )}
                        htmlFor={inputId}
                      >
                        <input
                          checked={isSelected}
                          className="h-5 w-5 shrink-0 accent-primary"
                          disabled={!isSelected && isAtMax}
                          id={inputId}
                          onChange={() => handleToggle(story.id)}
                          type="checkbox"
                        />
                        <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md bg-gray-200">
                          <Img alt="" className="absolute inset-0 h-full w-full object-cover" sizes="80px" src={story.imageUrl} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm text-ink">{story.title}</span>
                          <span className="block text-[11px] font-medium uppercase tracking-wider text-primary">
                            {story.category}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
              <p className="text-xs text-neutral-500">
                {filtered.length > 0
                  ? interpolateTemplate(copy.pageInfo, {
                      from: String(start + 1),
                      page: String(currentPage),
                      pages: String(totalPages),
                      to: String(start + pageItems.length),
                      total: String(filtered.length),
                    })
                  : null}
              </p>
              <div className="flex gap-2">
                <button
                  aria-label={copy.previous}
                  className={PAGE_BUTTON_CLASS}
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                  type="button"
                >
                  <ArrowLeft aria-hidden className="h-4 w-4" />
                </button>
                <button
                  aria-label={copy.next}
                  className={PAGE_BUTTON_CLASS}
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                  type="button"
                >
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p aria-live="polite" className="text-xs text-amber-800">
              {isAtMax ? copy.maxReached : null}
            </p>
          </>
        )}
        <div className="flex gap-3 rounded-xl bg-secondary/15 px-4 py-3 text-sm text-ink ring-1 ring-secondary/50">
          <ArrowUpRight aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            <span className="block font-medium text-primary">{copy.growNoteTitle}</span>
            {copy.growNoteBody}
          </p>
        </div>
      </ProfileEditorCard>

      <section className="flex flex-col items-start gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{copy.finalEyebrow}</p>
        <h3 className="font-barlow-condensed text-2xl font-bold leading-tight text-ink">{copy.finalTitle}</h3>
        <p className="max-w-xl text-sm text-neutral-600">{copy.finalBody}</p>
        <Button className="mt-2" onClick={onPreview} size="md" type="button" variant="secondary">
          {copy.finalCta}
          <ArrowUpRight aria-hidden />
        </Button>
      </section>
    </div>
  );
}
