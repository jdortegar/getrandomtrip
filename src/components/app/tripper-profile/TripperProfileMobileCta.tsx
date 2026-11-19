import { ArrowUpRight } from "lucide-react";
import { ButtonV2 } from "@/components/ui/ButtonV2";
import { TRIPPER_PROFILE_ANCHORS } from "@/components/app/tripper-profile/TripperProfileSubnav";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import type { TripperPublicProfileDict } from "@/lib/types/dictionary";

interface TripperProfileMobileCtaProps {
  copy: TripperPublicProfileDict["mobileCta"];
  firstName: string;
}

/** Mobile-only bar pinned to the bottom of the screen: a short line and the "start your trip" action. */
export function TripperProfileMobileCta({ copy, firstName }: TripperProfileMobileCtaProps) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-gray-200 bg-ground/95 px-5 py-3 backdrop-blur md:hidden"
      data-component="TripperProfileMobileCta"
    >
      <p className="max-w-[11rem] text-[11px] leading-snug text-ink">{interpolateTemplate(copy.text, { name: firstName })}</p>
      <ButtonV2 asChild size="sm">
        <a href={`#${TRIPPER_PROFILE_ANCHORS.journeys}`}>
          {copy.cta}
          <ArrowUpRight aria-hidden />
        </a>
      </ButtonV2>
    </div>
  );
}
