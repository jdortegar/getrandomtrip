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
      'No elegimos un punto en el mapa; elegimos sorprendernos juntos. Fue el comienzo perfecto.',
    author: 'Sofía & Belu',
    city: 'Córdoba',
  },
  {
    quote:
      'Hubo detalles pensados para dos que hicieron la diferencia. Se sintió hecho a mano.',
    author: 'Valen & Tomi',
    city: 'Mendoza',
  },
  {
    quote:
      'El mejor regalo después del “sí”: tiempo sin fricción y momentos que todavía nombramos.',
    author: 'Carla & Nico',
    city: 'Buenos Aires',
  },
  {
    quote:
      'Playas, viñedos y un ritmo que fue nuestro. Volvimos con rituales nuevos.',
    author: 'Gaby & Leo',
    city: 'Montevideo',
  },
  {
    quote:
      'Nos dieron pistas y nosotros escribimos el resto. Intimidad y sorpresa, en partes justas.',
    author: 'Flor & Juan',
    city: 'Rosario',
  },
  {
    quote:
      'Nunca pensamos que el “después del sí” podía tener tanta magia. Gracias por el guion invisible.',
    author: 'Lau & Fede',
    city: 'Santiago',
  },
];

export default function HoneymoonTestimonials() {
  const [start, setStart] = React.useState(0);
  const len = testimonials.length;
  const perPage = 3;

  const visible = Array.from({ length: perPage }, (_, i) => testimonials[(start + i) % len]);

  const prev = () => setStart((s) => (s - perPage + len) % len);
  const next = () => setStart((s) => (s + perPage) % len);

  return (
    <section id="testimonios-honeymoon" className="py-20 px-8 bg-white text-neutral-900">
      <div className="max-w-7xl mx-auto">
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
            {Math.floor(start / perPage) + 1} / {Math.ceil(len / perPage)}
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
              <p className="text-lg italic text-neutral-700 mb-4">"{testimonial.quote}"</p>
              <p className="font-semibold text-neutral-900">{testimonial.author}</p>
              <p className="text-sm text-neutral-600">{testimonial.city}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
