'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface JourneyHeroProps {
  backgroundImage?: string;
  className?: string;
  description?: string;
  fallbackImage?: string;
  subtitle?: string;
  title: string;
  videoSrc?: string;
}

function JourneyHeroVideoBackground({
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
    <div className="absolute inset-0 w-full h-full">
      {/* Fallback Image */}
      {fallbackImage && (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${fallbackImage})` }}
        />
      )}

      {/* Video Overlay - Only when ready */}
      {!hasError && videoSrc && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isVideoReady ? 'opacity-100' : 'opacity-0'
          }`}
          poster={fallbackImage}
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

export default function JourneyHero({
  backgroundImage,
  className,
  description,
  fallbackImage = '/images/bg-playa-mexico.jpg',
  subtitle,
  title,
  videoSrc = '/videos/hero-video-1.mp4',
}: JourneyHeroProps) {
  return (
    <section
      className={cn(
        'relative min-h-[40vh] flex items-center justify-center overflow-hidden',
        className,
      )}
    >
      {/* Video Background */}
      {videoSrc ? (
        <JourneyHeroVideoBackground
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
      <div className="relative z-10 mx-auto px-6 text-left text-white min-w-7/12">
        <p className="text-sm md:text-base font-bold mb-2 uppercase tracking-[0.4em]">
          PUNTO DE <span className="text-[#F2C53D]">PARTIDA</span>
        </p>

        <h1 className="text-7xl font-extrabold mb-6 font-barlow-condensed">
          {title}
        </h1>

        <p className="text-base">
          ¿<strong>Con quién</strong> vas a escribir tu próxima historia?
        </p>
      </div>
    </section>
  );
}
