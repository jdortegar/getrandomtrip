import { ArrowUpRight } from "lucide-react";
import { TRIPPER_PROFILE_ANCHORS } from "@/components/app/tripper-profile/TripperProfileSubnav";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import { cn } from "@/lib/utils";
import type { TripperPublicProfileDict } from "@/lib/types/dictionary";

interface TripperProfileExpertiseStripProps {
  copy: TripperPublicProfileDict["strip"];
  firstName: string;
  /** Localized labels of the enabled traveler types, e.g. ["Solo", "Pareja"]. */
  typeLabels: string[];
}

/** "I design experiences for SOLO · COUPLE · FRIENDS" + the Tripper/Randomtrip promise + atlas link. */
export function TripperProfileExpertiseStrip({ copy, firstName, typeLabels }: TripperProfileExpertiseStripProps) {
  const [perspective, ...support] = interpolateTemplate(copy.promise, { name: firstName }).split(/(?<=\.)\s+/);

  return (
    <div className="rt-container" data-component="TripperProfileExpertiseStrip">
      <div
        className={cn(
          "grid grid-cols-1 gap-6 border-y border-gray-200 py-6",
          "md:grid-cols-3 md:items-center",
        )}
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-600">{copy.label}</p>
          <p className="mt-2 text-sm uppercase tracking-[0.05em] text-ink">{typeLabels.join(" · ")}</p>
        </div>
        <div className="flex items-center gap-4 border-t border-gray-200 pt-6 md:justify-center md:border-0 md:pt-0">
          <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/30 text-primary">
            <ArrowUpRight className="h-4 w-4" />
          </span>
          <p className="text-[13px] leading-normal">
            <span className="block text-ink">{perspective}</span>
            {support.length ? <span className="block font-semibold text-primary">{support.join(" ")}</span> : null}
          </p>
        </div>
        <a
          className="hidden min-h-11 items-center justify-between gap-6 border-b border-ink text-sm text-ink transition-colors hover:border-primary hover:text-primary md:ml-auto md:flex md:w-fit"
          href={`#${TRIPPER_PROFILE_ANCHORS.atlas}`}
        >
          {copy.atlasLink}
          <ArrowUpRight aria-hidden className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
