'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type TripperCardProps = {
  name: string;
  imageUrl: string;
  href: string;
  bio?: string;
  instagramUrl?: string;
  className?: string;
};

export default function TripperCard({
  name,
  imageUrl,
  href,
  instagramUrl = 'instagram',
  className,
}: TripperCardProps) {
  return (
    <Link href={`/trippers/${href}`} className="block relative">
      <div
        className={cn(
          'group rounded-lg overflow-hidden shadow-xl bg-white aspect-[269/230] w-full relative block origin-center',
          className,
        )}
      >
        <div className="relative w-full h-full">
          <Image
            src={imageUrl}
            alt={name}
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
          <div className="absolute bottom-0 left-0 z-20 w-full text-left text-white px-8 py-6 bg-gradient-to-t from-black/70 to-transparent">
            <h3 className="font-barlow-condensed text-4xl font-extrabold uppercase break-words whitespace-normal">
              {name}
            </h3>
            <div className="flex justify-between text-base text-white/90">
              <span>{`@${instagramUrl}`}</span>
              <span>Bio +</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
