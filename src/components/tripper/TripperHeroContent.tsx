import CountryFlag from "@/components/common/CountryFlag";
import SafeImage from "@/components/common/SafeImage";
import { Button } from "@/components/ui/Button";
import { TRIPPER_TRAVELER_TYPES_ANCHOR_ID } from "@/components/tripper/TripperTravelerTypesSection";
import { cn } from "@/lib/utils";
import Link from "next/link";

export interface TripperHeroContentProps {
  avatarAlt: string;
  avatarSrc?: string;
  className?: string;
  countryForFlag: string | null;
  location: string | null;
  name: string | null;
  tagline: string | null;
  /**
   * "overlay": absolute-positioned, white text over the hero band's gradient
   * (md+, where the 16:9 band is tall enough to fit it — unchanged from the
   * pre-16:9 layout).
   * "stacked": flows below the hero band on its own dark background (<md,
   * where 16:9 is too short at ~202px/360px to host the overlay content).
   */
  variant: "overlay" | "stacked";
}

/**
 * Tripper hero's avatar + name + tagline + CTA content block. Rendered
 * twice by `TripperHero.tsx` (once per variant, gated by breakpoint) so
 * there is exactly one source of truth for this markup — no JSX
 * duplication between the desktop overlay and the mobile stacked layout.
 */
export default function TripperHeroContent({
  avatarAlt,
  avatarSrc,
  className,
  countryForFlag,
  location,
  name,
  tagline,
  variant,
}: TripperHeroContentProps) {
  const avatarSizeClass =
    variant === "overlay"
      ? "h-32 w-32 shrink-0 overflow-hidden rounded-full bg-slate-800 ring-4 ring-white shadow-2xl sm:h-40 sm:w-40 md:h-52 md:w-52"
      : "-mt-12 h-24 w-24 shrink-0 overflow-hidden rounded-full bg-slate-800 ring-4 ring-white shadow-2xl";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4",
        variant === "overlay"
          ? "rt-container sm:gap-8 md:flex-row md:items-end md:justify-left lg:gap-12"
          : "bg-slate-950 px-4 pb-10 text-center",
        className,
      )}
    >
      <div className={cn("relative", avatarSizeClass)}>
        <SafeImage
          alt={avatarAlt}
          className="object-cover"
          fill
          priority
          sizes="(max-width: 640px) 128px, (max-width: 768px) 160px, 208px"
          src={avatarSrc}
        />
      </div>

      <div
        className={cn(
          "flex flex-col items-center text-center",
          variant === "overlay" && "md:items-start md:text-left",
        )}
      >
        {location && (
          <div className="mb-2 flex items-center gap-2 font-barlow-condensed text-sm font-semibold uppercase leading-none tracking-wide text-amber-400 md:text-base">
            {countryForFlag && (
              <CountryFlag
                className="inline-block shrink-0 align-baseline"
                country={countryForFlag}
                title={location}
              />
            )}
            <span>{location}</span>
          </div>
        )}

        <h1
          className={cn(
            "mb-4 font-barlow-condensed font-extrabold uppercase leading-none text-white",
            variant === "overlay"
              ? "text-4xl sm:text-5xl md:text-7xl"
              : "text-3xl",
          )}
        >
          {name}
        </h1>

        {tagline && (
          <p className="mb-4 max-w-xl font-barlow text-sm font-normal leading-relaxed text-white sm:text-base">
            {tagline}
          </p>
        )}

        <Button asChild className="mt-2" size="lg" variant="feature">
          <Link href={`#${TRIPPER_TRAVELER_TYPES_ANCHOR_ID}`} scroll>
            RANDOMTRIP-ME!
          </Link>
        </Button>
      </div>
    </div>
  );
}
