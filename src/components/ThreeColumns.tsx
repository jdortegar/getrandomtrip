'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Img from '@/components/common/Img';

export interface ThreeColumnsItem {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
}

interface ThreeColumnsProps {
  items: ThreeColumnsItem[];
}

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

export default function ThreeColumns({ items }: ThreeColumnsProps) {
  return (
    <div className={`grid gap-4 md:grid-cols-3 w-full container mx-auto px-20`}>
      {items.map((item, index) => (
        <motion.div
          key={item.title}
          className="flex flex-col"
          custom={index}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          {/* Image */}
          <div className="relative w-full overflow-hidden aspect-4/3 rounded-lg">
            <Img
              alt={item.imageAlt}
              className="h-full w-full object-cover"
              height={400}
              src={item.imageSrc}
              width={600}
            />
          </div>

          {/* Content */}
          <div className="flex flex-col gap-3 p-6 text-center">
            <h3 className="font-barlow text-xl font-bold uppercase text-[#282828]">
              {item.title}
            </h3>
            <p
              className="font-barlow text-lg text-[#888]"
              dangerouslySetInnerHTML={{
                __html: item.description,
              }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
