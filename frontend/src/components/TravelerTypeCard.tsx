// frontend/src/components/TravelerTypeCard.tsx
'use client';
import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface TravelerTypeCardProps {
  title: string;
  description: string;
  imageUrl: string;
  onClick: () => void;
}

const TravelerTypeCard: React.FC<TravelerTypeCardProps> = ({ title, description, imageUrl, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      onClick={onClick}
      className="relative h-[60vh] sm:h-[450px] md:h-[400px] w-full cursor-pointer group overflow-hidden rounded-xl shadow-xl" // Añadimos rounded-xl y shadow-xl
    >
      <Image
        src={imageUrl || '/images/fallback.jpg'} // Fallback por si la URL es vacía o nula
        alt={title}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        style={{ objectFit: 'cover' }}
        className="transition-transform duration-700 ease-in-out group-hover:scale-105"
      />
      {/* Overlay más sutil para mejor contraste */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white z-10"> {/* Añadimos z-10 para asegurar que el texto esté encima */}
        <h3 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
          {title}
        </h3>
        <p className="mt-2 text-base md:text-lg text-gray-200" style={{ fontFamily: 'Inter, sans-serif' }}>{description}</p>
      </div>
    </motion.div>
  );
};

export default TravelerTypeCard;