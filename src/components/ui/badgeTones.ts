/**
 * The one brand-aligned colour set for every small read-only label: status
 * badges (`StatusIndicatorBadge`) and classification badges (`Badge`).
 *
 * Green and red keep the strong live/problem signals; everything else uses the
 * brand palette. Text is always Deep Teal, Ink or a dark neutral (≥ 6:1 on its
 * wash) because Sage and Ochre are too light for text on white — they only
 * tint the wash, border and dot.
 */
export const BADGE_TONES = {
  /** Live / done well. */
  success: {
    badge: "bg-green-50 border-green-200 text-green-800",
    dot: "bg-green-500",
  },
  /** Problem. */
  danger: { badge: "bg-red-50 border-red-200 text-red-800", dot: "bg-red-500" },
  /** Needs attention / pending; also the reveal moment. */
  ochre: {
    badge: "bg-feature/15 border-feature/50 text-ink",
    dot: "bg-feature",
  },
  /** In progress / booked. */
  sage: {
    badge: "bg-secondary/35 border-secondary text-primary",
    dot: "bg-primary/50",
  },
  /** Finished / handed to the tripper. */
  teal: {
    badge: "bg-primary/10 border-primary/25 text-primary",
    dot: "bg-primary",
  },
  /** Inactive / other / plain metadata. */
  ground: {
    badge: "bg-ground border-gray-200 text-neutral-600",
    dot: "bg-neutral-400",
  },
  /** What something is (type, category, tag): a lighter sage than `sage`. */
  category: {
    badge: "bg-secondary/20 border-secondary/60 text-primary",
    dot: "bg-primary/50",
  },
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;
