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
      'Randomtrip hizo que nuestro viaje familiar fuera inolvidable. ¡Todo fue perfecto, desde la planificación hasta las actividades!',
    author: 'Familia García',
    city: 'Buenos Aires',
  },
  {
    quote:
      'Nunca pensamos que viajar con niños podría ser tan relajante. Descubrimos lugares increíbles sin estrés.',
    author: 'Los Rodríguez',
    city: 'Córdoba',
  },
  {
    quote:
      'La atención al detalle y las recomendaciones personalizadas superaron nuestras expectativas. ¡Vamos por el próximo!',
    author: 'Familia Pérez',
    city: 'Mendoza',
  },
  {
    quote:
      'Logística impecable con cochecito y siestas. Todo fluyó para grandes y chicos.',
    author: 'Familia Suárez',
    city: 'Rosario',
  },
  {
    quote:
      'Actividades pensadas para cada edad. Nadie se quedó afuera.',
    author: 'Familia Romero',
    city: 'Montevideo',
  },
  {
    quote:
      'Nos sorprendieron con detalles que todavía recordamos en casa.',
    author: 'Familia Benítez',
    city: 'La Plata',
  },
];

export default function FamilyTestimonials() {
  const [start, setStart] = React.useState(0);
  const len = testimonials.length;

  const visible = Array.from({ length: 3 }, (_, i) => testimonials[(start + i) % len]);

  const prev = () => setStart((s) => (s - 3 + len) % len);
  const next = () => setStart((s) => (s + 3) % len);

  return (
    <section id="testimonios-families" className="py-20 px-8 bg-white text-neutral-900">
      <div className="max-w-7xl mx-auto">
        <h2
          className="text-5xl font-bold text-center mb-12"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Lo que dicen nuestras familias
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
