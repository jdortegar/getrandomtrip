'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HERO_CONTENT, HERO_CONFIG } from '@/lib/data/constants/hero';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// HeroVideoBackground Component
function HeroVideoBackground() {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Preload video for better performance
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      console.log('Video can play - setting ready');
      setIsVideoReady(true);
    };

    const handleLoadedData = () => {
      console.log('Video loaded data - setting ready');
      setIsVideoReady(true);
    };

    const handleError = (e: Event) => {
      console.log('Video error:', e);
      setHasError(true);
    };

    // Add multiple event listeners for better compatibility
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);

    // Fallback: set ready after 2 seconds if no events fire
    const fallbackTimer = setTimeout(() => {
      if (!isVideoReady && !hasError) {
        console.log('Video fallback - setting ready after timeout');
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
      {/* Fallback Image - Always visible as background */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${HERO_CONFIG.FALLBACK_IMAGE})` }}
      />

      {/* Video Overlay - Only when ready */}
      {!hasError && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isVideoReady ? 'opacity-100' : 'opacity-0'
          }`}
          poster={HERO_CONFIG.FALLBACK_IMAGE}
          onLoadStart={() => console.log('Video load started')}
          onLoadedMetadata={() => console.log('Video metadata loaded')}
          onCanPlay={() => console.log('Video can play event')}
          onLoadedData={() => console.log('Video loaded data event')}
          onError={(e) => console.log('Video error event:', e)}
        >
          <source
            src={HERO_CONFIG.VIDEO_SRC.replace('.mp4', '.webm')}
            type="video/webm"
          />
          <source src={HERO_CONFIG.VIDEO_SRC} type="video/mp4" />
        </video>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
}

// Main Hero Component
const Hero: React.FC = () => {
  return (
    <section
      id="home-hero"
      className="relative h-screen flex flex-col items-center justify-center text-center overflow-hidden"
    >
      <HeroVideoBackground />
      <div className="relative z-10 max-w-5xl mx-auto px-4">
        <h2 className="font-caveat text-7xl font-bold leading-tight text-white mb-4">
          {HERO_CONTENT.TITLE}
        </h2>

        <p className="font-jost text-xl font-normal leading-relaxed text-gray-300 max-w-4xl mx-auto mb-8">
          {HERO_CONTENT.SUBTITLE}
        </p>

        <p className="font-jost text-lg font-normal leading-relaxed text-gray-300 max-w-2xl mx-auto mb-8">
          {HERO_CONTENT.TAGLINE}
        </p>

        <Button
          asChild
          aria-label={HERO_CONTENT.CTA_ARIA_LABEL}
          variant="outline"
          size="lg"
          className="mt-8 uppercase tracking-wider animate-pulse-once"
        >
          <Link href={HERO_CONTENT.CTA_HREF} scroll={true}>
            {HERO_CONTENT.CTA_TEXT}
          </Link>
        </Button>
      </div>

      {/* Scroll Indicator positioned at bottom */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div
          className="scroll-indicator pointer-events-none select-none z-10 text-white"
          aria-hidden="true"
        >
          {HERO_CONTENT.SCROLL_TEXT}
        </div>
      </div>
    </section>
  );
};

export default Hero;
