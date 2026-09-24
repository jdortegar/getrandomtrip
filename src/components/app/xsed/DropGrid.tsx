"use client";

import Link from "next/link";
import Section from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
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

      <div
        className={cn(
          "grid grid-cols-1 gap-6",
          "sm:grid-cols-2 lg:grid-cols-4",
          drops.length >= 3 &&
            "lg:grid-rows-2 lg:h-[calc(100dvh-var(--rt-header-h,64px)-6rem)]",
        )}
      >
        {drops.map((drop, index) => {
          const isFeatured = index === 0 && drops.length >= 3;
          return (
            <div
              className={cn(
                "min-h-0",
                isFeatured && "md:col-span-2 md:row-span-2",
              )}
              key={drop.number}
            >
              <DropCard
                drop={drop}
                featured={isFeatured}
                fill={drops.length >= 3}
              />
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
