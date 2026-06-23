import type { Testimonial } from "@/lib/data/shared/testimonial-types";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { couple } from "@/lib/data/traveler-types/couple";
import { family } from "@/lib/data/traveler-types/family";
import { group } from "@/lib/data/traveler-types/group";
import { honeymoon } from "@/lib/data/traveler-types/honeymoon";
import { paws } from "@/lib/data/traveler-types/paws";
import { solo } from "@/lib/data/traveler-types/solo";
import { getApprovedReviewsForTripper } from "@/lib/db/tripper-queries";

/** Shape used for testimonial resolution: DB tripper or content tripper. */
export interface TripperTestimonialInput {
  /** Tripper user ID — required to fetch DB-backed reviews. Omit only when no DB lookup is needed. */
  id?: string;
  location?: string | null;
  testimonials?: Array<{ author: string; quote: string }>;
}

/**
 * Get all testimonials for a specific tripper.
 * Merges DB-backed approved reviews with hardcoded traveler-type testimonials.
 * When `tripper.id` is not provided, falls back to hardcoded testimonials only.
 */
export async function getAllTestimonialsForTripper(
  tripper: TripperTestimonialInput,
): Promise<Testimonial[]> {
  const locale = DEFAULT_LOCALE;

  // Fetch approved DB reviews for this tripper (only when ID is available)
  const dbReviews = tripper.id
    ? await getApprovedReviewsForTripper(tripper.id)
    : [];

  if (dbReviews.length > 0) {
    // Return DB-backed reviews as testimonials (no hardcoded fallback)
    const dbTestimonials: Testimonial[] = dbReviews.map((review) => ({
      author: review.user.name,
      country: tripper.location || "",
      quote: review.content,
    }));
    return dbTestimonials;
  }

  // Fallback: use hardcoded testimonials when no DB reviews exist
  const allTestimonials = [
    ...group[locale].testimonials.items,
    ...solo[locale].testimonials.items,
    ...family[locale].testimonials.items,
    ...couple[locale].testimonials.items,
    ...honeymoon[locale].testimonials.items,
    ...paws[locale].testimonials.items,
  ];

  // Add tripper's own testimonials (transform to match Testimonial interface)
  const tripperTestimonials: Testimonial[] = (tripper.testimonials || []).map(
    (t) => ({
      author: t.author,
      country: tripper.location || "Ciudad",
      quote: t.quote,
    }),
  );

  return [...allTestimonials, ...tripperTestimonials];
}
