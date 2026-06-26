import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getDictionary } from "@/lib/i18n/dictionaries";
import Section from "@/components/layout/Section";
import ExperiencesPageClient from "@/components/app/dashboard/tripper/experiences/ExperiencesPageClient";
import type { ExperienceListItem } from "@/types/tripper";

export default async function TripperExperiencesPage(props: {
  params: Promise<{ locale: string }>;
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawExperiences = await (prisma.experience.findMany as any)({
    where: { ownerId: user.id, isReviewCopy: false },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      type: true,
      level: true,
      status: true,
      isActive: true,
      pricingByType: true,
      reviewNote: true,
      destinationCountry: true,
      destinationCity: true,
      minNights: true,
      maxNights: true,
      minPax: true,
      maxPax: true,
      createdAt: true,
      updatedAt: true,
    },
  }) as Array<ExperienceListItem & { createdAt: Date; updatedAt: Date }>;

  const experiences: ExperienceListItem[] = rawExperiences.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const locale = params.locale;
  const dict = await getDictionary(locale);

  return (
    <Section>
      <ExperiencesPageClient
        dict={dict.tripperExperiences}
        experiences={experiences}
        locale={locale}
      />
    </Section>
  );
}
