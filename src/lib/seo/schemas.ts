import { hasLocale, type Locale } from "@/lib/i18n/config";
import en from "@/dictionaries/en.json";
import {
  getPublicTravelerTypeSlugs,
  getTravelerType,
  type TravelerTypeSlug,
} from "@/lib/data/traveler-types";
import { BRAND, BRAND_OPERATOR_LINE } from "@/lib/seo/brand";
import { canonicalUrl, SITE_URL as BASE_URL } from "@/lib/seo/urls";

const ORGANIZATION_ID = `${BASE_URL}/#organization`;

export function buildOrganizationSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@id": ORGANIZATION_ID,
    "@type": "Organization",
    address: { "@type": "PostalAddress", ...BRAND.address },
    alternateName: [...BRAND.alternateNames],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      url: `${BASE_URL}/contact`,
    },
    description: en.home.meta.description,
    disambiguatingDescription: `Surprise-trip platform. ${BRAND_OPERATOR_LINE}`,
    legalName: BRAND.legalName,
    logo: `${BASE_URL}/favicon.png`,
    name: BRAND.name,
    sameAs: [...BRAND.sameAs],
    url: BASE_URL,
  };
}

export function buildWebSiteSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@id": `${BASE_URL}/#website`,
    "@type": "WebSite",
    alternateName: [...BRAND.alternateNames],
    name: BRAND.name,
    publisher: { "@id": ORGANIZATION_ID },
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
  locale: Locale = "es",
): Record<string, unknown> {
  const image = tripper.heroImage ?? tripper.avatarUrl ?? undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    ...(tripper.bio ? { description: tripper.bio } : {}),
    ...(image ? { image } : {}),
    name: tripper.name,
    url: canonicalUrl(locale, `/trippers/${tripper.slug}`),
    worksFor: {
      "@type": "Organization",
      name: "Randomtrip",
      url: BASE_URL,
    },
  };
}

interface BlogPostingSchemaInput {
  locale?: string;
  authorName: string;
  createdAt: string | Date;
  description?: string | null;
  heroImage?: string | null;
  publishedAt?: string | Date | null;
  slug: string;
  title: string;
  updatedAt?: string | Date;
}

export function buildBlogPostingSchema(
  post: BlogPostingSchemaInput,
): Record<string, unknown> {
  const datePublished = post.publishedAt ?? post.createdAt;
  const url = canonicalUrl(
    hasLocale(post.locale) ? post.locale : "es",
    `/blog/${post.slug}`,
  );
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    author: {
      "@type": "Person",
      name: post.authorName,
    },
    ...(post.updatedAt
      ? {
          dateModified:
            post.updatedAt instanceof Date
              ? post.updatedAt.toISOString()
              : post.updatedAt,
        }
      : {}),
    datePublished:
      datePublished instanceof Date
        ? datePublished.toISOString()
        : datePublished,
    ...(post.description ? { description: post.description } : {}),
    headline: post.title,
    ...(post.heroImage ? { image: post.heroImage } : {}),
    mainEntityOfPage: {
      "@id": url,
      "@type": "WebPage",
    },
    url,
    ...(post.locale ? { inLanguage: post.locale } : {}),
  };
}

interface FAQItem {
  answer: string;
  question: string;
}

export function buildFAQPageSchema(items: FAQItem[]): Record<string, unknown> {
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

const SERVICE_TYPE: Record<Locale, string> = {
  en: "Surprise trip",
  es: "Viaje sorpresa",
};

/**
 * schema.org Service for a live traveler-type product page. Preview types
 * are not marketed in production and unknown slugs return null. No prices:
 * product copy describes behaviour, not cost.
 */
export function buildTravelerTypeServiceSchema(
  slugOrAlias: string,
  locale: Locale,
): Record<string, unknown> | null {
  const data = getTravelerType(slugOrAlias, locale);
  if (!data) return null;
  const slug = data.meta.slug as TravelerTypeSlug;
  if (!getPublicTravelerTypeSlugs().includes(slug)) return null;
  const url = canonicalUrl(locale, `/experiences/by-type/${slug}`);
  return {
    "@context": "https://schema.org",
    "@id": `${url}#service`,
    "@type": "Service",
    audience: { "@type": "Audience", audienceType: data.meta.label },
    description: data.content.hero.subtitle,
    inLanguage: locale,
    name: data.content.hero.title,
    provider: { "@id": ORGANIZATION_ID },
    serviceType: SERVICE_TYPE[locale],
    url,
  };
}
