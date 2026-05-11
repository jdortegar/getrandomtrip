'use client';

import Image from 'next/image';
import Link from 'next/link';
import Section from '@/components/layout/Section';
import { cn } from '@/lib/utils';

interface TripperMottoBannerProps {
  authorName: string;
  authorSlug: string;
  avatarUrl: string;
  backgroundImageUrl: string;
  className?: string;
  motto: string;
  specialization?: string | null;
}

export default function TripperMottoBanner({
  authorName,
  authorSlug,
  avatarUrl,
  backgroundImageUrl,
  className,
  motto,
  specialization,
}: TripperMottoBannerProps) {
  const attribution = specialization?.trim()
    ? `${authorName.toUpperCase()}, ${specialization.toUpperCase()}`
    : authorName.toUpperCase();

  return (
    <Section fullWidth backgroundImage={backgroundImageUrl} className={cn(className)}>
      <div className="relative z-10 flex max-w-3xl flex-col items-center gap-6 mx-auto">
        <blockquote className="font-barlow-condensed text-2xl font-bold uppercase leading-snug text-white md:text-3xl lg:text-4xl">
          &ldquo;{motto}&rdquo;
        </blockquote>
        <footer className="flex flex-col items-center gap-4">
          <cite className="not-italic">
            <Link
              className="font-barlow-condensed text-sm font-semibold uppercase tracking-wide text-white hover:underline md:text-base"
              href={`/trippers/${authorSlug}`}
            >
              {attribution}
            </Link>
          </cite>
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-white">
            {avatarUrl ? (
              <Image
                alt={authorName}
                className="object-cover"
                fill
                sizes="80px"
                src={avatarUrl}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-neutral-700 font-barlow-condensed text-2xl font-bold text-white">
                {authorName.charAt(0)}
              </div>
            )}
          </div>
        </footer>
      </div>
    </Section>
  );
}
