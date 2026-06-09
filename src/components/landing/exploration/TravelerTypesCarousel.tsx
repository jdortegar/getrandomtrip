"use client";

import React from "react";
import TravelerTypeCard from "@/components/TravelerTypeCard";
import { slugify } from "@/lib/slugify";
import {
  cardDataToCardItem,
  filterCarouselCards,
  getCarouselCardOptions,
} from "@/lib/utils/experiencesData";
import EmblaCarousel from "@/components/EmblaCarousel/EmblaCarousel";
import { motion } from "framer-motion";
import type { TravelerTypeSlug } from "@/lib/data/traveler-types";
import { useDictionary, useLocale } from "@/hooks/useDictionary";

interface TravelerTypesCarouselProps {
  availableTypes?: string[];
  localizedTravelerTypes?: Array<{
    description: string;
    key: string;
    title: string;
  }>;
  onSelect?: (slug: TravelerTypeSlug) => void;
  selectedTravelType?: TravelerTypeSlug;
  /** When defined (curated journey), renders a "BY TRIPPER [NAME]" badge on each card. */
  tripperBadge?: { name: string; avatarUrl: string | null };
  tripperMode?: boolean;
  tripperSlug?: string;
  overflow?: "both" | "left" | "right" | undefined;
}

const COMING_SOON_SLUGS: TravelerTypeSlug[] = ["family", "paws", "honeymoon"];

export function TravelerTypesCarousel({
  availableTypes,
  localizedTravelerTypes,
  onSelect,
  selectedTravelType,
  tripperBadge,
  tripperMode = false,
  tripperSlug,
  overflow = "both",
}: TravelerTypesCarouselProps) {
  const locale = useLocale();
  const comingSoonLabel = useDictionary((d) => d.profile.comingSoon);

  const cards = getCarouselCardOptions(locale, {
    localizedTravelerTypes,
  });

  const tripperContext = tripperMode || Boolean(tripperSlug);
  const typesToShow = filterCarouselCards(cards, {
    availableTypes,
    tripperContext,
  });

  if (tripperContext && typesToShow.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <EmblaCarousel slidesPerView={4} overflow={overflow}>
        {typesToShow.map((type) => {
          const slug = type.key.toLowerCase() as TravelerTypeSlug;
          const isComingSoon = COMING_SOON_SLUGS.includes(slug);
          return (
            <div className="relative" key={type.key}>
              <TravelerTypeCard
                fill
                className="aspect-3/4"
                comingSoonLabel={isComingSoon ? comingSoonLabel : undefined}
                href={
                  isComingSoon
                    ? undefined
                    : `/experiences/by-type/${slugify(type.key)}`
                }
                item={cardDataToCardItem(type)}
                onClick={
                  onSelect && !isComingSoon ? () => onSelect(slug) : undefined
                }
                selected={selectedTravelType === slug}
              />
              {tripperBadge && (
                <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-sm">
                  {tripperBadge.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={tripperBadge.name}
                      className="h-5 w-5 rounded-full object-cover"
                      src={tripperBadge.avatarUrl}
                    />
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-500 text-[9px] font-bold text-white">
                      {tripperBadge.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="whitespace-nowrap text-[10px] font-semibold text-white">
                    BY TRIPPER {tripperBadge.name.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </EmblaCarousel>
    </motion.div>
  );
}
