import type { CSSProperties } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import Img from "@/components/common/Img";
import { ButtonV2 } from "@/components/ui/ButtonV2";
import { TRIPPER_PROFILE_ANCHORS } from "@/components/app/tripper-profile/TripperProfileSubnav";
import { countryLabel } from "@/lib/geo/countryOptions";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import { cn } from "@/lib/utils";
import type { TripperPublicProfileDict } from "@/lib/types/dictionary";
import type { TripperProfileIdentity } from "@/types/tripper";

interface TripperProfileHeroProps {
  /** Editorial collection number, e.g. "014"; the label is hidden without it. */
  collectionNumber?: string;
  copy: TripperPublicProfileDict["hero"];
  identity: TripperProfileIdentity;
  locale: string;
  payoff: string;
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

function isLocalUrl(url: string) {
  return url.startsWith("blob:") || url.startsWith("data:");
}

/** Name, residence, intro line and CTA beside the cover photo, with the brand sign-off and portrait card. */
export function TripperProfileHero({ collectionNumber, copy, identity, locale, payoff }: TripperProfileHeroProps) {
  const location = [identity.city, identity.countryCode ? countryLabel(identity.countryCode, locale) : ""]
    .filter(Boolean)
    .join(", ");
  const [firstWord, ...rest] = identity.name.trim().split(/\s+/);

  return (
    <section
      aria-labelledby="tripper-profile-name"
      className={cn("rt-container grid grid-cols-1 gap-12 pb-12 pt-8", "lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center")}
      data-component="TripperProfileHero"
    >
      <div className="flex flex-col items-start">
        <p className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-ink">
          <span aria-hidden className="h-px w-6 bg-ink" />
          {copy.eyebrow}
          {collectionNumber ? ` · ${interpolateTemplate(copy.collection, { number: collectionNumber })}` : null}
        </p>
        <h1
          className="mt-8 font-barlow-condensed text-[76px] font-bold uppercase leading-[0.88] tracking-[-0.025em] text-ink md:text-[88px] md:leading-[0.9]"
          id="tripper-profile-name"
        >
          {firstWord}
          <br />
          {rest.length ? `${rest.join(" ")}.` : null}
        </h1>
        {location ? (
          <p className="mt-6 text-sm text-ink" suppressHydrationWarning>
            {location}
          </p>
        ) : null}
        <p className="mt-6 max-w-md whitespace-pre-line text-lg leading-normal text-ink">{identity.headline}</p>
        <ButtonV2 asChild className="mt-8 min-h-12 gap-8 py-3">
          <a href={`#${TRIPPER_PROFILE_ANCHORS.journeys}`}>
            {copy.cta}
            <ArrowUpRight aria-hidden />
          </a>
        </ButtonV2>
        <a
          className="mt-6 flex min-h-11 items-center gap-6 border-b border-ink text-sm text-ink transition-colors hover:border-primary hover:text-primary"
          href={`#${TRIPPER_PROFILE_ANCHORS.about}`}
        >
          {copy.aboutLink}
          <ArrowDown aria-hidden className="h-4 w-4" />
        </a>
      </div>

      <div className="relative pb-8 lg:pb-0">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-300 lg:aspect-[67/51]">
          {identity.coverUrl ? (
            <Img
              alt={identity.coverAlt}
              className="absolute inset-0 h-full w-full object-cover"
              priority
              sizes="(min-width: 1024px) 60vw, 100vw"
              src={identity.coverUrl}
              unoptimized={isLocalUrl(identity.coverUrl)}
            />
          ) : null}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
          <div className="absolute inset-x-6 top-5 flex justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
            <span>{copy.mapLabel}</span>
            {identity.city ? <span>{identity.city}</span> : null}
          </div>
          <div className="absolute bottom-6 left-6 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <span aria-hidden className="h-12 w-12 bg-feature" style={ISO_MASK} />
              <p className="whitespace-pre-line font-barlow-condensed text-lg font-bold uppercase leading-tight text-white">
                {payoff.replace(/\.\s+/g, ".\n")}
              </p>
            </div>
            {identity.coverCaption ? <p className="text-xs text-white">{identity.coverCaption}</p> : null}
          </div>
        </div>
        {identity.portraitUrl ? (
          <figure className="absolute -bottom-2 right-6 w-32 rounded-xl bg-white p-2 shadow-lg sm:w-36 lg:-bottom-6">
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-gray-200">
              <Img
                alt={interpolateTemplate(copy.portraitAlt, { name: identity.name })}
                className="absolute inset-0 h-full w-full object-cover"
                sizes="144px"
                src={identity.portraitUrl}
                unoptimized={isLocalUrl(identity.portraitUrl)}
              />
            </div>
          </figure>
        ) : null}
      </div>
    </section>
  );
}
