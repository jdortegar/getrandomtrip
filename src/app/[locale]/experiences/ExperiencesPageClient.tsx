"use client";

import { useState } from "react";
import Hero from "@/components/Hero";
import TypePlanner from "@/components/by-type/TypePlanner";
import { XsedLevelCard } from "@/components/app/xsed/XsedLevelCard";
import { TravelerTypesCarousel } from "@/components/landing/exploration/TravelerTypesCarousel";
import Section from "@/components/layout/Section";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { TravelerTypeSlug } from "@/lib/data/traveler-types";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getPlannerContentForType } from "@/lib/utils/experiencesData";

import type { TripperJourneyContext } from "@/types/tripper";
import { getEffectiveTripperPriceOverrides } from "@/lib/pricing/tripper-price-overrides";

export default function ExperiencesPageClient({
  locale,
  tripperContext,
}: {
  locale: string;
  tripperContext: TripperJourneyContext | null;
}) {
  const dict = (locale === "en" ? en : es) as Dictionary;
  const exp = dict.experiences;
  const home = dict.home;

  const travelerTypes = home.exploration.travelerTypes;
  const [selectedTypeTraveler, setSelectedTypeTraveler] =
    useState<TravelerTypeSlug>(
      (travelerTypes[0].key as TravelerTypeSlug) ?? "couple",
    );

  function handleSelectTypeTraveler(type: TravelerTypeSlug) {
    setSelectedTypeTraveler(type);
    document
      .getElementById("type-planner")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const overrides = getEffectiveTripperPriceOverrides(
    tripperContext,
    selectedTypeTraveler,
  );

  return (
    <main className="relative" style={{ scrollBehavior: "smooth" }}>
      <Hero content={exp.hero} scrollIndicator />

      <Section
        eyebrow={exp.travelTypeEyebrow}
        id="travel-type-selector"
        subtitle={exp.travelTypeSubtitle}
        title={exp.travelTypeTitle}
      >
        <div className="container mx-auto px-4 md:px-20">
          <TravelerTypesCarousel
            localizedTravelerTypes={travelerTypes}
            onSelect={handleSelectTypeTraveler}
            selectedTravelType={selectedTypeTraveler}
          />
        </div>
      </Section>
      <TypePlanner
        content={getPlannerContentForType(
          selectedTypeTraveler,
          locale,
          overrides,
        )}
        itemsPerView={3}
        leadingCard={
          <XsedLevelCard
            copy={dict.xsedLevelCard}
            locale={locale}
            travelType={selectedTypeTraveler}
          />
        }
        type={selectedTypeTraveler}
      />
    </main>
  );
}
