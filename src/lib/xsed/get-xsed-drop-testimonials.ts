import type { TestimonialData } from "@/components/Testimonials/types";
import {
  findAllCompletedXsedTripRequestsForTestimonials,
  findCompletedXsedTripRequestsForTestimonials,
} from "@/lib/data/xsed";
import { getCountryCode } from "@/lib/helpers/flags";
import { formatReviewerAuthor } from "@/lib/helpers/formatReviewerAuthor";

type CompletedXsedTripRequestRow = Awaited<
  ReturnType<typeof findCompletedXsedTripRequestsForTestimonials>
>[number];

function mapRowsToTestimonials(
  rows: CompletedXsedTripRequestRow[],
): TestimonialData[] {
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

/**
 * Public testimonials from travelers who completed this XSED drop and left feedback.
 */
export async function getXsedDropTestimonials(
  experienceId: string,
): Promise<TestimonialData[]> {
  const rows = await findCompletedXsedTripRequestsForTestimonials(experienceId);
  return mapRowsToTestimonials(rows);
}

/**
 * Public testimonials from travelers who completed ANY XSED drop and left
 * feedback — used for the general /xsed landing pages (not tied to one drop).
 */
export async function getAllXsedTestimonials(): Promise<TestimonialData[]> {
  const rows = await findAllCompletedXsedTripRequestsForTestimonials();
  return mapRowsToTestimonials(rows);
}
