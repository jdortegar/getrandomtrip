'use client';
import React from 'react';
import GetRandomtripCta from '@/components/common/GetRandomtripCta';

const benefits = [
  {
    title: 'Sin estrés y Flexible',
    description:
      'Decís cuánto querés gastar y cuándo; con opciones y filtros para adaptar la sorpresa a vos. Nosotros resolvemos lo demás.',
  },
  {
    title: 'Todo resuelto',
    description:
      'Pasajes y alojamientos alineados a tu presupuesto y estilo de viaje.',
  },
  {
    title: 'Descubrimiento auténtico',
    description:
      'Viví la emoción de lo inesperado con curaduría real, no al azar.',
  },
];

export default function BenefitsCardsOnly() {
  return (
    <div
      className="mx-auto max-w-5xl py-6 px-4 md:py-8"
      data-testid="benefits-cards-only"
    >
      <header className="mb-6 text-center md:mb-10">
        <p className="font-jost mb-6 text-lg italic text-gray-600 md:text-xl">
          Lo difícil es planificar. Lo inolvidable es viajar.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3 md:gap-8">
        {benefits.map((b) => (
          <div
            key={b.title}
            className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-white via-white to-gray-50/50 p-6 text-primary shadow-xl transition-all duration-500 hover:scale-[1.05] hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/20 md:p-8"
          >
            {/* Subtle glow on hover */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="relative z-10">
              <h4 className="font-caveat mb-3 text-2xl font-bold bg-gradient-to-br from-primary via-primary to-primary/80 bg-clip-text text-transparent md:mb-4 md:text-3xl">
                {b.title}
              </h4>
              <p className="font-jost text-sm leading-relaxed text-neutral-700 md:text-base">
                {b.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
