import LevelCard from "@/components/by-type/shared/LevelCard";
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

export function XsedLevelCard({ copy, locale, travelType }: XsedLevelCardProps) {
  return (
    <LevelCard
      badgeLabel={copy.badge}
      ctaClassName="text-ink"
      href={pathForLocale(hasLocale(locale) ? locale : "es", "/xsed")}
      level={{
        ...copy,
        id: "xsed",
        maxNights: 1,
        price: getXsedPricePerPerson(travelType),
        priceLabel: "",
        excuses: [],
      }}
      navigateOnCardClick
      variant="light"
    />
  );
}
