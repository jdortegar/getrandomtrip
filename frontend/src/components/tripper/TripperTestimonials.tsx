"use client";

import { Tripper } from "@/content/trippers";

type Props = {
  tripper: Tripper;
};

export default function TripperTestimonials({ tripper }: Props) {
  if (!tripper.testimonials || tripper.testimonials.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-10" id="testimonials">
      <h2 className="text-2xl md:text-3xl font-semibold mb-6">What Clients Say</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tripper.testimonials.map((testimonial, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md border border-neutral-100">
            <p className="text-neutral-700 italic mb-4">"{testimonial.text}"</p>
            <p className="text-right font-semibold text-neutral-800">- {testimonial.author}</p>
          </div>
        ))}
      </div>
    </section>
  );
}