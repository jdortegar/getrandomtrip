import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Img from "@/components/common/Img";
import { TripperProfileSectionHeading } from "@/components/app/tripper-profile/TripperProfileSectionHeading";
import { TRIPPER_PROFILE_ANCHORS } from "@/components/app/tripper-profile/TripperProfileSubnav";
import { cn } from "@/lib/utils";
import type { TripperProfileEditorDict, TripperPublicProfileDict } from "@/lib/types/dictionary";
import type { TripperProfileDraft, TripperProfileTravelerType } from "@/types/tripper";

interface TripperProfileJourneyCardsProps {
  copy: TripperPublicProfileDict["journeys"];
  /** Where each card starts the booking flow (with the Tripper attributed). */
  hrefs: Record<TripperProfileTravelerType, string>;
  travelerTypes: TripperProfileDraft["travelerTypes"];
  typeCopy: TripperProfileEditorDict["travelerTypes"]["types"];
  types: TripperProfileTravelerType[];
}

function isLocalUrl(url: string) {
  return url.startsWith("blob:") || url.startsWith("data:");
}

/** One photo card per active traveler type (SOLUM / BOND / CREW) plus the four trust points. */
export function TripperProfileJourneyCards({
  copy,
  hrefs,
  travelerTypes,
  typeCopy,
  types,
}: TripperProfileJourneyCardsProps) {
  return (
    <section
      aria-labelledby="tripper-journeys-title"
      className="rt-container scroll-mt-32 py-12 md:py-16"
      data-component="TripperProfileJourneyCards"
      id={TRIPPER_PROFILE_ANCHORS.journeys}
    >
      <TripperProfileSectionHeading aside={copy.aside} eyebrow={copy.eyebrow} id="tripper-journeys-title" title={copy.title} />
      <ul className={cn("grid grid-cols-1 gap-4", "sm:grid-cols-2 lg:grid-cols-3")}>
        {types.map((type, index) => {
          const card = travelerTypes[type];
          return (
            <li key={type}>
              <Link
                className={cn(
                  "group relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-2xl bg-ink p-5 text-white",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40",
                )}
                href={hrefs[type]}
              >
                {card.imageUrl ? (
                  <Img
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    src={card.imageUrl}
                    unoptimized={isLocalUrl(card.imageUrl)}
                  />
                ) : null}
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
                <span className="relative flex justify-between text-[11px] font-semibold uppercase tracking-[0.18em]">
                  {typeCopy[type].product}
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </span>
                <span className="relative flex flex-col gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-90">
                    {copy.taglines[type]}
                  </span>
                  <span className="font-barlow-condensed text-4xl font-bold uppercase leading-none">
                    {typeCopy[type].label}
                  </span>
                  <span className="whitespace-pre-line text-sm opacity-90">{card.text}</span>
                  <span className="mt-4 flex items-center justify-between border-t border-white/30 pt-3 text-xs font-semibold uppercase tracking-[0.14em]">
                    {copy.ctas[type]}
                    <ArrowUpRight aria-hidden className="h-5 w-5" />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <ul className={cn("mt-6 grid grid-cols-2 gap-3 text-xs text-neutral-600", "md:grid-cols-4")} data-trust>
        {copy.trust.map((item) => (
          <li className="flex items-center gap-2" key={item}>
            <ArrowUpRight aria-hidden className="h-3 w-3 shrink-0 text-neutral-500" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
