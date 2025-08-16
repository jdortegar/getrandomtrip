'use client';
import React from 'react';
import Image from "next/image";

const avatarUrl = (seed: string, size = 320) =>
  `https://i.pravatar.cc/${size}?u=${encodeURIComponent(seed)}`;

function TripperAvatar({ name }: { name: string }) {
  return (
    <div className="relative size-36 md:size-40 rounded-full ring-4 ring-slate-600/70 overflow-hidden bg-slate-200">
      <Image
        src={avatarUrl(name || 'tripper')}
        alt={name || 'Tripper'}
        fill
        sizes="160px"
        className="object-cover"
        loading="lazy"
      />
    </div>
  );
}

interface TripperCardProps {
  img: string;
  name: string;
  onClick: () => void;
}

const TripperCard: React.FC<TripperCardProps> = ({ img, name, onClick }) => (
  <div className="flex flex-col items-center text-center group cursor-pointer" onClick={onClick}>
    <TripperAvatar name={name} />
    <span
      className="mt-3 text-sm md:text-base font-semibold text-slate-800 text-center line-clamp-1"
      title={name || 'Tripper invitado'}
      aria-label={name || 'Tripper invitado'}
    >
      {name || 'Tripper invitado'}
    </span>
  </div>
);

export default TripperCard;