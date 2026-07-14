import type { Testimonial } from "@/lib/data/shared/testimonial-types";
import { getApprovedReviewsForTripper } from "@/lib/db/tripper-queries";
import { formatReviewerAuthor } from "@/lib/helpers/formatReviewerAuthor";

/** Shape used for testimonial resolution: DB tripper. */
export interface TripperTestimonialInput {
  /** Tripper user ID — required to fetch DB-backed reviews. Omit only when no DB lookup is needed. */
  id?: string;
  location?: string | null;
}

/**
 * Get all testimonials for a specific tripper.
 * Returns only real, DB-backed approved+public reviews. Returns an empty
 * array when the tripper has no approved reviews — callers must hide the
 * testimonials section in that case rather than showing placeholder content.
 */
export async function getAllTestimonialsForTripper(
  tripper: TripperTestimonialInput,
): Promise<Testimonial[]> {
  const dbReviews = tripper.id
    ? await getApprovedReviewsForTripper(tripper.id)
    : [];

  return dbReviews.map((review) => ({
    author: formatReviewerAuthor(review.user.name),
    country: tripper.location || "",
    quote: review.content,
  }));
}
