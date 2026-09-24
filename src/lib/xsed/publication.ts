import type { Prisma } from "@prisma/client";
import {
  isXsedExperience,
  XSED_EXPERIENCE_WHERE,
} from "@/lib/experiences/xsedExperience";
import {
  canPublishXsedDrop,
  resolveXsedPublishFields,
} from "@/lib/helpers/xsed-form";
import type { XsedPublicationRecord } from "@/types/xsed";

/** Admin classification is broader: only published, configured originals are public. */
export const PUBLIC_XSED_EXPERIENCE_WHERE = {
  AND: [
    XSED_EXPERIENCE_WHERE,
    {
      status: "ACTIVE",
      isActive: true,
      isReviewCopy: false,
      slug: { not: null },
      titleInternal: { not: null },
      tripDate: { not: null },
      destinationCity: { not: "" },
      destinationCountry: { not: "" },
      NOT: [{ slug: "" }, { titleInternal: "" }],
    },
  ],
} satisfies Prisma.ExperienceWhereInput;

/** Content readiness also applies to review copies, which never own public identity. */
export function hasXsedDropContent(
  experience: Partial<XsedPublicationRecord>,
): boolean {
  return canPublishXsedDrop(resolveXsedPublishFields({}, experience));
}

export function isPublicXsedExperience(
  experience: XsedPublicationRecord,
): boolean {
  return (
    isXsedExperience(experience) &&
    experience.status === "ACTIVE" &&
    experience.isActive &&
    !experience.isReviewCopy &&
    !!experience.slug?.trim() &&
    hasXsedDropContent(experience)
  );
}
