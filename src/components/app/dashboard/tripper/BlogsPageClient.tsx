"use client";

import { useParams } from "next/navigation";
import { BlogPostsList } from "@/components/app/dashboard/tripper/BlogPostsList";
import HeaderHero from "@/components/journey/HeaderHero";
import Section from "@/components/layout/Section";
import type { BlogPost } from "@/types/blog";
import enCopy from "@/dictionaries/en.json";
import esCopy from "@/dictionaries/es.json";

interface BlogsPageClientProps {
  posts: BlogPost[];
}

function getBlogsCopy(locale: string) {
  return locale.startsWith("en") ? enCopy.tripperBlogs : esCopy.tripperBlogs;
}

export function BlogsPageClient({ posts }: BlogsPageClientProps) {
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const copy = getBlogsCopy(locale);
  const dateLocale = locale.startsWith("en") ? "en-US" : "es-ES";

  return (
    <>
      <HeaderHero
        description={copy.header.description}
        fallbackImage="/images/bg-playa-mexico.jpg"
        title={copy.header.title}
        videoSrc="/videos/hero-video-1.mp4"
      />
      <Section>
        <div className="rt-container">
          <BlogPostsList copy={copy} dateLocale={dateLocale} posts={posts} />
        </div>
      </Section>
    </>
  );
}
