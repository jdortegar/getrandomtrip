'use client';

import React from 'react';
import ThreeColumns, { type ThreeColumnsItem } from '@/components/ThreeColumns';

const STEPS: ThreeColumnsItem[] = [
  {
    title: 'PLANIFICÁ',
    description:
      'Viví lo inesperado sin improvisar. Nosotros diseñamos tu viaje y te revelamos el <strong>destino 48h antes.</strong>',
    imageSrc: '/images/how-it-works-1.png',
    imageAlt: 'Road through green forest',
  },
  {
    title: 'RECIBÍ LA SORPRESA',
    description:
      'Confirmá tu viaje. Te revelamos el destino 48 h antes y te enviamos la guía para ese mood.',
    imageSrc: '/images/how-it-works-2.png',
    imageAlt: 'Airplane interior at night',
  },
  {
    title: 'VIAJÁ SIN STRESS',
    description:
      'Hacé la valija. Pasajes y alojamiento listos; soporte humano cuando lo necesites.',
    imageSrc: '/images/how-it-works-3.png',
    imageAlt: 'Airplane window view',
  },
];

export default function HowItWorks() {
  return <ThreeColumns items={STEPS} gap="sm" />;
}
