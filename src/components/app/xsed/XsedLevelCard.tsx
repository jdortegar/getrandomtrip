import { ExperienceCard } from "@/components/by-type/shared/ExperienceCard";
import { getExperienceCard } from "@/lib/data/experience-cards";
import { getXsedPricePerPerson } from "@/lib/data/traveler-types";
import { hasLocale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { XsedLevelCardDict } from "@/lib/types/dictionary";

interface XsedLevelCardProps {
  copy: XsedLevelCardDict;
  locale: string;
  /** Selected traveler type; prices the card at that type's XSED rate. */
  travelType: string;
}

/** Card content for the selected type; couple's (plural copy) when the type has none. */
const FALLBACK_CARD_TYPE = "couple";

export function XsedLevelCard({ copy, locale, travelType }: XsedLevelCardProps) {
  const card =
    getExperienceCard(travelType, "xsed", locale) ??
    getExperienceCard(FALLBACK_CARD_TYPE, "xsed", locale) ??
    undefined;
  return (
    <ExperienceCard
      ctaClassName="text-ink"
      href={pathForLocale(hasLocale(locale) ? locale : "es", "/xsed")}
      level={{
        ...copy,
        card,
        id: "xsed",
        maxNights: 1,
        price: getXsedPricePerPerson(travelType),
        priceLabel: "",
        excuses: [],
      }}
      navigateOnCardClick
    />
  );
}
