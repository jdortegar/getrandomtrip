// frontend/src/components/TripperCard.tsx
'use client';
import React from 'react';
import Image from 'next/image'; // Importar Image de next/image
import { motion } from 'framer-motion';

interface TripperCardProps {
  img: string;
  name: string;
  onClick: () => void;
}

const TripperCard: React.FC<TripperCardProps> = ({ img, name, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    className="flex flex-col items-center text-center group cursor-pointer p-4 bg-white rounded-xl shadow-lg" // Añadimos padding
    onClick={onClick}
  >
    <Image
      src={img || '/images/fallback.jpg'} // Fallback
      alt={name}
      width={160} // Ajusta el tamaño para que sea similar a w-40 h-40
      height={160}
      className='rounded-full object-cover border-4 border-gray-700 group-hover:border-[#D4AF37] transition-colors duration-300'
    />
    <h3 className='mt-4 text-xl font-semibold text-gray-900' style={{ fontFamily: 'Inter, sans-serif' }}>{name}</h3>
  </motion.div>
);

export default TripperCard;