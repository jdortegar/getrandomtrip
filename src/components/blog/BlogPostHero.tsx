'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Heart, Share2 } from 'lucide-react';
import CountryFlag from '@/components/common/CountryFlag';
import { Button } from '@/components/ui/Button';

const BLOG_EYEBROW_COLOR = '#F2C53D';

/** Derive country for flag from location string (e.g. "México City, México" → "México"). */
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

interface BlogPostHeroProps {
  className?: string;
  coverUrl: string | null;
  subtitle: string;
  title: string;
  author: {
    avatarUrl: string;
    name: string;
    slug: string;
    location?: string;
  };
}

export default function BlogPostHero({
  author,
  className,
  coverUrl,
  subtitle,
  title,
}: BlogPostHeroProps) {
  const byline = subtitle.trim()
    ? `${subtitle} By ${author.name}.`
    : `By ${author.name}.`;
  const tripperLocation = author.location?.trim() ?? null;
  const countryForFlag = getCountryFromLocation(tripperLocation);

  return (
    <section
      className={cn(
        'relative flex min-h-[80vh] flex-col justify-center overflow-hidden',
        className,
      )}
    >
      <div className="absolute inset-0">
        <Image
          alt=""
          className="object-cover object-center"
          fill
          priority
          sizes="100vw"
          src={coverUrl!}
        />
      </div>

      <div className="absolute inset-0 bg-black/50" />

      {/* Content – left-aligned, bottom-weighted */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-12 pt-16 text-left text-white md:px-10">
        <p
          className="mb-2 font-bold text-sm uppercase tracking-[0.4em] md:text-base"
          style={{ color: BLOG_EYEBROW_COLOR }}
        >
          BLOG
        </p>
        <h1 className="mb-4 font-barlow-condensed text-5xl font-extrabold uppercase leading-none md:text-7xl">
          {title}
        </h1>
        <p className="mb-8 max-w-2xl font-barlow text-base leading-relaxed text-white/95 md:text-lg">
          {byline}
        </p>

        {/* Author row: avatar, name, location (flag style from tripper), actions, FOLLOW */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-8 ">
          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full md:h-23 md:w-23">
            {author.avatarUrl ? (
              <Image
                alt={author.name}
                className="object-cover"
                fill
                sizes="64px"
                src={author.avatarUrl}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-barlow-condensed text-xl font-bold">
                {author.name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <p className="font-barlow-condensed text-xl font-bold uppercase tracking-wide text-white md:text-2xl">
                {author.name}
              </p>
              <div className="flex items-center gap-3">
                <button
                  aria-label="Compartir"
                  className="rounded-full p-2 text-white transition-colors hover:bg-white/20"
                  type="button"
                >
                  <Share2 className="h-5 w-5" />
                </button>
                <button
                  aria-label="Guardar"
                  className="rounded-full p-2 text-white transition-colors hover:bg-white/20"
                  type="button"
                >
                  <Heart className="h-5 w-5" />
                </button>
              </div>
            </div>

            {tripperLocation && (
              <div className="mt-0.5 flex items-center gap-2 font-barlow-condensed text-sm font-semibold leading-none uppercase tracking-[0.4em] text-[#F2C53D]">
                {countryForFlag && (
                  <CountryFlag
                    className="inline-block shrink-0 align-baseline"
                    country={countryForFlag}
                    title={tripperLocation}
                  />
                )}
                <span>{tripperLocation.toUpperCase()}</span>
              </div>
            )}
          </div>
        </div>
        <Button asChild size="lg" variant="feature" className="w-fit">
          <Link href={`/trippers/${author.slug}`}>
            RANDOMTRIP-ME con {author.name}!
          </Link>
        </Button>
      </div>
    </section>
  );
}
