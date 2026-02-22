'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const DEFAULT_DESCRIPTION = (
  <>
    ¿<strong>Con quién</strong> vas a escribir tu próxima historia?
  </>
);

const DEFAULT_SUBTITLE = (
  <>
    PUNTO DE <span className="text-[#F2C53D]">PARTIDA</span>
  </>
);

interface HeaderHeroProps {
  backgroundImage?: string;
  className?: string;
  description?: React.ReactNode;
  eyebrowColor?: string;
  fallbackImage?: string;
  subtitle?: React.ReactNode;
  title: string;
  videoSrc?: string;
}

function HeaderHeroVideoBackground({
  fallbackImage,
  videoSrc,
}: {
  fallbackImage?: string;
  videoSrc?: string;
}) {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setIsVideoReady(true);
    };

    const handleLoadedData = () => {
      setIsVideoReady(true);
    };

    const handleError = () => {
      setHasError(true);
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);

    const fallbackTimer = setTimeout(() => {
      if (!isVideoReady && !hasError) {
        setIsVideoReady(true);
      }
    }, 2000);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      clearTimeout(fallbackTimer);
    };
  }, [isVideoReady, hasError]);

  return (
    <div className="absolute inset-0 h-full w-full">
      {/* Fallback Image */}
      {fallbackImage && (
        <div
          className="absolute inset-0 h-full w-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${fallbackImage})` }}
        />
      )}

      {/* Video Overlay - Only when ready */}
      {!hasError && videoSrc && (
        <video
          ref={videoRef}
          autoPlay
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            isVideoReady ? 'opacity-100' : 'opacity-0'
          }`}
          loop
          muted
          playsInline
          poster={fallbackImage}
          preload="metadata"
        >
          <source src={videoSrc.replace('.mp4', '.webm')} type="video/webm" />
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
}

export default function HeaderHero({
  backgroundImage,
  className,
  description = DEFAULT_DESCRIPTION,
  eyebrowColor,
  fallbackImage = '/images/bg-playa-mexico.jpg',
  subtitle = DEFAULT_SUBTITLE,
  title,
  videoSrc = '/videos/hero-video-1.mp4',
}: HeaderHeroProps) {
  return (
    <section
      className={cn(
        'relative flex min-h-[40vh] items-center justify-center overflow-hidden',
        className,
      )}
    >
      {/* Video Background */}
      {videoSrc ? (
        <HeaderHeroVideoBackground
          fallbackImage={fallbackImage || backgroundImage}
          videoSrc={videoSrc}
        />
      ) : (
        <>
          {/* Fallback: Background Image */}
          {backgroundImage && (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${backgroundImage})` }}
            />
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40" />
        </>
      )}

      {/* Content */}
      <div className="relative z-10 mx-auto min-w-7/12 px-6 text-left text-white">
        <p
          className="mb-2 font-bold text-sm uppercase tracking-[0.4em] md:text-base"
          style={eyebrowColor ? { color: eyebrowColor } : undefined}
        >
          {subtitle}
        </p>

        <h1 className="mb-6 font-barlow-condensed text-7xl font-extrabold">
          {title}
        </h1>

        <p className="text-base">{description}</p>
      </div>
    </section>
  );
}
