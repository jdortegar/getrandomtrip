import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import { NewExperienceShell } from "@/components/app/dashboard/tripper/experiences/NewExperienceShell";
import type {
  ExperienceFormDraft,
  ExperienceRandomtripEditFields,
  AccommodationEntry,
  ActivityEntry,
  ItineraryDayEntry,
} from "@/types/tripper";

export default async function AdminEditExperiencePage(props: {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pkg = await (prisma.experience.findFirst as any)({
    where: { id: params.id },
  }) as (Awaited<ReturnType<typeof prisma.experience.findFirst>> & ExperienceRandomtripEditFields) | null;

  if (!pkg) notFound();

  // This flow is RANDOMTRIP-only — admin edits of a tripper's own experience
  // stay behind the tripper-review pipeline (approve/reject), not this editor.
  if (pkg.source !== "RANDOMTRIP") {
    redirect(`/${locale}/dashboard/admin/experiences/${params.id}`);
  }

  // XSED drops are also tagged source=RANDOMTRIP (see backfill-experience-source.ts)
  // but have their own dedicated editor with XSED-only fields (titleInternal, slug,
  // tripDate, revealAt, ...) that this generic shell does not render — routing them
  // here would silently null those fields out on save.
  if (Array.isArray(pkg.type) && pkg.type.includes("XSED")) {
    redirect(`/${locale}/dashboard/admin/xsed/${params.id}/edit`);
  }

  const initialDraft: ExperienceFormDraft = {
    status: pkg.status,
    title: pkg.title,
    type: Array.isArray(pkg.type) ? pkg.type : [pkg.type].filter(Boolean),
    level: pkg.level ?? "essenza",
    teaser: pkg.teaser,
    description: pkg.description,
    heroImage: pkg.heroImage,
    tags: pkg.tags,
    destinationCountry: pkg.destinationCountry,
    destinationCity: pkg.destinationCity,
    excuseKey: Array.isArray(pkg.excuseKey) ? pkg.excuseKey : [],
    climate: pkg.climate,
    minPax: pkg.minPax,
    maxPax: pkg.maxPax,
    minNights: pkg.minNights,
    maxNights: pkg.maxNights,
    pricingByType: (pkg.pricingByType as Record<string, number> | null) ?? null,
    reviewNote: pkg.reviewNote ?? null,
    tripperNote: pkg.tripperNote ?? null,
    estimatedCost: "",
    season: Array.isArray(pkg.season) ? pkg.season : [],
    transport: pkg.transport,
    travelTime: "",
    maxTravelTime: pkg.maxTravelTime,
    departPref: pkg.departPref,
    arrivePref: pkg.arrivePref,
    accommodationType: pkg.accommodationType,
    accommodations: (Array.isArray(pkg.hotels) && pkg.hotels.length > 0
      ? pkg.hotels
      : [
          { hotelName: "", hotelStars: "", hotelLocation: "", hotelDays: "", hotelLink: "", referredLink: "" },
        ]) as AccommodationEntry[],
    activities: (Array.isArray(pkg.activities) && pkg.activities.length > 0
      ? pkg.activities
      : [
          { name: "", durationRhythm: null, description: "", risks: "", image: null },
        ]) as ActivityEntry[],
    itinerary: (Array.isArray(pkg.itinerary) && pkg.itinerary.length > 0
      ? pkg.itinerary
      : [{ title: "", description: "", image: null }]) as ItineraryDayEntry[],
    inclusions: Array.isArray(pkg.inclusions)
      ? (pkg.inclusions as string[])
      : [],
    exclusions: Array.isArray(pkg.exclusions)
      ? (pkg.exclusions as string[])
      : [],
    createBlogPost: false,
  };

  const dict = await getDictionary(locale);

  return (
    <NewExperienceShell
      mode="adminCreate"
      dict={dict.tripperExperiences.form}
      finalizeCopy={dict.adminDashboard.newExperience}
      editModeCopy={dict.adminDashboard.editExperience}
      locale={locale}
      userBadgeLabels={dict.journey.userBadge}
      initialDraft={initialDraft}
      initialDraftId={pkg.id}
    />
  );
}
