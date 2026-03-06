import type { Testimonial } from '@/lib/data/shared/testimonial-types';
import { DEFAULT_LOCALE } from '@/lib/i18n/config';
import { couple } from '@/lib/data/traveler-types/couple';
import { family } from '@/lib/data/traveler-types/family';
import { group } from '@/lib/data/traveler-types/group';
import { honeymoon } from '@/lib/data/traveler-types/honeymoon';
import { paws } from '@/lib/data/traveler-types/paws';
import { solo } from '@/lib/data/traveler-types/solo';
import type { Tripper } from '@/content/trippers';

/**
 * Get all testimonials for a specific tripper
 * Combines testimonials from all traveler types plus the tripper's own testimonials
 */
export function getAllTestimonialsForTripper(tripper: Tripper): Testimonial[] {
  const locale = DEFAULT_LOCALE;
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
      country: tripper.location || 'Ciudad',
      quote: t.quote,
    }),
  );

  // For now, return all testimonials + tripper's own testimonials
  // In the future, you could implement filtering logic based on tripper's specialties, destinations, etc.
  return [...allTestimonials, ...tripperTestimonials];
}
