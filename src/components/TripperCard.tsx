'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AvatarWithFallback from '@/components/ui/AvatarWithFallback';

type TripperCardProps = {
  name: string;
  img: string;
  slug: string;
  bio?: string;
};

export default function TripperCard({
  name,
  img,
  slug,
  bio,
}: TripperCardProps) {
  const [open, setOpen] = useState(false);
  const bioId = `bio-${slug}`;

  return (
    <div className="group rounded-md overflow-hidden shadow-xl bg-white">
      {/* Foto + nombre: llevan a la landing del tripper */}
      <Link href={`/trippers/${slug}`} className="block relative">
        <div className="relative w-full h-64">
          {img && img !== '/images/fallback.jpg' ? (
            <Image
              src={img}
              alt={name}
              fill
              sizes="(min-width:1024px) 220px, (min-width:768px) 33vw, 50vw"
              className="object-cover transition-all duration-500 filter grayscale group-hover:grayscale-0"
              priority={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <AvatarWithFallback
                src={img}
                alt={name}
                size="xl"
                className="w-full h-full rounded-none"
                fallbackClassName="w-full h-full rounded-none bg-gradient-to-br from-primary/20 to-primary/40"
              />
            </div>
          )}
          {/* Text overlay on bottom part of image */}
          <div className="absolute bottom-0 left-0 right-0 text-white bg-gradient-to-t from-black/70 to-transparent p-4 ">
            <h3 className="font-caveat text-2xl font-bold ">{name}</h3>
            <div className="mt-1 gap-2 text-[11px] uppercase tracking-wide text-center ">
              Bio +
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
