'use client';
import Image from 'next/image';
import Link from 'next/link';

interface HeroProps {
  data: {
    heroTitle: string;
    subcopy: string;
    images: {
      hero: string;
    };
    palette: {
      primary: string;
      secondary: string;
      accent: string;
      text: string;
    };
  };
}

const isSvg = (src: string) => src?.toLowerCase?.().endsWith('.svg');

export default function Hero({ data }: HeroProps) {
  const { heroTitle, subcopy, images, palette } = data;

  return (
    <section
      className="relative h-[60vh] md:h-[80vh] flex items-center justify-center text-white overflow-hidden"
      style={{ backgroundColor: palette.secondary }}
    >
      <Image
        src={images.hero}
        alt={heroTitle}
        fill
        className="object-cover object-center opacity-50"
        priority
        {...(isSvg(images.hero) ? { unoptimized: true } : {})}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      <div className="relative z-10 text-center px-4 max-w-4xl">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4" style={{ color: palette.primary }}>
          {heroTitle}
        </h1>
        <p className="text-lg md:text-xl mb-8" style={{ color: palette.primary }}>
          {subcopy}
        </p>
        <Link
          href="#levels"
          className="rt-button"
          style={{ backgroundColor: palette.accent, color: palette.secondary }}
        >
          Empieza tu Ruta con Alma
        </Link>
      </div>
    </section>
  );
}
