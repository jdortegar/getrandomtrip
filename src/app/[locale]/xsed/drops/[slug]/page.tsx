import { notFound } from "next/navigation";
import Testimonials from "@/components/Testimonials/Testimonials";
import { XsedInternalHero } from "@/components/app/xsed/XsedInternalHero";
import { XsedDropBody } from "@/components/app/xsed/XsedDropBody";
import LightboxCarousel from "@/components/media/LightboxCarousel";
import Breadcrumb from "@/components/navigation/Breadcrumb";
import Section from "@/components/layout/Section";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  findActiveXsedExperienceBySlug,
  parseDropSections,
} from "@/lib/data/xsed";
import { getXsedDropTestimonials } from "@/lib/xsed/get-xsed-drop-testimonials";

type Props = {
  params: Promise<{ locale?: string; slug?: string }>;
};

export default async function XsedInternalPage({ params }: Props) {
  const { slug, locale: rawLocale } = await params;

  if (!slug) notFound();

  const drop = await findActiveXsedExperienceBySlug(slug);

  if (!drop || drop.status !== "ACTIVE") notFound();

  const normalizedLocale = hasLocale(rawLocale) ? rawLocale : "es";
  const [dropTestimonials, dict] = await Promise.all([
    getXsedDropTestimonials(drop.id),
    getDictionary(normalizedLocale),
  ]);
  // titleInternal is the primary source going forward — the admin XSED
  // authoring form no longer has a `teaser` field. teaser is kept as a
  // fallback only for drops authored before this migration.
  const title = drop.titleInternal || drop.teaser || "";
  const heroImage = drop.heroImage ?? "/images/drops/drops-mendoza.jpg";

  const dropNumber = Number(drop.slug);

  const dateLocale = normalizedLocale === "en" ? "en-US" : "es-AR";
  const date = drop.tripDate
    ? drop.tripDate
        .toLocaleDateString(dateLocale, {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
        .toUpperCase()
    : "";

  const sections = parseDropSections(drop.sections);

  const article = sections.map((section, index) => ({
    id: `section-${index}`,
    title: section.title,
    content: section.body,
    images: section.photos.map((p) => ({ url: p.url, caption: p.credit })),
  }));

  const galleryImages = (drop.gallery ?? []).map((url) => ({ url }));

  const heroContent = {
    dropNumber,
    date,
    title,
    backgroundImage: heroImage,
  };

  return (
    <>
      <XsedInternalHero content={heroContent} hero={dict.xsedPage.hero} />
      <Section className="md:px-20 px-4">
        <Breadcrumb
          items={[
            { href: "/xsed", label: "Bitácora de escapadas" },
            { label: `Nº ${dropNumber}` },
          ]}
        />
        <XsedDropBody content={article} />
      </Section>
      {galleryImages.length > 0 && (
        <LightboxCarousel images={galleryImages} className="bg-gray-100" />
      )}
      <Testimonials
        title={dict.xsedPage.testimonials.title}
        subtitle={dict.xsedPage.testimonials.subtitle}
        eyebrow={dict.xsedPage.testimonials.eyebrow}
        viewFullReviewLabel={dict.xsedPage.testimonials.viewFullReviewLabel}
        featureColor="#D97E4A"
        testimonials={dropTestimonials}
      />
    </>
  );
}
