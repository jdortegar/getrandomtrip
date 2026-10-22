"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Check, Clock } from "lucide-react";
import { localizeHref } from "@/lib/i18n/localizeHref";
import type {
  ExperienceCardCtaStyle,
  ExperienceCardDetail,
  Level,
} from "@/types/planner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import Img from "@/components/common/Img";
import Link from "@/components/common/LocalizedLink";
import { ExperienceCardName } from "@/components/by-type/shared/ExperienceCardName";
import { ExperienceCardTransport } from "@/components/by-type/shared/ExperienceCardTransport";
import { useDictionary, useLocale } from "@/hooks/useDictionary";

interface ExperienceCardProps {
  /** Custom text for the photo ribbon; overrides the featured "most chosen" ribbon. */
  badgeLabel?: string;
  ctaClassName?: string;
  /** When true, the CTA selects the level instead of linking to the journey. */
  ctaSelects?: boolean;
  featured?: boolean;
  /** Explicit destination for a standalone product; regular levels keep their default route. */
  href?: string;
  level: Level;
  /** When true, card click navigates to the CTA `href` instead of calling `onSelect`. */
  navigateOnCardClick?: boolean;
  onSelect?: (levelId: string) => void;
  selected?: boolean;
  /** When set (and `tripperBadge` is not), renders "BY RANDOMTRIP" — the level is still bookable at Randomtrip's base price. */
  showRandomtripBadge?: boolean;
  travelerType?: string;
  /** Tripper branding — when defined, renders "BY TRIPPER {name}" on this card. */
  tripperBadge?: { name: string; avatarUrl: string | null };
  /** Accepted for LevelCard parity; the card surface is always white per design. */
  variant?: "light" | "off-white";
  className?: string;
}

const CTA_VARIANT: Record<
  ExperienceCardCtaStyle,
  "default" | "feature" | "secondary"
> = {
  feature: "feature",
  outline: "secondary",
  primary: "default",
};

const CTA_TEXT: Record<ExperienceCardCtaStyle, string> = {
  feature: "text-ink",
  outline: "text-primary",
  primary: "text-white",
};

