'use client';

import Image from 'next/image';
import Link from 'next/link';



type TripperCardProps = {
  name: string;
  img: string;
  slug: string;
};

export default function TripperCard({ name, img, slug }: TripperCardProps) {
  

  return (
    <Link
      href={`/packages/${slug}`}
      className="relative group rounded-2xl overflow-hidden shadow-xl hover:scale-[1.03] transition-all bg-white text-gray-900"
    >
      {/* ✨ Contenedor con altura (3:2) y relative para <Image fill /> */}
      <div className="relative w-full pt-[66%]"> 
        <Image
          src={img || '/images/fallback.jpg'}
          alt={name}
          fill
          className="object-cover"
          sizes="(min-width:1024px) 20vw, (min-width:768px) 30vw, 50vw"
          priority={false}
        />
      </div>

      {/* cuerpo de la tarjeta */}
      <div className="p-3">
        <h3 className="font-semibold">{name}</h3>
        {/* mantiene el resto tal cual (read bio, etc.) */}
      </div>
    </Link>
  );
}