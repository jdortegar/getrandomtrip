"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Globe,
  Plane,
  Truck,
  Check,
  Bed,
  Gift,
  Calendar,
  Sparkles,
} from "lucide-react";
import type { Level } from "@/types/planner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import Link from "next/link";
import { useDictionary } from "@/hooks/useDictionary";

interface LevelCardProps {
  ctaClassName?: string;
  featured?: boolean;
  /** Explicit destination for a standalone product; regular levels keep their default route. */
  href?: string;
  level: Level;
  /** When true, card click navigates to the CTA `href` instead of calling `onSelect`. */
  navigateOnCardClick?: boolean;
  onSelect?: (levelId: string) => void;
  selected?: boolean;
  /** When set (and `tripperBadge` is not), renders the Randomtrip isologo + "BY RANDOMTRIP" — this level isn't offered by the attributed tripper, but is still bookable at Randomtrip's base price. */
  showRandomtripBadge?: boolean;
  travelerType?: string;
  /** Tripper branding — when defined, renders "BY TRIPPER {name}" on this card (curated journey, level the tripper actually offers). */
  tripperBadge?: { name: string; avatarUrl: string | null };
  variant?: "light" | "off-white";
  className?: string;
}

const FEATURE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Duración: Clock,
  Duration: Clock,
  Destinos: Globe,
  Destinations: Globe,
  Transporte: Truck,
  Transport: Truck,
  Alojamiento: Bed,
  Accommodation: Bed,
  Beneficios: Gift,
  Benefits: Gift,
  Extras: Sparkles,
  Fechas: Calendar,
  Dates: Calendar,
};

export default function LevelCard({
  ctaClassName,
  featured = false,
  href,
  level,
  navigateOnCardClick = false,
  onSelect,
  selected = false,
  showRandomtripBadge = false,
  travelerType,
  tripperBadge,
  variant = "light",
  className,
}: LevelCardProps) {
  const router = useRouter();
  const byTripperLabel = useDictionary((d) => d.journey.tripperBadge.byTripper);
  const byRandomtripLabel = useDictionary(
    (d) => d.journey.tripperBadge.byRandomtrip,
  );
  const ctaHref =
    href ??
    (travelerType
      ? `/journey?travelType=${travelerType}&experience=${level.id}`
      : `/experiences/by-type/${level.id}`);
  const textColor = "text-ink";
  const bgColor = variant === "off-white" ? "bg-ground" : "bg-white";
  const borderColor = selected ? "border-primary" : "border-transparent";
  const dividerColor = "border-gray-200";
  const priceDividerColor = "bg-feature";
  const secondaryTextColor = "text-gray-600";

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
        "relative flex h-full w-full flex-col rounded-xl border-4 px-5 pb-5 pt-[22px] transition-all duration-300 @[250px]:px-6 @[250px]:pb-6 @[250px]:pt-[26px]",
        bgColor,
        borderColor,
        featured && "shadow-lg",
        (onSelect || navigateOnCardClick) && "cursor-pointer hover:shadow-xl",
        className,
      )}
      onClick={navigateOnCardClick || onSelect ? handleClick : undefined}
      style={{ boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.2)" }}
      data-component="LevelCard"
    >
      {/* Featured Badge - Top Left */}
      {featured && (
        <Label
          text="Más elegido"
          className="absolute left-1/2 z-10 -translate-x-1/2 -top-2 @[250px]:-top-3"
        />
      )}

      {/* Selected Checkmark - Top Right */}
      {selected && (
        <div className="absolute right-[-9.8px] -top-2 z-10 @[250px]:right-[-14px] @[250px]:-top-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <Check className="h-5 w-5 text-white" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Tripper / Randomtrip badge — text only, no avatar/isologo (dense card). */}
      {(tripperBadge || showRandomtripBadge) && (
        <p
          className={cn(
            "mb-2 text-center font-barlow-condensed text-[0.6rem] font-extrabold uppercase leading-tight @[250px]:mb-3 @[250px]:text-xs",
            secondaryTextColor,
          )}
        >
          {tripperBadge
            ? `${byTripperLabel} ${tripperBadge.name}`
            : byRandomtripLabel}
        </p>
      )}

      {/* Eyebrow Text */}
      <p
        className={cn(
          "mb-2.5 font-barlow font-bold uppercase tracking-[0.24em] text-[0.68rem] @[250px]:mb-3 @[250px]:tracking-[6px] text-center",
          secondaryTextColor,
        )}
      >
        {level.subtitle}
      </p>

      {/* Title and Price Row */}
      {/* <div className="mb-3 flex-wrap flex @[280px]:items-end gap-3 @[280px]:mb-4 @[280px]:gap-4 flex-col @[280px]:flex-row"> */}
      <div className="mb-3 flex-wrap flex items-end gap-3">
        <h3
          className={cn(
            "min-w-0 font-barlow-condensed font-extrabold uppercase text-left text-[1.95rem] @[250px]:text-[2.35rem]",
            "leading-none",
            textColor,
          )}
        >
          {level.name}
        </h3>
        <div className="flex gap-3 items-stretch">
          <div
            className={cn(" w-px shrink-0 self-stretch", priceDividerColor)}
          />
          <div className="flex flex-col justify-start items-start font-barlow font-semibold text-left text-[0.9rem] @[250px]:text-base">
            {level.priceLabel ? (
              <span className={cn("leading-none whitespace-nowrap", textColor)}>
                {level.priceLabel}
              </span>
            ) : null}
            <span className={cn("leading-none whitespace-nowrap", textColor)}>
              {level.priceLabel ? ` ${level.price} USD` : `${level.price} USD`}
            </span>
            <span
              className={cn(
                "whitespace-pre-line text-left leading-tight text-[0.62rem]",
                secondaryTextColor,
              )}
            >
              {level.priceFootnote}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p
        className={cn(
          "mb-3.5 text-left text-pretty leading-relaxed text-[0.82rem]",
          "text-gray-700",
        )}
      >
        {level.closingLine}
      </p>

      {/* Features */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {level.features.map((feature, index) => {
          const IconComponent = FEATURE_ICONS[feature.title] || Globe;
          const isLast = index === level.features.length - 1;

          return (
            <div key={feature.title}>
              <div className="flex items-start gap-3 py-[9px]">
                {/* Icon on the left, aligned to the label's cap-height */}
                <IconComponent
                  className={cn(
                    "mt-0.5 h-[18px] w-[18px] shrink-0",
                    secondaryTextColor,
                  )}
                />
                {/* Text content on the right */}
                <div className="flex flex-1 flex-col justify-start items-start">
                  <span
                    className={cn(
                      "mb-[3px] uppercase tracking-wider leading-none text-[0.6rem]",
                      secondaryTextColor,
                    )}
                  >
                    {feature.title}
                  </span>
                  <p
                    className={cn(
                      "font-medium leading-tight text-left text-[0.86rem] @[250px]:text-[0.9rem]",
                      textColor,
                    )}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>
              {!isLast && <div className={cn("border-t", dividerColor)} />}
            </div>
          );
        })}
      </div>

      <div className="mt-3">
        <Button
          asChild
          className={cn("w-full text-ink", ctaClassName)}
          variant="feature"
        >
          <Link
            className="uppercase"
            href={ctaHref}
            onClick={(e) => e.stopPropagation()}
            scroll={href !== undefined || !navigateOnCardClick}
          >
            {level.ctaLabel}
          </Link>
        </Button>
      </div>
    </div>
  );
}
