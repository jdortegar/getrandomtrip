'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Img from '@/components/common/Img';
import { cn } from '@/lib/utils';

interface StepCard {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
}

const STEPS: StepCard[] = [
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

const cardVariants = {
  hidden: { y: 60, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      delay: i * 0.2,
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  }),
};

export default function HowItWorks() {
  return (
    <div className="grid gap-4 md:grid-cols-3 w-full container mx-auto px-20">
      {STEPS.map((step, index) => (
        <motion.div
          key={step.title}
          className="flex flex-col"
          custom={index}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          {/* Image */}
          <div className="relative w-full overflow-hidden aspect-4/3 rounded-lg">
            <Img
              alt={step.imageAlt}
              className="h-full w-full object-cover"
              height={400}
              src={step.imageSrc}
              width={600}
            />
          </div>

          {/* Content */}
          <div className="flex flex-col gap-3 p-6 text-center">
            <h3 className="font-barlow text-xl font-bold uppercase text-[#282828]">
              {step.title}
            </h3>
            <p
              className="font-barlow text-lg text-[#888]"
              dangerouslySetInnerHTML={{
                __html: step.description,
              }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
