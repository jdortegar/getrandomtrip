'use client';

import type { Tripper } from '@/content/trippers';
import type { TripperProfile } from '@/types/tripper';
import CountryFlag from '@/components/common/CountryFlag';
import SafeImage from '@/components/common/SafeImage';
import { Button } from '@/components/ui/Button';
import { useMemo } from 'react';
import { TRIPPER_TRAVELER_TYPES_ANCHOR_ID } from '@/components/tripper/TripperTravelerTypesSection';

interface TripperHeroProps {
  t: Tripper;
  dbTripper?: TripperProfile | null;
}

function truncateTagline(bio: string | null | undefined, maxLength: number) {
  if (!bio) return null;
  if (bio.length <= maxLength) return bio;
  return `${bio.slice(0, maxLength).trim()} ......`;
}

/** Derive country name/code from location string (e.g. "MÉXICO CITY, MÉXICO" → "MÉXICO") for flag. */
function getCountryFromLocation(
  location: string | null | undefined,
): string | null {
  if (!location?.trim()) return null;
  const parts = location
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1]! : location;
}

export default function TripperHero({ t, dbTripper }: TripperHeroProps) {
  const firstName = useMemo(
    () => t.name?.split(' ')[0] ?? t.name ?? '',
    [t.name],
  );

  const tripperName = dbTripper?.name || t.name;
  const tripperAvatar = dbTripper?.avatarUrl || t.avatar;
  const tripperHeroImage =
    dbTripper?.heroImage || t.heroImage || dbTripper?.avatarUrl;
  const tripperBio = dbTripper?.bio || t.bio;
  const tripperLocation = dbTripper?.location || t.location;

  const tagline = useMemo(() => truncateTagline(tripperBio, 50), [tripperBio]);
  const countryForFlag = useMemo(
    () => getCountryFromLocation(tripperLocation),
    [tripperLocation],
  );

  const bannerAlt = useMemo(
    () => [tripperName, tripperBio].filter(Boolean).join('. ') || 'Tripper banner',
    [tripperName, tripperBio],
  );
  const bannerSrc = tripperHeroImage || tripperAvatar || undefined;
  const avatarSrc = tripperAvatar || tripperHeroImage || undefined;

  return (
    <section
      className="relative bg-slate-950 pb-20 text-white"
      id="tripper-hero"
    >
      <div
        id="hero-sentinel"
        aria-hidden
        className="absolute left-0 top-0 h-px w-px"
      />

      {/* Full-bleed hero with background image (70vh cap) */}
      <div className="relative h-[70vh] w-full overflow-hidden">
        <SafeImage
          alt={bannerAlt}
          className="object-cover"
          fill
          priority
          sizes="100vw"
          src={bannerSrc}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 to-slate-950/80" />

        {/* Centered content block: avatar left, text right */}
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="rt-container flex flex-col items-center gap-8 md:flex-row md:items-end md:justify-center lg:gap-12">
            {/* Circular profile image with white border */}
            <div className="relative h-40 w-40 flex-shrink-0 overflow-hidden rounded-full bg-slate-800 ring-4 ring-white shadow-2xl md:h-52 md:w-52">
              <SafeImage
                alt={`Retrato de ${tripperName || 'tripper'}`}
                className="object-cover"
                fill
                priority
                sizes="(max-width: 768px) 160px, 208px"
                src={avatarSrc}
              />
            </div>

            {/* Location, name, tagline, CTA — Hero.tsx text styles */}
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              {tripperLocation && (
                <div className="flex items-center gap-2 font-barlow-condensed text-sm font-semibold uppercase tracking-wide text-amber-400 md:text-base leading-none">
                  {countryForFlag && (
                    <CountryFlag
                      className="inline-block shrink-0 align-baseline"
                      country={countryForFlag}
                      title={tripperLocation}
                    />
                  )}
                  <span>{tripperLocation}</span>
                </div>
              )}

              <h1 className="mb-4 font-barlow-condensed font-extrabold leading-none text-7xl uppercase text-white sm:text-5xl md:text-7xl">
                {tripperName}
              </h1>
              {tripperBio && (
                <p className="mb-4 max-w-xl font-barlow text-base font-normal leading-relaxed text-white">
                  {tripperBio}
                </p>
              )}
              <Button asChild className="mt-2" size="lg" variant="white">
                <a
                  aria-label={`Planear un Randomtrip con ${firstName}`}
                  href={`#${TRIPPER_TRAVELER_TYPES_ANCHOR_ID}`}
                >
                  RANDOMTRIP-ME!
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
