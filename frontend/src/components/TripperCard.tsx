'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type TripperCardProps = {
  name: string;
  img: string;
  slug: string;
  bio?: string;
};

export default function TripperCard({ name, img, slug, bio }: TripperCardProps) {
  const [open, setOpen] = useState(false);
  const bioId = `bio-${slug}`;

  return (
    <div className="group rounded-2xl overflow-hidden shadow-xl bg-white">
      {/* Foto + nombre: llevan a la landing del tripper */}
      <Link href={`/packages/${slug}`} className="block">
        <div className="relative w-full pt-[66%]">
          <Image
            src={img}
            alt={name}
            fill
            sizes="(min-width:1024px) 220px, (min-width:768px) 33vw, 50vw"
            className="object-cover transition-all duration-500 filter sepia group-hover:sepia-0"
            priority={false}
          />
        </div>
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-sm md:text-base font-medium text-gray-900">
            {name}
          </h3>
        </div>
      </Link>

      {/* Toggle: BIO + (no navega) */}
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          aria-expanded={open}
          aria-controls={bioId}
          className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-gray-500 hover:text-gray-900"
        >
          <span>Bio</span>
          <span
            className={`transition-transform ${open ? 'rotate-45' : ''}`}
            aria-hidden
          >
            +
          </span>
        </button>

        {/* Mini-bio inline */}
        <div
          id={bioId}
          className={`overflow-hidden transition-all duration-300 ${
            open ? 'mt-2 max-h-40' : 'max-h-0'
          }`}
        >
          <p className="text-sm leading-relaxed text-gray-700">
            {bio ?? 'Pronto...'}
          </p>
        </div>
      </div>
    </div>
  );
}