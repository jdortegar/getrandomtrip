'use client';
import React from 'react';

interface TripperCardProps {
  img: string;
  name: string;
  onClick: () => void;
}

const TripperCard: React.FC<TripperCardProps> = ({ img, name, onClick }) => (
  <div className="flex flex-col items-center text-center group cursor-pointer" onClick={onClick}>
    <img src={img} alt={name} className='w-40 h-40 rounded-full object-cover border-4 border-gray-700 group-hover:border-[#D4AF37] transition-colors duration-300'/>
    <h3 className='mt-4 text-xl font-semibold text-white'>{name}</h3>
  </div>
);

export default TripperCard;