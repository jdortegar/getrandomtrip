import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getDictionary } from "@/lib/i18n/dictionaries";
import Section from "@/components/layout/Section";
import ExperienceFormClient from "@/components/app/dashboard/tripper/experiences/ExperienceFormClient";
import type { ExperienceFormData } from "@/types/tripper";

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

  const isXsed = pkg.type === "XSED";

  const initialData: ExperienceFormData = {
    type: pkg.type,
    level: pkg.level ?? "",
    title: pkg.title,
    status: pkg.status as string,
    teaser: pkg.teaser,
    description: pkg.description,
    heroImage: pkg.heroImage,
    destinationCountry: pkg.destinationCountry,
    destinationCity: pkg.destinationCity,
    excuseKey: pkg.excuseKey ?? "",
    minNights: pkg.minNights,
    maxNights: pkg.maxNights,
    minPax: pkg.minPax,
    maxPax: pkg.maxPax,
    basePrice: pkg.basePrice,
    displayPrice: pkg.displayPrice,
    accommodationType: pkg.accommodationType,
    transport: pkg.transport,
    climate: pkg.climate,
    maxTravelTime: pkg.maxTravelTime,
    departPref: pkg.departPref,
    arrivePref: pkg.arrivePref,
    hotels: Array.isArray(pkg.hotels) ? (pkg.hotels as any[]) : [],
    activities: Array.isArray(pkg.activities) ? (pkg.activities as any[]) : [],
    itinerary: Array.isArray(pkg.itinerary) ? (pkg.itinerary as any[]) : [],
    inclusions: Array.isArray(pkg.inclusions) ? (pkg.inclusions as string[]) : [],
    exclusions: Array.isArray(pkg.exclusions) ? (pkg.exclusions as string[]) : [],
    tags: pkg.tags,
    highlights: pkg.highlights,
    isActive: pkg.isActive,
    isFeatured: pkg.isFeatured,
    // XSED fields
    ...(isXsed && {
      titleInternal: pkg.titleInternal,
      slug: pkg.slug,
      tripDate: pkg.tripDate ? pkg.tripDate.toISOString().slice(0, 16) : null,
      revealAt: pkg.revealAt ? pkg.revealAt.toISOString().slice(0, 16) : null,
      minSpots: pkg.minSpots,
      maxSpots: pkg.maxSpots,
      currency: pkg.currency,
      cancellationPolicy: pkg.cancellationPolicy,
      weatherPolicy: pkg.weatherPolicy,
      accessibilityNotes: pkg.accessibilityNotes,
      safetyNotes: pkg.safetyNotes,
      revealCopy: pkg.revealCopy,
      preRevealCopy: pkg.preRevealCopy,
      packingHints: pkg.packingHints,
      whatsappMessageTemplate: pkg.whatsappMessageTemplate,
      adminNotes: pkg.adminNotes,
      supplierNotes: pkg.supplierNotes,
    }),
  };

  const dict = await getDictionary(params.locale);

  return (
    <Section>
      <ExperienceFormClient
        dict={dict.tripperExperiences.form}
        mode="edit"
        initialData={initialData}
        experienceId={pkg.id}
        locale={params.locale}
      />
    </Section>
  );
}
