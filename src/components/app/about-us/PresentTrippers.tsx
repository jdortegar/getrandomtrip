"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import EmblaCarousel from "@/components/EmblaCarousel/EmblaCarousel";
import { TripperCarouselCard } from "@/components/app/about-us/TripperCarouselCard";

interface TripperSlide {
  id: string;
  avatarUrl: string | null;
  bio: string | null;
  name: string;
  specialty: string | null;
  tripperSlug: string;
}

interface PresentTrippersContent {
  ctaHref: string;
  ctaLabel: string;
  eyebrow: string;
  subtitle: string;
  title: string;
}

interface PresentTrippersProps {
  content: PresentTrippersContent;
  trippers: TripperSlide[];
}

export function PresentTrippers({ content, trippers }: PresentTrippersProps) {
  if (trippers.length === 0) return null;

  return (
    <section className="bg-white py-24 md:py-32">
      <div className="rt-container mb-12 text-center">
        <p className="font-barlow text-base font-bold uppercase tracking-[6px] text-light-blue">
          {content.eyebrow}
        </p>
        <h2 className="mt-4 font-barlow-condensed text-[50px] font-bold uppercase leading-none text-gray-900 md:text-[70px]">
          {content.title}
        </h2>
        <p className="mt-4 font-barlow text-sm text-neutral-500">
          {content.subtitle}
        </p>
      </div>

      <EmblaCarousel overflow="both" slidesPerView={3}>
        {trippers.map((t) => (
          <TripperCarouselCard
            key={t.id}
            avatarUrl={t.avatarUrl}
            bio={t.bio}
            name={t.name}
            specialty={t.specialty}
            tripperSlug={t.tripperSlug}
          />
        ))}
      </EmblaCarousel>

      <div className="rt-container mt-12 flex justify-center">
        <Button asChild size="lg" variant="feature">
          <Link href={content.ctaHref}>{content.ctaLabel}</Link>
        </Button>
      </div>
    </section>
  );
}
