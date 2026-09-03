"use client";

import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import React from "react";

import { ReviewBadge } from "@/components/ReviewBadge";
import type { TravelerTypeLegacy } from "@/lib/utils/experiencesData";
import { cn } from "@/lib/utils";

interface TravelerTypeCardProps {
  className?: string;
  /** When set, renders a "coming soon" overlay with this label and blocks interaction. */
  comingSoonLabel?: string;
  /** When set, provides title, description, imageUrl, and disabled. */
  item?: TravelerTypeLegacy;
  description?: string;
  disabled?: boolean;
  /** When true, card fills its container (no fixed width/height). */
  fill?: boolean;
  height?: number;
  href?: string;
  imageUrl?: string;
  onClick?: () => void;
  /** Localized "BY TRIPPER" label shown above the tripper's name in `tripperBadge`. Required whenever `tripperBadge` is set. */
  byTripperLabel?: string;
  selected?: boolean;
  title?: string;
  /** When defined (curated journey), renders tripper attribution mid-card. */
  tripperBadge?: { name: string; avatarUrl: string | null };
  /** When set (and `tripperBadge` is not), renders the RandomTrip isologo + this label ("BY RANDOMTRIP") instead — this type/level isn't offered by the attributed tripper, but is still bookable through RandomTrip's own catalog. */
  randomtripBadgeLabel?: string;
  width?: number;
  /** When true, the card content is wrapped to the top of the card. */
  wrapped?: boolean;
}

const TravelerTypeCard: React.FC<TravelerTypeCardProps> = ({
  className,
  comingSoonLabel,
  description: descriptionProp,
  disabled: disabledProp,
  fill = false,
  height = 150,
  href,
  imageUrl: imageUrlProp,
  item,
  onClick,
  byTripperLabel,
  selected = false,
  title: titleProp,
  tripperBadge,
  randomtripBadgeLabel,
  width = 100,
  wrapped = false,
}) => {
  const title = item?.title ?? titleProp ?? "";
  const description = item?.description ?? descriptionProp ?? "";
  const imageUrl = item?.imageUrl ?? imageUrlProp ?? "";
  const disabled = item !== undefined ? !item.enabled : (disabledProp ?? false);

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled || comingSoonLabel) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      e.preventDefault();
      onClick();
    } else if (href === "#") {
      e.preventDefault();
    }
  };

  const isButton = Boolean(onClick || !href);
  const T: React.ElementType = isButton ? "button" : Link;

  return (
    <T
      className={cn(
        "@container block group origin-center relative py-3",
        fill && "w-full",
        className,
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      )}
      onClick={handleClick}
      style={fill ? undefined : { height, width }}
      {...(isButton ? { disabled, type: "button" as const } : { href })}
    >
      {selected && (
        <div className="absolute right-[-14px] top-0 z-30">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <Check className="h-5 w-5 text-white" strokeWidth={3} />
          </div>
        </div>
      )}

      <div
        className={cn(
          "relative rounded-2xl overflow-hidden transition-all duration-300",
          fill && "h-full w-full",
          selected && "ring-4 ring-primary",
        )}
      >
        <Image
          alt={title}
          className="transition-transform duration-300 group-hover:scale-110"
          fill
          priority
          src={imageUrl}
          style={{ objectFit: "cover" }}
        />
        <div className="absolute inset-0 z-10 rounded-2xl bg-linear-to-t from-black/75 to-transparent" />

        <ReviewBadge rating="4.6" />

        <div className="absolute inset-x-0 bottom-0 z-20 w-full p-5 text-left text-white">
          {tripperBadge ? (
            <div className="flex items-center gap-2 mb-1.5 @[200px]:gap-3 @[200px]:mb-3">
              <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-2 ring-white/40 @[200px]:h-10 @[200px]:w-10">
                {tripperBadge.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={tripperBadge.name}
                    className="h-full w-full object-cover"
                    src={tripperBadge.avatarUrl}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-neutral-500 font-barlow-condensed text-xs font-bold text-white @[200px]:text-lg">
                    {tripperBadge.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex justify-start flex-col text-left">
                <p className="font-barlow-condensed text-[0.6rem] font-extrabold uppercase leading-tight text-white @[200px]:text-sm">
                  {byTripperLabel}
                </p>
                <p className="font-barlow-condensed text-[0.6rem] font-extrabold uppercase leading-tight text-white @[200px]:text-sm">
                  {tripperBadge.name.toUpperCase()}
                </p>
              </div>
            </div>
          ) : (
            randomtripBadgeLabel && (
              <div className="flex items-center gap-2 mb-1.5 @[200px]:gap-3 @[200px]:mb-3">
                <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white/10 ring-2 ring-white/40 @[200px]:h-10 @[200px]:w-10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Randomtrip"
                    className="h-full w-full object-cover"
                    src="/assets/icons/isologo.png"
                  />
                </div>
                <p className="font-barlow-condensed text-[0.6rem] font-extrabold uppercase leading-tight text-white @[200px]:text-sm">
                  {randomtripBadgeLabel}
                </p>
              </div>
            )
          )}
          <h3 className="font-barlow-condensed text-xl lg:text-2xl @[250px]:text-xl @[400px]:text-5xl font-extrabold uppercase leading-tight">
            {title}
          </h3>
          <p className="font-barlow text-sm @[250px]:text-base @[400px]:text-lg text-white/90">
            {description}
          </p>
        </div>

        {comingSoonLabel && (
          <div className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl bg-black/70 cursor-not-allowed">
            <span className="font-barlow-condensed text-base @[200px]:text-2xl font-extrabold uppercase tracking-widest text-white drop-shadow-lg">
              {comingSoonLabel}
            </span>
          </div>
        )}
      </div>
    </T>
  );
};

export default TravelerTypeCard;
