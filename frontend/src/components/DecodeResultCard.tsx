// frontend/src/components/DecodeResultCard.tsx
'use client';
import React from 'react';
import Image from 'next/image'; // Importar Image de next/image
import { motion } from 'framer-motion';

interface DecodeResultCardProps {
  item: {
    bg: string;
    profileImg: string;
    title: string;
    author: string;
  };
  onClick: () => void;
}

const DecodeResultCard: React.FC<DecodeResultCardProps> = ({ item, onClick }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        onClick={onClick}
        className="relative h-96 rounded-xl overflow-hidden shadow-lg group cursor-pointer bg-gray-800" // Añadimos rounded-xl
    >
        <Image // Usar componente Image de Next.js
            src={item.bg || '/images/fallback.jpg'} // Fallback
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
            className="transition-transform duration-500 group-hover:scale-110 opacity-80" // Ajustamos opacity
        />
        {/* Overlay más sutil */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10"> {/* Añadimos z-10 */}
            <div className="flex items-center space-x-3">
                <div className="relative">
                    <Image src={item.profileImg || '/images/fallback.jpg'} alt={item.author} width={64} height={64} className="rounded-full object-cover border-2 border-[#D4AF37]" />
                    <div className="absolute -bottom-1 -right-1 bg-[#D4AF37] text-gray-900 text-[8px] font-bold px-1 py-0.5 rounded-sm uppercase">#TRIPPERVERIFIED</div> {/* Ajustamos padding/font size */}
                </div>
                <div>
                    <p className="font-bold text-lg leading-tight text-white" style={{ fontFamily: 'Playfair Display, serif' }}>Tripper’s Decode: {item.title}</p>
                    <p className="text-gray-300 text-sm mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>by {item.author}</p>
                </div>
            </div>
        </div>
    </motion.div>
);

export default DecodeResultCard;