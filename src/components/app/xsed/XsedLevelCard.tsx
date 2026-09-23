import LevelCard from "@/components/by-type/shared/LevelCard";
import { XSED_PRICE_PER_PERSON } from "@/lib/data/traveler-types";
import { hasLocale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { XsedLevelCardDict } from "@/lib/types/dictionary";

interface XsedLevelCardProps {
  copy: XsedLevelCardDict;
  locale: string;
}

export function XsedLevelCard({ copy, locale }: XsedLevelCardProps) {
  return (
    <LevelCard
      ctaClassName="text-ink"
      href={pathForLocale(hasLocale(locale) ? locale : "es", "/xsed")}
      level={{
        ...copy,
        id: "xsed",
        maxNights: 1,
        price: XSED_PRICE_PER_PERSON,
        priceLabel: "",
        excuses: [],
      }}
      navigateOnCardClick
      variant="light"
    />
  );
}
