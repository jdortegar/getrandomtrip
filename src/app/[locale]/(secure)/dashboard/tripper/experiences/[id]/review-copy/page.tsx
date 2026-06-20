import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import { TripperReviewCopyClient } from "./TripperReviewCopyClient";
import type {
  ExperienceFormDraft,
  AccommodationEntry,
  ActivityEntry,
  ItineraryDayEntry,
} from "@/types/tripper";

export default async function ReviewCopyPage(props: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, roles: true },
  });

  if (!user || !hasRoleAccess(user, "tripper")) {
    redirect(`/${locale}/dashboard`);
  }

  // Fetch the original experience (must be owned by the tripper)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const original = await (prisma.experience.findFirst as any)({
    where: { id: params.id, ownerId: user.id },
  }) as (Awaited<ReturnType<typeof prisma.experience.findFirst>> & {
    pricingByType: Record<string, number> | null;
    reviewNote: string | null;
    changedFields: string[];
  }) | null;

  if (!original) notFound();

  // Must be in PENDING_TRIPPER_REVIEW to use this page
  if ((original.status as string) !== "PENDING_TRIPPER_REVIEW") {
    redirect(`/${locale}/dashboard/tripper/experiences/${params.id}`);
  }

  // Find the associated review copy
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const copy = await (prisma.experience.findFirst as any)({
    where: {
      parentId: params.id,
      isReviewCopy: true,
      NOT: { status: "INACTIVE" },
    },
  }) as (Awaited<ReturnType<typeof prisma.experience.findFirst>> & {
    pricingByType: Record<string, number> | null;
    reviewNote: string | null;
    changedFields: string[];
  }) | null;

  if (!copy) {
    // No copy found — redirect to normal experience page
    redirect(`/${locale}/dashboard/tripper/experiences/${params.id}`);
  }

  // Render the copy's content (what the admin changed) read-only
  const copyDraft: ExperienceFormDraft = {
    status: (copy.status ?? "DRAFT") as ExperienceFormDraft["status"],
    title: copy.title ?? "",
    type: Array.isArray(copy.type) ? copy.type : [copy.type].filter(Boolean),
    level: copy.level ?? "essenza",
    teaser: copy.teaser ?? "",
    description: copy.description ?? "",
    heroImage: copy.heroImage ?? "",
    tags: Array.isArray(copy.tags) ? copy.tags : [],
    destinationCountry: copy.destinationCountry ?? "",
    destinationCity: copy.destinationCity ?? "",
    excuseKey: Array.isArray(copy.excuseKey) ? copy.excuseKey : [],
    climate: copy.climate ?? "any",
    minPax: copy.minPax ?? 1,
    maxPax: copy.maxPax ?? 4,
    minNights: copy.minNights ?? 1,
    maxNights: copy.maxNights ?? 7,
    pricingByType: (copy.pricingByType as Record<string, number> | null) ?? null,
    reviewNote: copy.reviewNote ?? null,
    estimatedCost: "",
    season: Array.isArray(copy.season) ? copy.season : [],
    transport: copy.transport ?? "any",
    travelTime: "",
    maxTravelTime: copy.maxTravelTime ?? "no-limit",
    departPref: copy.departPref ?? "any",
    arrivePref: copy.arrivePref ?? "any",
    accommodationType: copy.accommodationType ?? "any",
    accommodations: (Array.isArray(copy.hotels) && copy.hotels.length > 0
      ? copy.hotels
      : [{ hotelName: "", hotelStars: "", hotelLocation: "", hotelDays: "", hotelLink: "", referredLink: "" }]
    ) as AccommodationEntry[],
    activities: (Array.isArray(copy.activities) && copy.activities.length > 0
      ? copy.activities
      : [{ name: "", durationRhythm: null, description: "", risks: "", image: null }]
    ) as ActivityEntry[],
    itinerary: (Array.isArray(copy.itinerary) && copy.itinerary.length > 0
      ? copy.itinerary
      : [{ title: "", description: "", image: null }]
    ) as ItineraryDayEntry[],
    inclusions: Array.isArray(copy.inclusions) ? (copy.inclusions as string[]) : [],
    exclusions: Array.isArray(copy.exclusions) ? (copy.exclusions as string[]) : [],
    createBlogPost: false,
  };

  const changedFields: string[] = Array.isArray(copy.changedFields)
    ? (copy.changedFields as string[])
    : [];

  const dict = await getDictionary(locale);

  return (
    <TripperReviewCopyClient
      dict={dict.tripperExperiences.form}
      locale={locale}
      userBadgeLabels={dict.journey.userBadge}
      copyDraft={copyDraft}
      changedFields={changedFields}
      experienceId={params.id}
    />
  );
}
