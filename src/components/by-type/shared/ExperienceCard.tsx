"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  BusFront,
  CarFront,
  Check,
  Clock,
  Plane,
  Plus,
  Ship,
  TrainFront,
} from "lucide-react";
import { localizeHref } from "@/lib/i18n/localizeHref";
import type {
  ExperienceCardCtaStyle,
  ExperienceCardDetail,
  ExperienceCardTransportMode,
  Level,
} from "@/types/planner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import Img from "@/components/common/Img";
import Link from "@/components/common/LocalizedLink";
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

const TRANSPORT_ICONS: Record<
  ExperienceCardTransportMode,
  React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
  "bus-front": BusFront,
  "car-front": CarFront,
  plane: Plane,
  ship: Ship,
  "train-front": TrainFront,
};

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

/** Renders a trailing "™" as a small superscript. */
function renderName(name: string) {
  const match = /^(.*?)\s*™$/.exec(name);
  if (!match) return name;
  return (
    <>
      {match[1]}
      <sup className="ml-px align-super text-[0.45em]">™</sup>
    </>
  );
}

function TransportIcons({
  label,
  modes,
  optionalModes,
}: {
  label: string;
  modes: ExperienceCardTransportMode[];
  optionalModes?: ExperienceCardTransportMode[];
}) {
  const icon = (mode: ExperienceCardTransportMode) => {
    const Icon = TRANSPORT_ICONS[mode];
    return (
      <Icon aria-hidden className="h-[18px] w-[18px] text-primary" key={mode} />
    );
  };
  return (
    <span
      aria-label={label}
      className="flex flex-wrap items-center gap-1.5"
      data-transport-icons
      role="img"
    >
      {modes.map(icon)}
      {optionalModes?.length ? (
        <>
          <Plus aria-hidden className="h-3 w-3 text-neutral-500" />
          {optionalModes.map(icon)}
        </>
      ) : null}
    </span>
  );
}

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
    "h-12 w-full rounded-[4px] text-[15px] tracking-[0.12em]",
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
        "@container relative flex h-full w-full flex-col overflow-hidden rounded-[7px] bg-white transition-shadow duration-300",
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

      {/* Photo header — tag chip top-left, ribbon straddling the bottom edge */}
      {card ? (
        <div className="relative shrink-0">
          <div className="relative aspect-[5/2] w-full overflow-hidden">
            <Img
              alt={card.photoAlt}
              className="absolute inset-0 h-full w-full object-cover"
              height={400}
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
              src={card.photoSrc}
              style={{ objectPosition: card.photoPosition }}
              width={1000}
            />
            <span className="absolute left-3 top-3 rounded-sm bg-ground px-[11px] py-1.5 text-[11px] font-semibold uppercase leading-none tracking-wide text-primary">
              {card.tag}
            </span>
          </div>
          {ribbon && (
            <Label
              className="absolute bottom-0 right-4 z-10 translate-y-1/2 whitespace-nowrap"
              text={ribbon}
            />
          )}
        </div>
      ) : (
        ribbon && <Label className="px-4 pt-4 @[280px]:px-5" text={ribbon} />
      )}

      <div className="flex flex-1 flex-col px-4 pb-4 pt-5 @[280px]:px-5 @[280px]:pb-5">
        {(tripperBadge || showRandomtripBadge) && (
          <p className="mb-1.5 font-barlow-condensed text-[0.65rem] font-extrabold uppercase leading-tight text-neutral-600 @[280px]:text-xs">
            {tripperBadge
              ? `${tripperCopy.byTripper} ${tripperBadge.name}`
              : tripperCopy.byRandomtrip}
          </p>
        )}

        <p className="font-barlow text-xs text-neutral-600">{kicker}</p>

        {/* Name | price */}
        <div className="mt-1 flex items-stretch gap-3">
          <h3 className="min-w-0 flex-1 font-barlow-condensed text-[1.6rem] font-extrabold uppercase leading-[0.95] text-primary @[280px]:text-[1.75rem]">
            {renderName(name)}
          </h3>
          <div className="w-px shrink-0 bg-neutral-300" />
          <div className="flex shrink-0 flex-col justify-center">
            {level.priceLabel ? (
              <span className="text-[11px] leading-none text-neutral-600">
                {level.priceLabel}
              </span>
            ) : null}
            <span className="whitespace-nowrap font-barlow-condensed text-xl font-bold leading-tight text-primary">
              {`USD ${level.price}`}
            </span>
            <span className="max-w-[8rem] whitespace-pre-line text-[11px] leading-tight text-neutral-600">
              {level.priceFootnote || copy.perPerson}
            </span>
          </div>
        </div>

        {card?.eyebrow ? (
          <p className="mt-3 font-barlow text-base font-semibold leading-snug text-primary">
            {card.eyebrow}
          </p>
        ) : null}

        <p className="mt-2 text-pretty text-[13px] leading-relaxed text-neutral-600">
          {description}
        </p>

        <div className="my-4 border-t border-gray-200" />

        <dl className="grid grid-cols-[84px_1fr] gap-x-3 gap-y-2 text-xs text-primary @[280px]:grid-cols-[90px_1fr]">
          {details.map((detail) => (
            <React.Fragment key={detail.label}>
              <dt className="leading-snug">{detail.label}</dt>
              <dd className="font-semibold leading-snug">
                {detail.kind === "transport" && card?.transport ? (
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <TransportIcons
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
                className="text-[11px] leading-snug text-neutral-500"
                key={note}
              >
                {note}
              </p>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4">
          {card?.revealNote ? (
            <p className="mb-2.5 flex items-center gap-1.5 text-[11px] text-neutral-600">
              <Clock aria-hidden className="h-3 w-3 shrink-0" />
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
