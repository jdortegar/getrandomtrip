"use client";

import type { TripperProfile } from "@/types/tripper";
import SafeImage from "@/components/common/SafeImage";
import TripperHeroContent from "@/components/tripper/TripperHeroContent";
import { useMemo } from "react";

interface TripperHeroProps {
  tripper: TripperProfile;
}

/** Derive country name/code from location string (e.g. "MÉXICO CITY, MÉXICO" → "MÉXICO") for flag. */
function getCountryFromLocation(
  location: string | null | undefined,
): string | null {
  if (!location?.trim()) return null;
  const parts = location
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1]! : location;
}

export default function TripperHero({ tripper }: TripperHeroProps) {
  const tripperName = tripper.name;
  const tripperAvatar = tripper.avatarUrl || null;
  const tripperHeroImage = tripper.heroImage || tripper.avatarUrl || null;
  const tripperBio = tripper.bio;
  const tripperLocation = tripper.location;

  const countryForFlag = getCountryFromLocation(tripperLocation);

  const bannerAlt = useMemo(
    () =>
      [tripperName, tripperBio].filter(Boolean).join(". ") || "Tripper banner",
    [tripperName, tripperBio],
  );
  const bannerSrc = tripperHeroImage ?? tripperAvatar ?? undefined;
  const avatarSrc = tripperAvatar ?? tripperHeroImage ?? undefined;
  const avatarAlt = `Retrato de ${tripperName || "tripper"}`;

  return (
    <section
      className="relative bg-primary-950 pt-16 text-white md:pt-0"
      id="tripper-hero"
    >
      <div
        id="hero-sentinel"
        aria-hidden
        className="absolute left-0 top-0 h-px w-px"
      />

      {/* Fixed 16:9 band on every breakpoint — what a tripper frames in the
          settings editor is pixel-for-pixel what renders here. The server
          bakes the final crop; no client-side objectPosition math. */}
      <div className="relative mx-auto aspect-[16/9] w-full max-w-[1920px] overflow-hidden">
        <SafeImage
          alt={bannerAlt}
          className="object-cover"
          fill
          priority
          sizes="100vw"
          src={bannerSrc}
        />
        <div className="absolute inset-0 bg-linear-to-b from-primary-950/50 to-primary-950/80" />

        {/* md+: 16:9 at 1280px is 720px tall — taller than the old 70vh
            floor, so the overlay content still fits unchanged. */}
        <div className="relative z-10 hidden h-full items-center justify-center px-4 md:flex">
          <TripperHeroContent
            avatarAlt={avatarAlt}
            avatarSrc={avatarSrc}
            countryForFlag={countryForFlag}
            location={tripperLocation}
            name={tripperName}
            tagline={tripperBio}
            variant="overlay"
          />
        </div>
      </div>

      {/* < md: 16:9 is only ~202px tall at 360px — too short to host the
          overlay without hiding a third of the framed crop under the
          navbar. Content flows below the band instead. */}
      <TripperHeroContent
        avatarAlt={avatarAlt}
        avatarSrc={avatarSrc}
        className="md:hidden"
        countryForFlag={countryForFlag}
        location={tripperLocation}
        name={tripperName}
        tagline={tripperBio}
        variant="stacked"
      />
    </section>
  );
}
