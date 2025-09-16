'use client';
import React from 'react';
import GetRandomtripCta from '@/components/common/GetRandomtripCta';

const benefits = [
  { title: 'Sin estrés y Flexible', description: 'Decís cuánto querés gastar y cuándo; con opciones y filtros para adaptar la sorpresa a vos. Nosotros resolvemos lo demás.' },
  { title: 'Todo resuelto', description: 'Pasajes y alojamientos alineados a tu presupuesto y estilo de viaje.' },
  { title: 'Descubrimiento auténtico', description: 'Viví la emoción de lo inesperado con curaduría real, no al azar.' },
];

export default function BenefitsCardsOnly() {
  return (
    <div className="py-6">
      <header className="text-center mb-8">
        <h3 className="text-3xl md:text-5xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
          Beneficios clave
        </h3>
        <p className="mt-2 text-neutral-600">Lo difícil es planificar. Lo inolvidable es viajar.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        {benefits.map((b) => (
          <div key={b.title} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h4 className="text-xl md:text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>{b.title}</h4>
            <p className="text-neutral-600">{b.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <GetRandomtripCta align="center" />
      </div>
    </div>
  );
}
