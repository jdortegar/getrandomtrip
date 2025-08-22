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
      'Éramos 12 con ritmos y presupuestos distintos. No hubo fricciones: cada día tuvo “ese” momento en común.',
    author: 'Valentín R.',
    city: 'Mendoza',
  },
  {
    quote:
      'Offsite con foco en estrategia y team-bonding. Logística impecable y actividades con intención.',
    author: 'Carolina M.',
    city: 'Valle de Uco',
  },
  {
    quote:
      'Graduación sorpresa para 10. Aventura, playa y un cierre al atardecer que no vamos a olvidar.',
    author: 'Sofía P.',
    city: 'Bahía',
  },
  {
    quote:
      'Fuimos a fotografiar fauna y volvimos con historias. Los timings y permisos fueron clave.',
    author: 'Nicolás T.',
    city: 'Esteros',
  },
  {
    quote:
      'Retiros con pausa real. La curaduría de lugares, comida y silencios nos cambió el pulso.',
    author: 'Mariana A.',
    city: 'Sierras',
  },
  {
    quote:
      'Mesa larga, mercados y cocina local. La sorpresa estuvo en los detalles.',
    author: 'Germán C.',
    city: 'Salta',
  },
];

export default function GroupTestimonials() {
  const [start, setStart] = React.useState(0);
  const len = testimonials.length;
  const visible = Array.from({ length: 3 }, (_, i) => testimonials[(start + i) % len]);

  const prev = () => setStart((s) => (s - 3 + len) % len);
  const next = () => setStart((s) => (s + 3) % len);

  return (
    <section id="testimonios-group" className="py-20 px-8 bg-white text-neutral-900">
      <div className="max-w-7xl mx-auto">
        <h2
          className="text-5xl font-bold text-center mb-12"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Lo que dicen los grupos
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
