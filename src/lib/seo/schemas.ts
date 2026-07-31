const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://getrandomtrip.com";

export function buildOrganizationSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      url: `${BASE_URL}/contact`,
    },
    logo: `${BASE_URL}/favicon.png`,
    name: "Randomtrip",
    url: BASE_URL,
  };
}

export function buildWebSiteSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Randomtrip",
    url: BASE_URL,
  };
}

interface PersonSchemaInput {
  avatarUrl?: string | null;
  bio?: string | null;
  heroImage?: string | null;
  name: string;
  slug: string;
}

export function buildPersonSchema(
  tripper: PersonSchemaInput,
): Record<string, unknown> {
  const image = tripper.heroImage ?? tripper.avatarUrl ?? undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    ...(tripper.bio ? { description: tripper.bio } : {}),
    ...(image ? { image } : {}),
    name: tripper.name,
    url: `${BASE_URL}/trippers/${tripper.slug}`,
    worksFor: {
      "@type": "Organization",
      name: "Randomtrip",
      url: BASE_URL,
    },
  };
}

interface BlogPostingSchemaInput {
  authorName: string;
  createdAt: string | Date;
  description?: string | null;
  heroImage?: string | null;
  publishedAt?: string | Date | null;
  slug: string;
  title: string;
}

export function buildBlogPostingSchema(
  post: BlogPostingSchemaInput,
): Record<string, unknown> {
  const datePublished = post.publishedAt ?? post.createdAt;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    author: {
      "@type": "Person",
      name: post.authorName,
    },
    datePublished:
      datePublished instanceof Date
        ? datePublished.toISOString()
        : datePublished,
    ...(post.description ? { description: post.description } : {}),
    headline: post.title,
    ...(post.heroImage ? { image: post.heroImage } : {}),
    mainEntityOfPage: {
      "@id": `${BASE_URL}/blog/${post.slug}`,
      "@type": "WebPage",
    },
    url: `${BASE_URL}/blog/${post.slug}`,
  };
}

interface FAQItem {
  answer: string;
  question: string;
}

export function buildFAQPageSchema(
  items: FAQItem[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
      name: item.question,
    })),
  };
}
