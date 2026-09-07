import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import { prisma } from "@/lib/prisma";
import type { XsedDropDraft, XsedDropStatus } from "@/types/xsed";
import { EMPTY_XSED_DRAFT } from "@/types/xsed";
import { normalizeXsedDraft } from "@/lib/helpers/xsed-form";
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

  const draft: XsedDropDraft = normalizeXsedDraft({
    ...EMPTY_XSED_DRAFT,
    status: (drop.status as XsedDropStatus) ?? "DRAFT",
    titleInternal: drop.titleInternal ?? "",
    heroImage: drop.heroImage ?? "",
    tripDate: toDateInput(drop.tripDate),
    destinationCity: drop.destinationCity ?? "",
    destinationCountry: drop.destinationCountry ?? "",
    hotels: Array.isArray(drop.hotels) ? drop.hotels : EMPTY_XSED_DRAFT.hotels,
    activities: Array.isArray(drop.activities) ? drop.activities : EMPTY_XSED_DRAFT.activities,
    sections: Array.isArray(drop.sections) ? drop.sections : EMPTY_XSED_DRAFT.sections,
    gallery: Array.isArray(drop.gallery) ? drop.gallery : [],
    itinerary: Array.isArray(drop.itinerary) ? drop.itinerary : EMPTY_XSED_DRAFT.itinerary,
    inclusions: Array.isArray(drop.inclusions) ? drop.inclusions : [],
    exclusions: Array.isArray(drop.exclusions) ? drop.exclusions : [],
  });

  return (
    <XsedDropShell
      dict={dict.adminXsed.form}
      initialDraft={draft}
      initialDraftId={drop.id}
      locale={locale}
    />
  );
}
