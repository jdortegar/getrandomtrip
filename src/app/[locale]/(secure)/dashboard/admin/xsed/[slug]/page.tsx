import { notFound } from "next/navigation";
import { hasLocale } from "@/lib/i18n/config";
import Section from "@/components/layout/Section";
import { prisma } from "@/lib/prisma";
import { AdminXsedFormClient } from "../../AdminXsedFormClient";
import type { AdminXsedBenefit } from "@/lib/admin/types";

export default async function AdminXsedEditPage(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await props.params;
  const locale = hasLocale(raw) ? raw : "es";

  const drop = await prisma.xsedExperience.findFirst({
    select: {
      id: true,
      slug: true,
      status: true,
      titleInternal: true,
      titlePublicTeaser: true,
      heroImage: true,
      destinationCity: true,
      destinationState: true,
      originCity: true,
      originCountry: true,
      distanceKmFromOrigin: true,
      tripDate: true,
      revealAt: true,
      pricePerPerson: true,
      currency: true,
      minSpots: true,
      maxSpots: true,
      costEstimateTotal: true,
      targetMarginPercent: true,
      included: true,
      notIncluded: true,
      generalConditions: true,
      cancellationPolicy: true,
      weatherPolicy: true,
      accessibilityNotes: true,
      safetyNotes: true,
      revealCopy: true,
      preRevealCopy: true,
      packingHints: true,
      whatsappMessageTemplate: true,
      adminNotes: true,
      supplierNotes: true,
      benefits: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          type: true,
          sortOrder: true,
          name: true,
          providerName: true,
          address: true,
          city: true,
          state: true,
          googleMapsUrl: true,
          customerVisibleNotes: true,
          internalNotes: true,
          confirmationStatus: true,
          reservationCode: true,
          photos: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, url: true, altText: true, sortOrder: true },
          },
        },
      },
    },
    where: { slug },
  });

  if (!drop) notFound();

  const { benefits, ...fields } = drop;

  const initialData: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (k === "id") continue;
    if (v == null) continue;
    if (v instanceof Date) {
      initialData[k] = v.toISOString().slice(0, 16);
    } else {
      initialData[k] = String(v);
    }
  }

  return (
    <Section>
      <AdminXsedFormClient
        locale={locale}
        experienceId={drop.id}
        initialData={initialData}
        initialBenefits={benefits as AdminXsedBenefit[]}
      />
    </Section>
  );
}
