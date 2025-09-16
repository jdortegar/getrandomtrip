'use client';

import { useEffect, useState } from 'react';
import Img from '@/components/common/Img'; // Added import

type Props = {
  images?: string[];
  interval?: number;
  /** 0..1 intensidad del scrim (0.55 por defecto) */
  scrim?: number;
};

const DEFAULTS = [
  '/images/bg/1.jpg',
  '/images/bg/2.jpg',
  '/images/bg/3.jpg',
];

export default function BgCarousel({
  images = DEFAULTS,
  interval = 6000,
  scrim = 0.55,
}: Props) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), interval);
    return () => clearInterval(t);
  }, [interval, images.length]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      {images.map((src, i) => (
        <Img
          key={src + i}
          src={src}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ${
            i === idx ? 'opacity-100' : 'opacity-0'
          }`}
          width={1920} // Assuming a common background image width
          height={1080} // Assuming a common background image height
        />
      ))}

      {/* Scrim principal: lineal vertical */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg,
            rgb(0 0 0 / ${scrim * 0.80}) 0%,
            rgb(0 0 0 / ${scrim * 0.70}) 30%,
            rgb(0 0 0 / ${scrim * 0.50}) 60%,
            rgb(0 0 0 / ${scrim * 0.35}) 100%)`,
        }}
        aria-hidden
      />

      {/* Scrim radial suave para bordes */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(100% 60% at 50% 40%, rgb(0 0 0 / 0) 0%, rgb(0 0 0 / 0.35) 100%)',
        }}
        aria-hidden
      />
    </div>
  );
}