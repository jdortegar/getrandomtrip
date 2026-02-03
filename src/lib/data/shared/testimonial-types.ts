export interface Testimonial {
  author: string;
  avatarUrl?: string;
  country: string;
  countryCode?: string;
  quote: string;
  reviewUrl?: string;
}

export interface TestimonialsData {
  testimonials: Testimonial[];
  title: string;
}
