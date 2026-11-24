import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { countryLabel } from "@/lib/geo/countryOptions";
import { groupPlacesByCountry } from "@/lib/helpers/tripperPublicProfile";
import { cn } from "@/lib/utils";
import type { TripperPublicProfileDict } from "@/lib/types/dictionary";
import type { TripperProfilePlace } from "@/types/tripper";

interface TripperProfileAtlasListProps {
  copy: TripperPublicProfileDict["atlas"];
  locale: string;
  places: TripperProfilePlace[];
  storyHrefs: Record<string, string>;
}

/** List view of the atlas: one card per country with its places. */
export function TripperProfileAtlasList({ copy, locale, places, storyHrefs }: TripperProfileAtlasListProps) {
  return (
    <ul className={cn("grid grid-cols-1 gap-4 p-5", "sm:grid-cols-2 lg:grid-cols-3")} data-component="TripperProfileAtlasList">
      {groupPlacesByCountry(places).map((group) => (
        <li className="rounded-xl bg-ground p-4" key={group.countryCode}>
          <p className="flex items-baseline justify-between font-barlow-condensed text-xl font-bold text-ink">
            <span suppressHydrationWarning>{countryLabel(group.countryCode, locale)}</span>
            <span className="font-barlow text-xs font-normal text-neutral-500">{group.places.length}</span>
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {group.places.map((place) => {
              const href = place.storyId ? storyHrefs[place.storyId] : undefined;
              return (
                <li className="flex items-start gap-2 text-sm" key={place.id}>
                  <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-ink">{place.city ?? copy.wholeCountry}</span>
                    <span className="block text-[11px] text-neutral-500">
                      {place.isLocalExpert ? copy.localExpert : copy.visited}
                    </span>
                  </span>
                  {href ? (
                    <Link aria-label={copy.story} className="flex h-8 w-8 items-center justify-center text-primary" href={href}>
                      <ArrowUpRight aria-hidden className="h-4 w-4" />
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}
