import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import { prisma } from "@/lib/prisma";
import HeaderHero from "@/components/journey/HeaderHero";
import Section from "@/components/layout/Section";
import ReviewFormClient from "./ReviewFormClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale?: string; token: string }>;
}

export default async function ReviewPage({ params }: PageProps) {
  const { locale: rawLocale, token } = await params;
  const locale = hasLocale(rawLocale) ? rawLocale : "es";
  const dict = await getDictionary(locale);
  const copy = dict.reviewForm;

  const tripRequest = await prisma.tripRequest.findUnique({
    where: { reviewToken: token },
    select: {
      id: true,
      type: true,
      reviewSubmittedAt: true,
      actualDestination: true,
      startDate: true,
      endDate: true,
    },
  });

  if (!tripRequest) {
    return (
      <>
        <HeaderHero
          className="h-[40vh]!"
          title={copy.errorInvalidToken}
          subtitle={null}
          fallbackImage="/images/hero-image-1.jpeg"
          videoSrc="/videos/hero-video-1.mp4"
        />
        <Section>
          <div className="max-w-md mx-auto">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
              <p className="text-sm text-neutral-600">{copy.errorInvalidToken}</p>
            </div>
          </div>
        </Section>
      </>
    );
  }

  if (tripRequest.reviewSubmittedAt) {
    return (
      <>
        <HeaderHero
          className="h-[40vh]!"
          title={copy.successTitle}
          description={copy.successMessage}
          subtitle={null}
          fallbackImage="/images/hero-image-1.jpeg"
          videoSrc="/videos/hero-video-1.mp4"
        />
        <Section>
          <div className="max-w-md mx-auto">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                {copy.successTitle}
              </h2>
              <p className="text-sm text-neutral-600">{copy.successMessage}</p>
            </div>
          </div>
        </Section>
      </>
    );
  }

  const formatDate = (d: Date | null) =>
    d
      ? d.toLocaleDateString(locale === "en" ? "en-US" : "es-AR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : null;

  const destination = tripRequest.actualDestination ?? null;
  const startDate = formatDate(tripRequest.startDate);

  const heroDescription = destination
    ? `${destination}${startDate ? ` · ${startDate}` : ""}`
    : copy.pageSubtitle;

  return (
    <>
      <HeaderHero
        className="h-[40vh]!"
        title={copy.pageTitle}
        description={heroDescription}
        subtitle={null}
        fallbackImage="/images/hero-image-1.jpeg"
        videoSrc="/videos/hero-video-1.mp4"
      />
      <Section className="py-8 md:py-24">
        <div className="max-w-lg mx-auto text-left">
          <ReviewFormClient token={token} copy={copy} />
        </div>
      </Section>
    </>
  );
}
