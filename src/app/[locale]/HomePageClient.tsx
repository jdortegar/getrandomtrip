"use client";

import React from "react";
import HomeInfo from "@/components/HomeInfo";
import Hero from "@/components/Hero";
import Blog from "@/components/Blog";
import { ExplorationSection } from "@/components/landing/exploration";
import Testimonials from "@/components/Testimonials/Testimonials";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import { XsedHero } from "@/components/app/xsed/XsedHero";
import type { TripperListItem } from "@/types/tripper";
import type { TestimonialData } from "@/components/Testimonials/types";
import type { BlogPost } from "@/lib/data/shared/blog-types";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Locale } from "@/lib/i18n/config";

interface HomePageClientProps {
  trippers: TripperListItem[];
  testimonials?: TestimonialData[];
  blogPosts: BlogPost[];
}

export function HomePageClient({
  trippers,
  testimonials,
  blogPosts,
}: HomePageClientProps) {
  const home = useDictionary((d) => d.home);
  const locale = useLocale();

  return (
    <main style={{ scrollBehavior: "smooth" }}>
      <Hero content={home.hero} scrollIndicator />
      <HomeInfo content={home.homeInfo} />
      <ExplorationSection content={home.exploration} trippers={trippers} />
      <Blog
        eyebrow={home.blog.eyebrow}
        subtitle={home.blog.subtitle}
        title={home.blog.title}
        posts={blogPosts.map((p) => ({ ...p, href: pathForLocale(locale as Locale, p.href) }))}
        viewAll={home.blog.viewAll}
      />
      <XsedHero content={home.xsedHero} />
      <Testimonials
        eyebrow={home.testimonials.eyebrow}
        subtitle={home.testimonials.subtitle}
        title={home.testimonials.title}
        viewFullReviewLabel={home.testimonials.viewFullReviewLabel}
        testimonials={testimonials ?? []}
      />
    </main>
  );
}
