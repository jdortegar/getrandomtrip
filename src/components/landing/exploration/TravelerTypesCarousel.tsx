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
  tripperMode = false,
  tripperSlug,
  overflow = "both",
}: TravelerTypesCarouselProps) {
  const locale = useLocale();
  const comingSoonLabel = useDictionary(d => d.profile.comingSoon);

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
            <TravelerTypeCard
              key={type.key}
              fill
              className="aspect-3/4"
              comingSoonLabel={isComingSoon ? comingSoonLabel : undefined}
              href={isComingSoon ? undefined : `/experiences/by-type/${slugify(type.key)}`}
              item={cardDataToCardItem(type)}
              onClick={onSelect && !isComingSoon ? () => onSelect(slug) : undefined}
              selected={selectedTravelType === slug}
            />
          );
        })}
      </EmblaCarousel>
    </motion.div>
  );
}
