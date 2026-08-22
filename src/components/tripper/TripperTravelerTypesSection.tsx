import { TravelerTypesCarousel } from "@/components/landing/exploration";
import Section from "@/components/layout/Section";
import type { MarketingDictionary } from "@/lib/types/dictionary";

/** Anchor id for scroll targets (Hero, Planner, HomeInfo CTAs). Use hash: `#tripper-traveler-types`. */
export const TRIPPER_TRAVELER_TYPES_ANCHOR_ID = "tripper-traveler-types";

interface TripperTravelerTypesSectionProps {
  availableTypes: string[];
  avatarUrl: string | null;
  copy: MarketingDictionary["trippers"]["travelerTypesSection"];
  tripperName: string;
  tripperSlug: string | null;
}

/**
 * Always renders (no `if (!availableTypes?.length) return null` guard) — a
 * tripper with zero ACTIVE offerings still shows this section with fallback
 * cards rather than disappearing (see `TripperTravelerTypesSection.test.tsx`).
 * Copy MUST come from `copy` (dictionary-sourced) — previously hardcoded
 * Spanish-only strings were invisible while the guard hid the section
 * whenever there was nothing to show; now that it always renders, a
 * hardcoded string would leak into English locales (review finding #2).
 */
export function TripperTravelerTypesSection({
  availableTypes,
  avatarUrl,
  copy,
  tripperName,
  tripperSlug,
}: TripperTravelerTypesSectionProps) {
  return (
    <Section
      eyebrow={copy.eyebrow}
      id={TRIPPER_TRAVELER_TYPES_ANCHOR_ID}
      subtitle={copy.subtitle.replace("{name}", tripperName)}
      title={copy.title.replace("{name}", tripperName)}
    >
      <TravelerTypesCarousel
        availableTypes={availableTypes}
        tripperBadge={{ name: tripperName, avatarUrl }}
        tripperMode
        tripperSlug={tripperSlug ?? undefined}
        wrapped
      />
    </Section>
  );
}
