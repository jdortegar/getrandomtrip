'use client';
import React from 'react';
import Image from 'next/image';

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
    <div onClick={onClick} className="relative h-96 rounded-lg overflow-hidden shadow-lg group cursor-pointer bg-gray-800">
        <Image src={item.bg} alt={item.title} fill style={{ objectFit: 'cover' }} className="transform group-hover:scale-110 transition-transform duration-500 opacity-80" />
        <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center space-x-3">
                <div className="relative">
                    <Image src={item.profileImg} alt={item.author} width={64} height={64} className="rounded-full object-cover border-2 border-[#D4AF37]" />
                    <div className="absolute -bottom-1 -right-1 bg-[#D4AF37] text-gray-900 text-[8px] font-bold px-1 rounded-sm">#TRIPPERVERIFIED</div>
                </div>
                <div>
                    <p className="font-bold text-md leading-tight text-white">Tripper’s Decode: {item.title}</p>
                    <p className="text-gray-300 text-sm">by {item.author}</p>
                </div>
            </div>
        </div>
    </div>
);

export default DecodeResultCard;