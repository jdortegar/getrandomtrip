'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { scrollToAnchor } from '@/lib/helpers/scrollToAnchor';

export interface HeroContent {
  title: string;
  subtitle: string;
  tagline?: string;
  scrollText?: string;
  videoSrc: string;
  fallbackImage: string;
  tags?: {
    label: string;
    value: string;
  }[];
  primaryCta?: {
    text: string;
    href: string;
    ariaLabel: string;
  };
  secondaryCta?: {
    text: string;
    href: string;
    ariaLabel: string;
  };
}

interface HeroProps {
  content: HeroContent;
  id?: string;
  className?: string;
  titleClassName?: string;
  scrollIndicator?: boolean;
}

function HeroVideoBackground({ content }: { content: HeroContent }) {
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
        style={{ backgroundImage: `url(${content.fallbackImage})` }}
      />

      {/* Video Overlay - Only when ready */}
      {!hasError && content.videoSrc && (
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
          poster={content.fallbackImage}
          onLoadStart={() => console.log('Video load started')}
          onLoadedMetadata={() => console.log('Video metadata loaded')}
          onCanPlay={() => console.log('Video can play event')}
          onLoadedData={() => console.log('Video loaded data event')}
          onError={(e) => console.log('Video error event:', e)}
        >
          <source
            src={content.videoSrc.replace('.mp4', '.webm')}
            type="video/webm"
          />
          <source src={content.videoSrc} type="video/mp4" />
        </video>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
}

// Main Hero Component
const Hero: React.FC<HeroProps> = ({
  content,
  id,
  className,
  scrollIndicator = false,
  titleClassName,
}) => {
  const handleCtaClick = (href: string) => {
    if (href.startsWith('#')) {
      return (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        scrollToAnchor(href);
      };
    }
    return undefined;
  };

  return (
    <section
      id={id || 'home-hero'}
      className={`relative h-screen flex flex-col items-center justify-center text-center overflow-hidden ${className || ''}`}
    >
      {/* Hero sentinel for navbar detection */}
      <div
        id="hero-sentinel"
        aria-hidden
        className="absolute top-0 left-0 h-px w-px"
      />
      <HeroVideoBackground content={content} />
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-16">
        <h2
          className={cn(
            'font-caveat text-7xl font-bold leading-tight text-white mb-4',
            titleClassName,
          )}
        >
          {content.title}
        </h2>

        <p className="font-jost text-xl font-normal leading-relaxed text-gray-300 max-w-4xl mx-auto mb-8">
          {content.subtitle}
        </p>

        {content.tagline && (
          <p className="font-jost text-lg font-normal leading-relaxed text-gray-300 max-w-2xl mx-auto mb-8">
            {content.tagline}
          </p>
        )}

        {/* Tags/Chips */}
        {content.tags && content.tags.length > 0 && (
          <div className="flex flex-wrap justify-center items-center gap-2 mb-8">
            {content.tags?.map((tag, index) => (
              <div key={`${tag.label}-${index}`} className="flex items-center">
                <div className="rounded-sm px-6 py-2 flex flex-col">
                  <span className="text-xs uppercase text-white mb-2">
                    {tag.label}
                  </span>
                  <p className="text-3xl font-semibold text-white font-caveat">
                    {tag.value}
                  </p>
                </div>
                {index < (content.tags?.length ?? 0) - 1 && (
                  <div className="h-16 w-px bg-white/70 mx-2" />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-4 justify-center">
          {content.primaryCta && (
            <Button
              asChild
              aria-label={content.primaryCta.ariaLabel}
              variant="default"
              size="lg"
              className="mt-8 uppercase tracking-wider animate-pulse-once"
            >
              <Link
                href={content.primaryCta.href}
                onClick={handleCtaClick(content.primaryCta.href)}
              >
                {content.primaryCta.text}
              </Link>
            </Button>
          )}
          {content.secondaryCta && (
            <Button
              asChild
              aria-label={content.secondaryCta.ariaLabel}
              variant="outline"
              size="lg"
              className="mt-8 uppercase tracking-wider animate-pulse-once"
            >
              <Link
                href={content.secondaryCta.href}
                onClick={handleCtaClick(content.secondaryCta.href)}
              >
                {content.secondaryCta.text}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {scrollIndicator && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div
            className="scroll-indicator pointer-events-none select-none z-10 text-white"
            aria-hidden="true"
          >
            SCROLL
          </div>
        </div>
      )}
    </section>
  );
};

export default Hero;
