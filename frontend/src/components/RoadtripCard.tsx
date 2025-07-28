// frontend/src/components/RoadtripCard.tsx
'use client';
import React from 'react';
import Image from 'next/image'; // Importar Image de next/image
import { motion } from 'framer-motion';

interface RoadtripCardProps {
  icon: string;
  title: string;
  description: string;
  bgImage: string;
  onClick: () => void;
}

const RoadtripCard: React.FC<RoadtripCardProps> = ({ icon, title, description, bgImage, onClick }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        onClick={onClick}
        className="relative h-96 rounded-xl overflow-hidden shadow-xl group cursor-pointer" // Añadimos rounded-xl
    >
        <Image // Usar componente Image de Next.js
            src={bgImage || '/images/fallback.jpg'} // Fallback
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
            className="transition-transform duration-700 group-hover:scale-110 opacity-90" // Ajustamos opacity
        />
        {/* Overlay más sutil */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white z-10"> {/* Añadimos z-10 */}
            <div className="text-5xl md:text-6xl mb-2">{icon}</div> {/* Tamaño de ícono ajustado */}
            <h3 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>{title}</h3>
            <p className="text-base md:text-lg text-gray-200 mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>{description}</p>
        </div>
    </motion.div>
);

export default RoadtripCard;