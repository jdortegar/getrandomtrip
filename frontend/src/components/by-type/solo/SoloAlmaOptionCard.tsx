'use client';

import React from 'react';

export default function SoloAlmaOptionCard({
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
  borderClass: string; // ej: "border-rose-400"
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
        'group relative overflow-hidden rounded-2xl aspect-[4/5] min-h-[260px] cursor-pointer',
        'transition will-change-transform hover:-translate-y-0.5 hover:shadow-lg',
        selected ? 'ring-2 ring-white/80' : 'ring-0',
      ].join(' ')}
    >
      <img
        src={
          img ||
          'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80'
        }
        alt={label}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
      {/* marco esquinas */}
      <div className={`absolute top-3 left-3 h-10 w-10 border-t-4 border-l-4 ${borderClass} opacity-80 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-3 right-3 h-10 w-10 border-b-4 border-r-4 ${borderClass} opacity-80 group-hover:opacity-100 transition-opacity`} />

      {/* check seleccionada */}
      {selected && (
        <div className="absolute top-3 right-3 rounded-full bg-white/90 p-1 shadow">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-4">
        <span className="inline-block rounded bg-black/55 px-3 py-1 text-sm font-semibold text-white backdrop-blur">
          {label}
        </span>
        {desc && (
          <p
            data-testid={`solo-option-desc-${opKey}`}
            className="mt-2 text-xs text-white/90 leading-relaxed line-clamp-3"
          >
            {desc}
          </p>
        )}
      </div>
    </div>
  );
}
