'use client';

import React from 'react';
import Img from '@/components/common/Img';

export default function ExcuseOptionCard({
  opKey,
  label,
  desc,
  img,
  selected,
  onToggle,
  borderClass,
}: {
  opKey: string;
  label: string;
  desc?: string;
  img?: string;
  selected?: boolean;
  onToggle: () => void;
  borderClass: string;
}) {
  return (
    <div
      role="checkbox"
      aria-checked={!!selected}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      className={[
        'group relative overflow-hidden rounded-md aspect-square cursor-pointer',
        'transition-all duration-300 will-change-transform hover:-translate-y-0.5 hover:shadow-lg',
        selected ? 'ring-4 ring-primary shadow-xl ' : 'ring-0',
      ].join(' ')}
    >
      <Img
        alt={label}
        className="absolute inset-0 h-full w-full object-cover"
        height={1500}
        src={
          img ||
          'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80'
        }
        width={1200}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />

      {/* Check si está seleccionada */}
      {selected && (
        <div className="absolute top-3 right-3 rounded-md bg-primary p-2 shadow-lg border-2 border-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 6L9 17l-5-5"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-4">
        <span className="inline-block rounded-md text-sm font-semibold text-white font-jost">
          {label}
        </span>
        {desc && (
          <p className="mt-2 text-sm text-white/90 leading-relaxed line-clamp-3 font-jost">
            {desc}
          </p>
        )}
      </div>
    </div>
  );
}
