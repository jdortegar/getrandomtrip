export interface Testimonial {
  author: string;
  city: string;
  quote: string;
}

export interface TestimonialsData {
  testimonials: Testimonial[];
  title: string;
}
