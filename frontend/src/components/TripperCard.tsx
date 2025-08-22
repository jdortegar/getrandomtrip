'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type TripperCardProps = {
  name: string;
  img: string;
  slug: string;
  bio?: string;
};

export default function TripperCard({ name, img, slug, bio = 'Bio coming soon.' }: TripperCardProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const panelId = `bio-panel-${slug}`;

  return (
    <div className="max-w-[280px] w-full mx-auto">
      {/* Foto + Nombre (clic navega al perfil del tripper) */}
      <button
        type="button"
        onClick={() => router.push(`/packages/${slug}`)}
        className="block w-full text-left group focus:outline-none"
        aria-label={`Ir al perfil de ${name}`}
      >
        <div className="aspect-[4/3] w-full overflow-hidden rounded-md">
          <img
            src={img}
            alt={name}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition"
            loading="lazy"
          />
        </div>
        <div className="mt-3 text-center">
          <h3 className="text-lg font-serif italic text-gray-900">{name}</h3>
        </div>
      </button>

      {/* Separador + READ BIO */}
      <div className="mt-3 border-t border-gray-200 pt-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="w-full flex items-center justify-between text-sm tracking-wide text-gray-800 hover:text-gray-900"
        >
          <span className="uppercase">READ BIO</span>
          <span className="text-xl leading-none select-none">{open ? '–' : '+'}</span>
        </button>

        {/* Panel del acordeón */}
        <div
          id={panelId}
          className={`overflow-hidden transition-all ${open ? 'mt-3 max-h-96' : 'max-h-0'}`}
        >
          <p className="text-sm text-gray-600 leading-relaxed">
            {bio}
          </p>
        </div>
      </div>
    </div>
  );
}