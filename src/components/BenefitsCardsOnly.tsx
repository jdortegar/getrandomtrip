'use client';
import React from 'react';
import { motion } from 'framer-motion';
import Img from '@/components/common/Img';

interface StepCard {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
}

const STEPS: StepCard[] = [
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

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  }),
};

export default function BenefitsCardsOnly() {
  return (
    <div className="grid gap-10 md:grid-cols-3 w-full max-w-screen-xl mx-auto px-20">
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
