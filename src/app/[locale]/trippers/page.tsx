import type { Metadata } from "next";
import React from "react";
import TopTrippersGrid from "@/components/tripper/TopTrippersGrid";
import HeaderHero from "@/components/journey/HeaderHero";
import { getAllTrippers } from "@/lib/db/tripper-queries";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/og";

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);
  const { title, description } = dict.trippers.meta;
  return {
    description,
    openGraph: { description, images: [DEFAULT_OG_IMAGE], title },
    title,
  };
}

export default async function TrippersPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);
  const hero = dict.trippers.hero;
  const trippers = await getAllTrippers();

  return (
    <main className="min-h-screen bg-white">
      <HeaderHero
        className="min-h-[50vh]!"
        description={hero.description}
        fallbackImage="/images/hero-image-1.jpeg"
        subtitle={hero.subtitle}
        title={hero.title}
        videoSrc="/videos/hero-video-1.mp4"
      />

      <TopTrippersGrid trippers={trippers} />
    </main>
  );
}
