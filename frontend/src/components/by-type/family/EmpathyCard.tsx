'use client';
import clsx from 'clsx';

export default function EmpathyCard({
  label,
  headline,
  support,
  color = 'bg-[#C77248]', // terracota
}: {
  label: string;
  headline: string;
  support: string;
  color?: string;
}) {
  return (
    <div
      className={clsx(
        'group relative rounded-2xl overflow-hidden shadow-lg',
        'transition-all duration-300 hover:shadow-xl',
        'ring-1 ring-black/5',
        // poster ratio
        'aspect-[2/3] w-full max-w-[260px]',
        color
      )}
    >
      {/* textura */}
      <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-15 mix-blend-soft-light pointer-events-none" />

      {/* Label centrado, se oculta en hover */}
      <div className="absolute inset-0 grid place-items-center px-4 transition-opacity duration-300 group-hover:opacity-0">
        <span className="text-white/95 font-semibold tracking-wide text-lg">
          {label}
        </span>
      </div>

      {/* Hover: headline + support */}
      <div className="absolute inset-0 flex flex-col justify-center px-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
        <h4 className="text-white font-bold text-lg leading-snug">{headline}</h4>
        <p className="mt-2 text-white/90 text-sm leading-relaxed">{support}</p>
      </div>

      {/* velo para legibilidad */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300" />
    </div>
  );
}
