import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import { prisma } from "@/lib/prisma";
import type { AccommodationEntry, ActivityEntry, XsedDropDraft, XsedDropStatus } from "@/types/xsed";
import { EMPTY_XSED_DRAFT } from "@/types/xsed";
import { XsedDropShell } from "@/components/app/dashboard/admin/xsed/XsedDropShell";

function toDateInput(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}



export default async function EditXsedDropPage(props: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);

  const drop = await prisma.experience.findUnique({
    where: { id: params.id, type: { has: "XSED" } },
  });

  if (!drop) {
    notFound();
  }

  const draft: XsedDropDraft = {
    ...EMPTY_XSED_DRAFT,
    status: (drop.status as XsedDropStatus) ?? "DRAFT",
    titleInternal: drop.titleInternal ?? "",
    teaser: drop.teaser ?? "",
    heroImage: drop.heroImage ?? "",
    tripDate: toDateInput(drop.tripDate),
    basePrice: drop.basePrice ?? EMPTY_XSED_DRAFT.basePrice,
    isFeatured: drop.isFeatured ?? false,
    destinationCity: drop.destinationCity ?? "",
    destinationCountry: drop.destinationCountry ?? "",
    preRevealCopy: drop.preRevealCopy ?? "",
    revealCopy: drop.revealCopy ?? "",
    packingHints: drop.packingHints ?? "",
    accessibilityNotes: drop.accessibilityNotes ?? "",
    safetyNotes: drop.safetyNotes ?? "",
    cancellationPolicy: drop.cancellationPolicy ?? "",
    weatherPolicy: drop.weatherPolicy ?? "",
    whatsappMessageTemplate: drop.whatsappMessageTemplate ?? "",
    hotels: Array.isArray(drop.hotels) ? (drop.hotels as unknown as AccommodationEntry[]) : EMPTY_XSED_DRAFT.hotels,
    activities: Array.isArray(drop.activities) ? (drop.activities as unknown as ActivityEntry[]) : EMPTY_XSED_DRAFT.activities,
    adminNotes: drop.adminNotes ?? "",
    supplierNotes: drop.supplierNotes ?? "",
  };

  return (
    <XsedDropShell
      dict={dict.adminXsed.form}
      initialDraft={draft}
      initialDraftId={drop.id}
      locale={locale}
    />
  );
}
