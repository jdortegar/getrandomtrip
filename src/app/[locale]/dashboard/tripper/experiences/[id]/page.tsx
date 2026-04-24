import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getDictionary } from "@/lib/i18n/dictionaries";
import Section from "@/components/layout/Section";
import ExperienceFormClient from "@/components/app/dashboard/tripper/experiences/ExperienceFormClient";
import type { ExperienceFormData } from "@/types/tripper";

export default async function EditPackagePage({
  params,
}: {
  params: { locale: string; id: string };
}) {
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

  const pkg = await prisma.package.findFirst({
    where: { id: params.id, ownerId: user.id },
  });

  if (!pkg) {
    notFound();
  }

  const initialData: ExperienceFormData = {
    type: pkg.type,
    level: pkg.level,
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
    basePriceUsd: pkg.basePriceUsd,
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
    inclusions: Array.isArray(pkg.inclusions)
      ? (pkg.inclusions as string[])
      : [],
    exclusions: Array.isArray(pkg.exclusions)
      ? (pkg.exclusions as string[])
      : [],
    tags: pkg.tags,
    highlights: pkg.highlights,
    isActive: pkg.isActive,
    isFeatured: pkg.isFeatured,
  };

  const dict = await getDictionary(params.locale);

  return (
    <Section>
      <ExperienceFormClient
        dict={dict.packages.form}
        mode="edit"
        initialData={initialData}
        packageId={pkg.id}
        locale={params.locale}
      />
    </Section>
  );
}
