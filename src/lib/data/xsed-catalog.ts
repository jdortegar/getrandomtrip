/**
 * XSED product catalog — checkout display data (card + level).
 * XSED is a flat-rate Sunday-drop product, not a traveler type with planner/levels.
 * Pricing: XSED_PRICE_PER_PERSON from traveler-types.
 */

import { XSED_PRICE_PER_PERSON } from "@/lib/data/traveler-types";
import type { TravelerTypeCardData } from "@/lib/utils/traveler-card";
import type { Level } from "@/lib/utils/levels";

// ─── Card ─────────────────────────────────────────────────────────────────────

const XSED_CARD_ES: TravelerTypeCardData = {
  img: "/images/xsed-hero.jpg",
  key: "xsed",
  subtitle: "Escapada sorpresa de un día",
  title: "XSED",
};

const XSED_CARD_EN: TravelerTypeCardData = {
  img: "/images/xsed-hero.jpg",
  key: "xsed",
  subtitle: "One-day surprise escape",
  title: "XSED",
};

export function getXsedCard(locale?: string): TravelerTypeCardData {
  return locale?.startsWith("en") ? XSED_CARD_EN : XSED_CARD_ES;
}

// ─── Level ────────────────────────────────────────────────────────────────────

const XSED_LEVEL_ES: Level = {
  id: "xsed",
  name: "XSED Drop",
  description:
    "Escapada sorpresa de un día — destino revelado el día del viaje.",
  color: "bg-orange-500",
  maxNights: 1,
  price: XSED_PRICE_PER_PERSON,
  priceLabel: `${XSED_PRICE_PER_PERSON} USD`,
  minBudget: 0,
  maxBudget: 9999,
  features: [
    "1 día (salida y regreso el mismo día)",
    "Destino sorpresa — revelado el día del viaje",
    "Experiencia grupal organizada",
  ],
  icon: "⚡",
};

const XSED_LEVEL_EN: Level = {
  id: "xsed",
  name: "XSED Drop",
  description:
    "One-day surprise escape — destination revealed on the day of travel.",
  color: "bg-orange-500",
  maxNights: 1,
  price: XSED_PRICE_PER_PERSON,
  priceLabel: `${XSED_PRICE_PER_PERSON} USD`,
  minBudget: 0,
  maxBudget: 9999,
  features: [
    "1 day (departure and return same day)",
    "Surprise destination — revealed on the day of travel",
    "Organized group experience",
  ],
  icon: "⚡",
};

export function getXsedLevel(locale?: string): Level {
  return locale?.startsWith("en") ? XSED_LEVEL_EN : XSED_LEVEL_ES;
}
