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
    <div className="py-6">
      <header className="text-center mb-8">
        <p className="text-center text-gray-600  italic font-jost text-lg mb-6">
          Lo difícil es planificar. Lo inolvidable es viajar.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        {benefits.map((b) => (
          <div
            key={b.title}
            className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm text-primary"
          >
            <h4 className="text-xl md:text-2xl font-bold mb-2 font-caveat">
              {b.title}
            </h4>
            <p className="text-sm text-neutral-700 leading-relaxed font-jost">
              {b.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
