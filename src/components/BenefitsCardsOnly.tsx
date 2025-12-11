'use client';

import React from 'react';
import ThreeColumns, { type ThreeColumnsItem } from '@/components/ThreeColumns';

const STEPS: ThreeColumnsItem[] = [
  {
    title: 'sin stress y flexible',
    description:
      'Decís cuánto querés gastar y cuándo; con opciones y filtros para adaptar la sorpresa a vos. Nosotros resolvemos lo demás.',
    imageSrc: '/images/benefits-1.png',
    imageAlt: 'Road through green forest',
  },
  {
    title: 'Todo resuelto',
    description:
      'Pasajes y alojamientos alineados a tu presupuesto y estilo de viaje.',
    imageSrc: '/images/benefits-2.png',
    imageAlt: 'Airplane interior at night',
  },
  {
    title: 'descubrimiento auténtico',
    description:
      'Viví la emoción de lo inesperado con curaduría real, no al azar.',
    imageSrc: '/images/benefits-3.png',
    imageAlt: 'Airplane window view',
  },
];

export default function BenefitsCardsOnly() {
  return <ThreeColumns items={STEPS} gap="lg" />;
}
