"use client";

import Link from "next/link";
import Section from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import type { XsedPageDict } from "@/lib/types/dictionary";
import type { DropEntry } from "@/types/core";
import { DropCard } from "./DropCard";

interface DropGridProps {
  content: XsedPageDict["dropGrid"];
  drops: DropEntry[];
}

export function DropGrid({ content, drops }: DropGridProps) {
  return (
    <Section data-component="DropGrid">
      <div className="mb-12 flex flex-col gap-6 text-left md:flex-row md:items-end md:justify-between">
        <div className="font-barlow-condensed">
          <p className="text-xl font-light uppercase tracking-widest text-xsed">
            {content.eyebrow}
          </p>
          <h2 className="text-5xl font-bold uppercase leading-none md:text-7xl">
            {content.title}{" "}
            <span className="text-xsed">{content.titleHighlight}</span>
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-ink md:text-right">
          {content.description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {drops.map((drop, index) => {
          // The featured 2x2 cell relies on the other row-1 items (columns
          // 2-4) to establish row height via CSS grid's implicit row sizing —
          // with fewer than 3 drops there's nothing to size against and the
          // spanned cell collapses to ~0 height (DropCard's featured variant
          // uses min-h-0 to let flex-1 size the image, so nothing rescues it).
          const isFeatured = index === 0 && drops.length >= 3;
          return (
            <div
              key={drop.number}
              className={isFeatured ? "md:col-span-2 md:row-span-2" : ""}
            >
              <DropCard drop={drop} featured={isFeatured} />
            </div>
          );
        })}
      </div>

      <div className="mt-12 flex justify-center">
        <Button asChild size="lg" variant="tertiary">
          <Link href={content.ctaHref}>{content.ctaLabel}</Link>
        </Button>
      </div>
    </Section>
  );
}
