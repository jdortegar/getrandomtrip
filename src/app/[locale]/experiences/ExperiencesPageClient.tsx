"use client";

import { useMemo, useState } from "react";
import Hero from "@/components/Hero";
import TypePlanner from "@/components/by-type/TypePlanner";
import { XsedLevelCard } from "@/components/app/xsed/XsedLevelCard";
import { TabSelector } from "@/components/ui/TabSelector";
import Section from "@/components/layout/Section";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { TravelerTypeSlug } from "@/lib/data/traveler-types";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  getCarouselCardOptions,
  getPlannerContentForType,
} from "@/lib/utils/experiencesData";

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
  const travelerTypes = dict.home.exploration.travelerTypes;
  const typeTabs = useMemo(
    () =>
      getCarouselCardOptions(locale, {
        localizedTravelerTypes: travelerTypes,
      }).map((type) => ({
        id: type.key,
        label: type.title,
      })),
    [locale, travelerTypes],
  );
  const [selectedTypeTraveler, setSelectedTypeTraveler] =
    useState<TravelerTypeSlug>("couple");

  const overrides = getEffectiveTripperPriceOverrides(
    tripperContext,
    selectedTypeTraveler,
  );

  return (
    <main className="relative" style={{ scrollBehavior: "smooth" }}>
      <Hero content={exp.hero} scrollIndicator titleClassName="uppercase" />

      <Section
        eyebrow={exp.travelTypeEyebrow}
        fullWidth
        id="travel-type-selector"
        subtitle={exp.travelTypeSubtitle}
        title={exp.travelTypeTitle}
      >
        <div className="flex flex-col gap-8">
          <div className="rt-container">
            <TabSelector
              activeTab={selectedTypeTraveler}
              layoutId="experiences-traveler-type"
              onTabChange={(id) => setSelectedTypeTraveler(id as TravelerTypeSlug)}
              tabs={typeTabs}
            />
          </div>
          <div id="type-planner">
            <TypePlanner
              compact
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
          </div>
        </div>
      </Section>
    </main>
  );
}
