'use client';

import React from 'react';

type Testimonial = {
  quote: string;
  author: string;
  city: string;
};

const testimonials: Testimonial[] = [
  {
    quote:
      'Mi primer viaje solo y me sentí acompañado por una organización impecable. Volví distinto.',
    author: 'Martín S.',
    city: 'Buenos Aires',
  },
  {
    quote:
      'La sorpresa fue un regalo. Me encontré con lugares y personas que no esperaba.',
    author: 'Camila R.',
    city: 'Montevideo',
  },
  {
    quote:
      'Itinerario flexible y seguro. Pude moverme a mi ritmo sin perderme lo esencial.',
    author: 'Diego P.',
    city: 'Santiago',
  },
  {
    quote:
      'Me animé a probar cosas nuevas. Gran equilibrio entre actividad y calma.',
    author: 'Luisa G.',
    city: 'Córdoba',
  },
  {
    quote:
      'La curaduría me hizo sentir protagonista del viaje, no espectador.',
    author: 'Tomás L.',
    city: 'Mendoza',
  },
  {
    quote:
      'Volví con historias que me dieron ganas de seguir viajando solo.',
    author: 'Ivana Q.',
    city: 'Rosario',
  },
];

export default function SoloTestimonials() {
  const [start, setStart] = React.useState(0);
  const len = testimonials.length;

  const visible = Array.from({ length: 3 }, (_, i) => testimonials[(start + i) % len]);

  const prev = () => setStart((s) => (s - 3 + len) % len);
  const next = () => setStart((s) => (s + 3) % len);

  return (
    <section id="testimonios-solo" className="py-20 px-8 bg-white text-neutral-900">
      <div className="max-w-7xl mx-auto">
        <h2
          className="text-5xl font-bold text-center mb-12"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Lo que dicen quienes viajaron solos
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
          {visible.map((t, idx) => (
            <div key={`${t.author}-${idx}`} className="bg-neutral-100 p-8 rounded-lg shadow-lg">
              <p className="text-lg italic text-neutral-700 mb-4">"{t.quote}"</p>
              <p className="font-semibold text-neutral-900">{t.author}</p>
              <p className="text-sm text-neutral-600">{t.city}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
