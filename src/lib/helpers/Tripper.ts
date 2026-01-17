import type { Testimonial } from '@/lib/data/shared/testimonial-types';
import { couple } from '@/lib/data/traveler-types/couple';
import { solo } from '@/lib/data/traveler-types/solo';
import { family } from '@/lib/data/traveler-types/family';
import { group } from '@/lib/data/traveler-types/group';
import { honeymoon } from '@/lib/data/traveler-types/honeymoon';
import { paws } from '@/lib/data/traveler-types/paws';
import type { Tripper } from '@/content/trippers';

/**
 * Get all testimonials for a specific tripper
 * Combines testimonials from all traveler types plus the tripper's own testimonials
 */
export function getAllTestimonialsForTripper(tripper: Tripper): Testimonial[] {
  // Get all testimonials from different traveler types
  const allTestimonials = [
    ...group.testimonials.items,
    ...solo.testimonials.items,
    ...family.testimonials.items,
    ...couple.testimonials.items,
    ...honeymoon.testimonials.items,
    ...paws.testimonials.items,
  ];

  // Add tripper's own testimonials (transform to match Testimonial interface)
  const tripperTestimonials: Testimonial[] = (tripper.testimonials || []).map(
    (t) => ({
      author: t.author,
      quote: t.quote,
      city: tripper.location || 'Ciudad', // Use tripper's location as default city
    }),
  );

  // For now, return all testimonials + tripper's own testimonials
  // In the future, you could implement filtering logic based on tripper's specialties, destinations, etc.
  return [...allTestimonials, ...tripperTestimonials];
}
