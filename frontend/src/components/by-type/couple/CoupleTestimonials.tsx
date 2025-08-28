'use client';
import React from 'react';

const testimonials = [
  {
    quote: 'Volvimos a mirarnos como al principio. La sorpresa fue el mejor regalo.',
    author: 'Ana y Juan',
    city: 'Buenos Aires',
  },
  {
    quote: 'Cada detalle estaba pensado para dos. Se sintió muy personal.',
    author: 'Lucía y Marcos',
    city: 'Santiago',
  },
];

export default function CoupleTestimonials() {
  return (
    <section className="py-20 px-8 bg-white text-neutral-900">
      <div className="max-w-7xl mx-auto">
        <h2
          className="text-5xl font-bold text-center mb-12"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Lo que dicen las parejas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {testimonials.map((t, idx) => (
            <div key={`${t.author}-${idx}`} className="bg-neutral-100 p-8 rounded-lg shadow-lg">
              <p className="text-lg italic text-neutral-700 mb-4">&quot;{t.quote}&quot;</p>
              <p className="font-semibold text-neutral-900">{t.author}</p>
              <p className="text-sm text-neutral-600">{t.city}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}