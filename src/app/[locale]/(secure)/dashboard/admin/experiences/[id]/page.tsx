import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import { AdminExperienceReviewClient } from "./AdminExperienceReviewClient";
import type {
  ExperienceFormDraft,
  AccommodationEntry,
  ActivityEntry,
  ItineraryDayEntry,
} from "@/types/tripper";

export default async function AdminExperienceReviewPage(props: {
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

  if (!user || !hasRoleAccess(user, "admin")) {
    redirect(`/${locale}/dashboard`);
  }

  // Admin can review any experience — no ownerId filter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pkg = await (prisma.experience.findFirst as any)({
    where: { id: params.id },
  }) as Awaited<ReturnType<typeof prisma.experience.findFirst>> & {
    pricingByType: Record<string, number> | null;
    reviewNote: string | null;
    reviewLockedBy: string | null;
  } | null;

  if (!pkg) notFound();

  // Check for an existing non-INACTIVE review copy — load full data so admin
  // resumes editing their previous changes instead of seeing the original.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingCopy = await (prisma.experience.findFirst as any)({
    where: {
      parentId: params.id,
      isReviewCopy: true,
      NOT: { status: "INACTIVE" },
    },
  }) as Awaited<ReturnType<typeof prisma.experience.findFirst>> & {
    pricingByType: Record<string, number> | null;
    reviewNote: string | null;
    reviewLockedBy: string | null;
  } | null;

  // Fetch locker name if locked by another admin
  let reviewLockedByName: string | null = null;
  if (pkg.reviewLockedBy && pkg.reviewLockedBy !== user.id) {
    const locker = await prisma.user.findUnique({
      where: { id: pkg.reviewLockedBy },
      select: { name: true },
    });
    reviewLockedByName = locker?.name ?? null;
  }

  // When a copy exists, load its data so admin resumes their previous edits.
  const source = existingCopy ?? pkg;

  const initialDraft: ExperienceFormDraft = {
    status: source.status,
    title: source.title,
    type: Array.isArray(source.type) ? source.type : [source.type].filter(Boolean),
    level: source.level ?? "essenza",
    teaser: source.teaser,
    description: source.description,
    heroImage: source.heroImage,
    tags: source.tags,
    destinationCountry: source.destinationCountry,
    destinationCity: source.destinationCity,
    excuseKey: Array.isArray(source.excuseKey) ? source.excuseKey : [],
    climate: source.climate,
    minPax: source.minPax,
    maxPax: source.maxPax,
    minNights: source.minNights,
    maxNights: source.maxNights,
    pricingByType: ((source as typeof pkg).pricingByType as Record<string, number> | null) ?? null,
    reviewNote: ((source as typeof pkg).reviewNote) ?? null,
    estimatedCost: "",
    season: Array.isArray(source.season) ? source.season : [],
    transport: source.transport,
    travelTime: "",
    maxTravelTime: source.maxTravelTime,
    departPref: source.departPref,
    arrivePref: source.arrivePref,
    accommodationType: source.accommodationType,
    accommodations: (Array.isArray(source.hotels) && source.hotels.length > 0
      ? source.hotels
      : [{ hotelName: "", hotelStars: "", hotelLocation: "", hotelDays: "", hotelLink: "", referredLink: "" }]
    ) as AccommodationEntry[],
    activities: (Array.isArray(source.activities) && source.activities.length > 0
      ? source.activities
      : [{ name: "", durationRhythm: null, description: "", risks: "", image: null }]
    ) as ActivityEntry[],
    itinerary: (Array.isArray(source.itinerary) && source.itinerary.length > 0
      ? source.itinerary
      : [{ title: "", description: "", image: null }]
    ) as ItineraryDayEntry[],
    inclusions: Array.isArray(source.inclusions) ? (source.inclusions as string[]) : [],
    exclusions: Array.isArray(source.exclusions) ? (source.exclusions as string[]) : [],
    createBlogPost: false,
  };

  const dict = await getDictionary(locale);

  return (
    <AdminExperienceReviewClient
      dict={dict.tripperExperiences.form}
      locale={locale}
      userBadgeLabels={dict.journey.userBadge}
      initialDraft={initialDraft}
      experienceId={params.id}
      currentAdminId={user.id}
      initialMode={existingCopy ? "adminEdit" : "adminReadOnly"}
      reviewLockedBy={pkg.reviewLockedBy ?? null}
      reviewLockedByName={reviewLockedByName}
      adminCopyId={existingCopy?.id ?? null}
    />
  );
}