export function ExperienceCard({
  badgeLabel,
  ctaClassName,
  ctaSelects = false,
  featured = false,
  href,
  level,
  navigateOnCardClick = false,
  onSelect,
  selected = false,
  showRandomtripBadge = false,
  travelerType,
  tripperBadge,
  className,
}: ExperienceCardProps) {
  const router = useRouter();
  const locale = useLocale();
  const tripperCopy = useDictionary((d) => d.journey.tripperBadge);
  const copy = useDictionary((d) => d.experienceCard);
  const card = level.card;
  const ribbon = badgeLabel ?? (featured ? tripperCopy.mostChosen : undefined);
  const ctaHref = localizeHref(
    locale,
    href ??
      (travelerType
        ? `/journey?travelType=${travelerType}&experience=${level.id}`
        : `/experiences/by-type/${level.id}`),
  );
  const selectsInPlace = ctaSelects && Boolean(onSelect);
  const ctaStyle = card?.ctaStyle ?? "primary";
  const ctaLabel = card?.ctaLabel ?? level.ctaLabel;
  const name = card?.name ?? level.name;
  const kicker = card?.kicker ?? level.subtitle;
  const description = card?.description ?? level.closingLine;
  const details: ExperienceCardDetail[] =
    card?.details ??
    level.features.map((feature) => ({
      label: feature.title,
      value: feature.description,
    }));
  const footnotes = card?.footnotes ?? [];
  const ctaClasses = cn(
    "h-[46px] w-full rounded-[3px] px-2.5 py-[3px] text-[15px] font-semibold leading-6 tracking-[1.5px]",
    CTA_TEXT[ctaStyle],
    ctaClassName,
  );

  const handleClick = () => {
    if (navigateOnCardClick) {
      router.push(ctaHref);
      return;
    }
    onSelect?.(level.id);
  };

  return (
    <div
      className={cn(
        "@container relative flex h-full min-h-[620px] w-full max-w-[300px] flex-col overflow-hidden rounded-[7px] bg-white text-left transition-shadow duration-300",
        "shadow-[0_4px_23.9px_0_rgba(0,0,0,0.13)]",
        (onSelect || navigateOnCardClick) &&
          "cursor-pointer hover:shadow-[0_6px_28px_0_rgba(0,0,0,0.2)]",
        className,
      )}
      data-component="ExperienceCard"
      data-selected={selected || undefined}
      onClick={navigateOnCardClick || onSelect ? handleClick : undefined}
    >
      {selected && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 rounded-[7px] border-4 border-primary"
        />
      )}
      {selected && (
        <div className="absolute right-2 top-2 z-30">
          <div
            aria-label={copy.selected}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary"
            role="img"
          >
            <Check aria-hidden className="h-5 w-5 text-white" strokeWidth={3} />
          </div>
        </div>
      )}
      {card ? (
        <div className="relative shrink-0">
          <div className="relative h-[135.5px] w-full overflow-hidden">
            <Img
              alt={card.photoAlt}
              className="absolute inset-0 h-full w-full object-cover"
              height={256}
              sizes="300px"
              src={card.photoSrc}
              style={{ objectPosition: card.photoPosition }}
              width={600}
            />
            <span className="absolute left-[14.5px] top-[13.5px] flex h-[21px] min-w-[97px] items-center justify-center whitespace-nowrap rounded-[2px] bg-ground px-3 text-xs font-semibold uppercase leading-none text-primary">
              {card.tag}
            </span>
          </div>
          {ribbon && (
            <span
              className="absolute right-[21px] top-[124px] z-10 flex h-[21px] min-w-[97px] items-center justify-center whitespace-nowrap rounded-[2px] bg-feature px-3 text-xs font-semibold uppercase leading-none text-ink"
              data-ribbon
            >
              {ribbon}
            </span>
          )}
        </div>
      ) : (
        ribbon && (
          <div data-ribbon>
            <Label className="px-[16.5px] pt-4" text={ribbon} />
          </div>
        )
      )}

      <div className="flex flex-1 flex-col px-[16.5px] pb-[21px] pt-[14.5px]">
        {(tripperBadge || showRandomtripBadge) && (
          <p className="mb-1.5 font-barlow-condensed text-[0.65rem] font-extrabold uppercase leading-tight text-neutral-600 @[280px]:text-xs">
            {tripperBadge
              ? `${tripperCopy.byTripper} ${tripperBadge.name}`
              : tripperCopy.byRandomtrip}
          </p>
        )}

        <p className="font-barlow text-xs leading-none text-neutral-600">
          {kicker}
        </p>

        <div className="mt-0.5 flex items-end gap-2">
          <ExperienceCardName name={name} />
          <div className="mb-1 h-[29px] w-px shrink-0 bg-primary" />
          <div className="flex shrink-0 flex-col justify-end">
            {level.priceLabel ? (
              <span className="text-[10px] leading-none text-neutral-600">
                {level.priceLabel}
              </span>
            ) : null}
            <span className="whitespace-nowrap font-barlow-condensed text-[22px] font-bold leading-[26px] text-primary">
              {`USD ${level.price}`}
            </span>
            <span className="max-w-[8rem] whitespace-pre-line text-xs leading-tight text-neutral-600">
              {level.priceFootnote || copy.perPerson}
            </span>
          </div>
        </div>

        {card?.eyebrow ? (
          <p className="mt-[13px] font-barlow text-[18px] font-semibold leading-[18px] text-primary">
            {card.eyebrow}
          </p>
        ) : null}

        <p className="mt-1.5 text-sm leading-[19px] text-neutral-600">
          {description}
        </p>

        <div className="mt-[15px] h-px bg-secondary-100" />

        <dl className="mt-[15px] grid grid-cols-[79px_1fr] items-center gap-x-0 gap-y-[5px] text-xs leading-[14px]">
          {details.map((detail) => (
            <React.Fragment key={detail.label}>
              <dt className="pr-2 font-normal leading-snug text-primary">
                {detail.label}
              </dt>
              <dd className="font-semibold leading-snug text-neutral-600">
                {detail.kind === "transport" && card?.transport ? (
                  <span className="flex flex-wrap items-center gap-x-[7px] gap-y-1">
                    <ExperienceCardTransport
                      label={detail.value}
                      modes={card.transport.modes}
                      optionalModes={card.transport.optionalModes}
                    />
                    {card.transportNote ? (
                      <span className="text-[10px] font-normal text-neutral-600">
                        {card.transportNote}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  detail.value
                )}
              </dd>
            </React.Fragment>
          ))}
        </dl>

        {footnotes.length > 0 && (
          <div className="mt-3 space-y-1">
            {footnotes.map((note) => (
              <p
                className="text-[10px] leading-snug text-neutral-500"
                key={note}
              >
                {note}
              </p>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4">
          {card?.revealNote ? (
            <p className="mb-3 flex items-center gap-1 text-xs leading-none text-neutral-600">
              <Clock aria-hidden className="h-2.5 w-2.5 shrink-0" />
              {card.revealNote}
            </p>
          ) : null}
          {selectsInPlace ? (
            <Button
              className={ctaClasses}
              onClick={(event) => {
                event.stopPropagation();
                onSelect?.(level.id);
              }}
              type="button"
              variant={CTA_VARIANT[ctaStyle]}
            >
              {ctaLabel}
            </Button>
          ) : (
            <Button
              asChild
              className={ctaClasses}
              variant={CTA_VARIANT[ctaStyle]}
            >
              <Link
                href={ctaHref}
                onClick={(event) => event.stopPropagation()}
                scroll={href !== undefined || !navigateOnCardClick}
              >
                {ctaLabel}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
