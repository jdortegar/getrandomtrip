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
  selected?: boolean;
  title?: string;
  width?: number;
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
  selected = false,
  title: titleProp,
  width = 100,
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
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#172C36]">
            <Check className="h-5 w-5 text-white" strokeWidth={3} />
          </div>
        </div>
      )}

      <div
        className={cn(
          "relative rounded-2xl overflow-hidden transition-all duration-300",
          fill && "h-full w-full",
          selected && "ring-4 ring-[#172C36]",
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

        <div className="absolute bottom-0 left-0 z-20 w-full p-5 @[200px]:pb-20 text-left text-white">
          <h3 className="font-barlow-condensed text-2xl @[200px]:text-5xl font-extrabold uppercase leading-tight">
            {title}
          </h3>
          <p className="font-barlow text-base @[200px]:text-lg text-white/90">
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
