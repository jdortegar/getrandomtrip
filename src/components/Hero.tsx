'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export interface HeroContent {
  title: string;
  subtitle: string;
  tagline?: string;
  features: Array<{
    highlight: string;
    label: string;
  }>;
  primaryCta: {
    text: string;
    href: string;
    sectionId: string;
  };
  secondaryCta?: {
    text: string;
    href: string;
    sectionId: string;
  };
}

interface HeroVideoConfig {
  webmSrc: string;
  mp4Src: string;
  fallbackImage: string;
  poster: string;
}

interface HeroProps {
  content: HeroContent;
  videoConfig: HeroVideoConfig;
  id: string;
  className?: string;
}

// Hero Video Background Component
function HeroVideoBackground({
  videoConfig,
}: {
  videoConfig: HeroVideoConfig;
}) {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => setIsVideoReady(true);
    const handleLoadedData = () => setIsVideoReady(true);
    const handleError = () => setHasError(true);

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
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${videoConfig.fallbackImage})`,
        }}
      />

      {/* Video Overlay */}
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
          poster={videoConfig.poster}
        >
          <source src={videoConfig.webmSrc} type="video/webm" />
          <source src={videoConfig.mp4Src} type="video/mp4" />
        </video>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
}

export default function Hero({
  content,
  videoConfig,
  id,
  className,
}: HeroProps) {
  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section
      id={id}
      className="relative h-screen flex flex-col items-center justify-center text-center overflow-hidden"
    >
      <HeroVideoBackground videoConfig={videoConfig} />

      {/* Main Content - Centered like home page */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        <h1 className="font-caveat text-7xl font-bold leading-tight text-white mb-6">
          {content.title}
        </h1>

        <p className="font-jost text-xl font-normal leading-relaxed text-white max-w-4xl mx-auto mb-6">
          {content.subtitle}
        </p>

        {/* {content.tagline && (
          <p className="font-jost text-lg font-normal leading-relaxed text-gray-300 max-w-2xl mx-auto mb-8">
            {content.tagline}
          </p>
        )} */}

        {/* Feature Highlights */}
        <div className="flex flex-wrap gap-8 mb-8 justify-center">
          {content.features.map((feature) => (
            <div
              className="font-jost text-sm text-white text-center"
              key={feature.label}
            >
              {feature.label}
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            asChild
            size="lg"
            onClick={() => handleScrollToSection(content.primaryCta.sectionId)}
          >
            <Link href={content.primaryCta.href}>
              {content.primaryCta.text} →
            </Link>
          </Button>

          {content.secondaryCta && (
            <Button
              asChild
              variant="outline"
              size="lg"
              onClick={() =>
                handleScrollToSection(content.secondaryCta!.sectionId)
              }
            >
              <Link href={content.secondaryCta.href}>
                {content.secondaryCta.text} →
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div
          className="scroll-indicator pointer-events-none select-none z-10 text-white"
          aria-hidden="true"
        >
          SCROLL
        </div>
      </div>
    </section>
  );
}
