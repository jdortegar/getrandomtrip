import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { NewExperienceShell } from "@/components/app/dashboard/tripper/experiences/NewExperienceShell";
import type { ExperienceFormDraft, AccommodationEntry, ActivityEntry, ItineraryDayEntry } from "@/types/tripper";

export default async function EditExperiencePage(props: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/${params.locale}/login`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, roles: true },
  });

  if (!user || !hasRoleAccess(user, "tripper")) {
    redirect(`/${params.locale}/dashboard`);
  }

  const pkg = await prisma.experience.findFirst({
    where: { id: params.id, ownerId: user.id },
  });

  if (!pkg) {
    notFound();
  }

  const initialDraft: ExperienceFormDraft = {
    status: pkg.status,
    title: pkg.title,
    type: pkg.type,
    level: pkg.level ?? "essenza",
    teaser: pkg.teaser,
    description: pkg.description,
    heroImage: pkg.heroImage,
    tags: pkg.tags,
    highlights: pkg.highlights,
    destinationCountry: pkg.destinationCountry,
    destinationCity: pkg.destinationCity,
    excuseKey: pkg.excuseKey ?? "",
    climate: pkg.climate,
    minPax: pkg.minPax,
    maxPax: pkg.maxPax,
    minNights: pkg.minNights,
    maxNights: pkg.maxNights,
    basePrice: pkg.basePrice,
    displayPrice: pkg.displayPrice,
    estimatedCost: "",
    season: pkg.season ?? "any",
    transport: pkg.transport,
    travelTime: "",
    maxTravelTime: pkg.maxTravelTime,
    departPref: pkg.departPref,
    arrivePref: pkg.arrivePref,
    accommodationType: pkg.accommodationType,
    accommodations: (Array.isArray(pkg.hotels) && pkg.hotels.length > 0
      ? pkg.hotels
      : [{ hotelName: "", hotelStars: "", hotelLocation: "", hotelDays: "" }]
    ) as AccommodationEntry[],
    activities: (Array.isArray(pkg.activities) && pkg.activities.length > 0
      ? pkg.activities
      : [{ name: "", durationRhythm: "", description: "", risks: "" }]
    ) as ActivityEntry[],
    itinerary: (Array.isArray(pkg.itinerary) && pkg.itinerary.length > 0
      ? pkg.itinerary
      : [{ title: "", description: "" }]
    ) as ItineraryDayEntry[],
    inclusions: Array.isArray(pkg.inclusions) ? (pkg.inclusions as string[]) : [],
    exclusions: Array.isArray(pkg.exclusions) ? (pkg.exclusions as string[]) : [],
  };

  const dict = await getDictionary(params.locale);

  return (
    <NewExperienceShell
      dict={dict.tripperExperiences.form}
      locale={params.locale}
      userBadgeLabels={dict.journey.userBadge}
      initialDraft={initialDraft}
      initialDraftId={pkg.id}
    />
  );
}
