import type { Prisma } from "@prisma/client";
import { getExperienceBasePricePerPerson } from "@/lib/experiences/xsedExperience";
import { hasXsedDropContent } from "./publication";
import type { XsedPublicationRecord } from "@/types/xsed";

type PublicationDb = Pick<Prisma.TransactionClient, "experience">;

/** Reserve the next numeric identity; the DB unique key remains the concurrency guard. */
export async function nextXsedDropSlug(db: PublicationDb): Promise<string> {
  const rows = await db.experience.findMany({
    where: { slug: { not: null } },
    select: { slug: true },
  });
  const numbers = rows.map(({ slug }) =>
    /^\d+$/.test(slug ?? "") ? Number(slug) : 0,
  );
  return String(Math.max(0, ...numbers.filter(Number.isSafeInteger)) + 1);
}

/** Called only on an explicit publication/approval, never while editing a copy. */
export async function xsedPublicationData(
  db: PublicationDb,
  experience: Partial<XsedPublicationRecord>,
  originalSlug: string | null | undefined,
) {
  if (!hasXsedDropContent(experience)) throw new Error("drop_setup_required");
  const types = Array.isArray(experience.type) ? experience.type : ["XSED"];
  return {
    slug: originalSlug?.trim() || (await nextXsedDropSlug(db)),
    isActive: true,
    pricingByType: Object.fromEntries(
      types.map((type) => [
        type,
        getExperienceBasePricePerPerson(type, "xsed"),
      ]),
    ),
  };
}
