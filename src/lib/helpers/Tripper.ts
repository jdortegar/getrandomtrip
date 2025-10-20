import type { Testimonial } from '@/lib/data/shared/testimonial-types';
import { groupTestimonials } from '@/lib/data/traveler-types/group/testimonials';
import { soloTestimonials } from '@/lib/data/traveler-types/solo/testimonials';
import { familyTestimonials } from '@/lib/data/traveler-types/family/testimonials';
import { coupleTestimonials } from '@/lib/data/traveler-types/couple/testimonials';
import { honeymoonTestimonials } from '@/lib/data/traveler-types/honeymoon/testimonials';
import { pawsTestimonials } from '@/lib/data/traveler-types/paws/testimonials';
import type { Tripper } from '@/content/trippers';

/**
 * Get all testimonials for a specific tripper
 * Combines testimonials from all traveler types plus the tripper's own testimonials
 */
export function getAllTestimonialsForTripper(tripper: Tripper): Testimonial[] {
  // Get all testimonials from different traveler types
  const allTestimonials = [
    ...groupTestimonials,
    ...soloTestimonials,
    ...familyTestimonials,
    ...coupleTestimonials,
    ...honeymoonTestimonials,
    ...pawsTestimonials,
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
