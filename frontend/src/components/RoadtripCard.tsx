'use client';
import React from 'react';

interface RoadtripCardProps {
  icon: string;
  title: string;
  description: string;
  bgImage: string;
  onClick: () => void;
}

const RoadtripCard: React.FC<RoadtripCardProps> = ({ icon, title, description, bgImage, onClick }) => (
    <div onClick={onClick} className="relative h-96 rounded-lg overflow-hidden shadow-lg group cursor-pointer">
        <img src={bgImage} alt={title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-t from-black/80 to-transparent text-center">
            <div className="text-6xl mb-4">{icon}</div>
            <h3 className="text-4xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>{title}</h3>
            <p className="text-lg text-gray-200 mt-2">{description}</p>
        </div>
    </div>
);

export default RoadtripCard;
