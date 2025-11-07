'use client';

import React from 'react';

type T = {
  quote: string;
  author: string;
  city: string;
};

const testimonials: T[] = [
  {
    quote:
      'Fue nuestro primer viaje sorpresa en pareja y salió redondo. Ritmo perfecto y momentos únicos.',
    author: 'Belu & Nico',
    city: 'Buenos Aires',
  },
  {
    quote:
      'Detalles pensados para dos: cenas, vistas y silencios que valen oro.',
    author: 'Lu & Fede',
    city: 'Montevideo',
  },
  {
    quote:
      'Nos desconectamos de todo. Volvimos con historia y fotos que amamos.',
    author: 'Juli & Tomi',
    city: 'Córdoba',
  },
  {
    quote:
      'Los consejos locales marcaron la diferencia. Sin fricciones, solo disfrute.',
    author: 'Sofi & Juan',
    city: 'Mendoza',
  },
  {
    quote:
      'Nos llevaron a rincones que no salen en ningún blog. Pura sorpresa.',
    author: 'Car y Eze',
    city: 'Santiago',
  },
  {
    quote:
      'La curaduría de experiencias fue impecable. Repetimos seguro.',
    author: 'Clau & Mati',
    city: 'La Plata',
  },
];

export default function CoupleTestimonials() {
  const [start, setStart] = React.useState(0);
  const len = testimonials.length;
  const visible = Array.from({ length: 3 }, (_, i) => testimonials[(start + i) % len]);

  const prev = () => setStart((s) => (s - 3 + len) % len);
  const next = () => setStart((s) => (s + 3) % len);

  return (
    <section id="testimonios-couple" className="py-20 px-8 bg-white text-neutral-900">
      <div className="rt-container">
        <h2
          className="text-5xl font-bold text-center mb-12"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Lo que dicen las parejas
        </h2>

        <div className="flex items-center justify-between mb-6">
          <button
            aria-label="Ver testimonios anteriores"
            onClick={prev}
            className="rounded-full border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-100"
          >
            ←
          </button>
          <div className="text-sm text-neutral-500">
            {Math.floor(start / 3) + 1} / {Math.ceil(len / 3)}
          </div>
          <button
            aria-label="Ver más testimonios"
            onClick={next}
            className="rounded-full border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-100"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {visible.map((testimonial, index) => (
            <div key={`${testimonial.author}-${index}`} className="bg-neutral-100 p-8 rounded-lg shadow-lg">
              <p className="text-lg italic text-neutral-700 mb-4">&quot;{testimonial.quote}&quot;</p>
              <p className="font-semibold text-neutral-900">{testimonial.author}</p>
              <p className="text-sm text-neutral-600">{testimonial.city}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
