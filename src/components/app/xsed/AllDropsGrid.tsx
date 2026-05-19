"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { DropEntry } from "@/types/core";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import { DropCard } from "./DropCard";
import Section from "@/components/layout/Section";

interface AllDropsGridProps {
  excludeId?: string;
  initialDrops: DropEntry[];
  initialHasMore: boolean;
}

export function AllDropsGrid({ excludeId, initialDrops, initialHasMore }: AllDropsGridProps) {
  const locale = useLocale();
  const copy = useDictionary((d) => d.xsedDropsPage);
  const [drops, setDrops] = useState<DropEntry[]>(initialDrops);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"date" | "order">("date");

  async function loadMore() {
    setLoading(true);
    const params = new URLSearchParams({ locale, offset: String(drops.length), limit: "6" });
    if (excludeId) params.set("excludeId", excludeId);
    const res = await fetch(`/api/xsed/drops?${params}`);
    const data: { drops: DropEntry[]; hasMore: boolean } = await res.json();
    setDrops((prev) => [...prev, ...data.drops]);
    setHasMore(data.hasMore);
    setLoading(false);
  }

  return (
    <Section>
      {/* Filter bar */}
      {/* <div className="mb-8 flex items-center gap-3">
        <button
          className={`rounded-full border px-5 py-2 font-barlow text-sm font-semibold uppercase tracking-wide transition-colors ${
            activeFilter === "date"
              ? "border-xsed bg-xsed text-white"
              : "border-neutral-300 bg-white text-neutral-600 hover:border-xsed hover:text-xsed"
          }`}
          onClick={() => setActiveFilter("date")}
        >
          {copy.filterDate}
        </button>
        <button
          className={`rounded-full border px-5 py-2 font-barlow text-sm font-semibold uppercase tracking-wide transition-colors ${
            activeFilter === "order"
              ? "border-xsed bg-xsed text-white"
              : "border-neutral-300 bg-white text-neutral-600 hover:border-xsed hover:text-xsed"
          }`}
          onClick={() => setActiveFilter("order")}
        >
          {copy.filterOrderBy}
        </button>
      </div> */}

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {drops.map((drop) => (
          <DropCard key={drop.number} drop={drop} big={false} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-12 flex justify-center">
          <Button disabled={loading} onClick={loadMore} size="lg" variant="tertiary">
            {loading ? "..." : copy.loadMore}
          </Button>
        </div>
      )}
    </Section>
  );
}
