import type { Metadata } from "next";
import React from "react";
import { TripperBlogTeaser } from "@/components/tripper/TripperBlogTeaser";
import TopTrippersGrid from "@/components/tripper/TopTrippersGrid";
import HeaderHero from "@/components/journey/HeaderHero";
import { getAllTrippers, getBlogTeaserPosts } from "@/lib/db/tripper-queries";
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
  const [trippers, blogTeaserPosts] = await Promise.all([
    getAllTrippers(),
    getBlogTeaserPosts(3),
  ]);

  return (
    <main className="min-h-screen bg-white">
      <HeaderHero
        className="min-h-[50vh]!"
        description={hero.description}
        fallbackImage="/images/trippers-hero.png"
        subtitle={hero.subtitle}
        title={hero.title}
        videoSrc="/videos/trippers-hero.mp4"
      />

      <TopTrippersGrid trippers={trippers} />

      <TripperBlogTeaser
        copy={dict.trippers.blogTeaser}
        locale={locale}
        posts={blogTeaserPosts}
      />
    </main>
  );
}
