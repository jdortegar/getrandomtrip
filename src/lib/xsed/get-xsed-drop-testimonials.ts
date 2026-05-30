import type { TestimonialData } from "@/components/Testimonials/types";
import { findCompletedXsedTripRequestsForTestimonials } from "@/lib/data/xsed";
import { getCountryCode } from "@/lib/helpers/flags";

function formatReviewerAuthor(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Viajero";
  if (parts.length === 1) return parts[0]!;
  const first = parts[0]!;
  const last = parts[parts.length - 1]!;
  const initial = last.charAt(0).toUpperCase();
  return `${first} ${initial}.`;
}

/**
 * Public testimonials from travelers who completed this XSED drop and left feedback.
 */
export async function getXsedDropTestimonials(
  experienceId: string,
): Promise<TestimonialData[]> {
  const rows = await findCompletedXsedTripRequestsForTestimonials(experienceId);

  const out: TestimonialData[] = [];
  for (const tr of rows) {
    const quote = (tr.customerFeedback ?? "").trim();
    if (!quote) continue;

    const country = tr.originCountry?.trim() || "Argentina";
    const code = getCountryCode(country);

    out.push({
      author: formatReviewerAuthor(tr.user.name),
      avatarUrl: tr.user.avatarUrl ?? undefined,
      country,
      ...(code && code.length === 2 ? { countryCode: code } : {}),
      quote,
    });
    if (out.length >= 9) break;
  }

  return out;
}
