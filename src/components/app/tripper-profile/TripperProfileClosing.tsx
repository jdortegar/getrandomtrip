import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { ButtonV2 } from "@/components/ui/ButtonV2";
import { TRIPPER_PROFILE_ANCHORS } from "@/components/app/tripper-profile/TripperProfileSubnav";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import { cn } from "@/lib/utils";
import type { TripperPublicProfileDict } from "@/lib/types/dictionary";

interface TripperProfileClosingProps {
  copy: TripperPublicProfileDict["closing"];
  firstName: string;
}

const ISO_MASK: CSSProperties = {
  maskImage: "url(/assets/logos/iso-randomtrip.svg)",
  maskPosition: "center",
  maskRepeat: "no-repeat",
  maskSize: "contain",
  WebkitMaskImage: "url(/assets/logos/iso-randomtrip.svg)",
  WebkitMaskPosition: "center",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskSize: "contain",
};

/**
 * Closing band as in the approved prototype: Deep Teal with the all-Ochre
 * isologo (an approved Brand Book lockup) and the sage payoff.
 */
export function TripperProfileClosing({ copy, firstName }: TripperProfileClosingProps) {
  return (
    <section aria-labelledby="tripper-closing-title" className="bg-primary text-ground" data-component="TripperProfileClosing">
      <div
        className={cn(
          "grid grid-cols-1 items-center gap-8 px-5 py-[53px]",
          "md:grid-cols-3 md:gap-10 md:px-8 md:py-[70px]",
        )}
      >
        <div className="flex flex-col items-start">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/75">{copy.eyebrow}</p>
          <h2
            className="mt-4 max-w-md font-barlow-condensed text-[40px] font-bold leading-[1.05] tracking-[-0.025em] md:text-5xl"
            id="tripper-closing-title"
          >
            {copy.title}
          </h2>
          <ButtonV2 asChild className="mt-8 bg-feature text-ink hover:bg-feature/90" variant="light">
            <a href={`#${TRIPPER_PROFILE_ANCHORS.journeys}`}>
              {interpolateTemplate(copy.cta, { name: firstName })}
              <ArrowUpRight aria-hidden />
            </a>
          </ButtonV2>
        </div>
        <span aria-hidden className="mx-auto hidden h-44 w-44 bg-feature md:block" style={ISO_MASK} />
        <p className="font-barlow-condensed text-[26px] font-bold uppercase leading-[1.1] tracking-[0.02em] text-secondary md:text-right md:text-[52px] md:leading-[1.03] md:tracking-[0.03em]">
          <span className="md:hidden">{copy.payoff}</span>
          <span className="hidden whitespace-pre-line md:inline">{copy.payoff.replace(/\.\s+/g, ".\n")}</span>
        </p>
      </div>
    </section>
  );
}
