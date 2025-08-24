'use client';
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
  videoSrc?: string;
  posterSrc?: string;
  titleOverride?: string;
  subtitleOverride?: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
  badges?: string[];
  introTitle?: string;
  introParagraphs?: string[];
}

export default function Hero({ data, videoSrc, posterSrc, titleOverride, subtitleOverride, primaryCtaLabel, secondaryCtaLabel, badges, introTitle, introParagraphs }: HeroProps) {
  const { heroTitle, subcopy, images, palette } = data;

  return (
    <section
      className="relative h-[60vh] md:h-[80vh] flex items-center justify-center text-white overflow-hidden"
      style={{ backgroundColor: palette.secondary }}
    >
      {videoSrc && (
        <>
          <video
            className="absolute inset-0 h-full w-full object-cover pointer-events-none"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={posterSrc}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/35" />
        </>
      )}
      <div className="relative z-10 text-center px-4 max-w-4xl">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4" style={{ color: palette.primary }}>
          {titleOverride || heroTitle}
        </h1>
        <p className="text-lg md:text-xl mb-8" style={{ color: palette.primary }}>
          {subtitleOverride || subcopy}
        </p>
        {badges && badges.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {badges.map((badge, index) => (
              <span key={index} className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">
                {badge}
              </span>
            ))}
          </div>
        )}
        <div className="flex justify-center gap-4">
          <Link
            href="#levels"
            className="rt-button"
            style={{ backgroundColor: palette.accent, color: palette.secondary }}
          >
            {primaryCtaLabel || "Empieza tu Ruta con Alma"}
          </Link>
          {secondaryCtaLabel && (
            <Link
              href="#inspiracion" // Assuming a generic inspiration section ID
              className="rt-button rt-button-outline"
              style={{ borderColor: palette.accent, color: palette.accent }}
            >
              {secondaryCtaLabel}
            </Link>
          )}
        </div>
      </div>
      {introTitle && introParagraphs && introParagraphs.length > 0 && (
        <div className="absolute bottom-0 right-0 p-8 max-w-sm bg-black/50 text-white text-left hidden md:block">
          <h3 className="text-2xl font-bold mb-4">{introTitle}</h3>
          {introParagraphs.map((paragraph, index) => (
            <p key={index} className="mb-2 text-sm">{paragraph}</p>
          ))}
        </div>
      )}
    </section>
  );
}