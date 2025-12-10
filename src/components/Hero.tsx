'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface HeroContent {
  title: string;
  subtitle: string;
  tagline?: string;
  scrollText?: string;
  videoSrc: string;
  fallbackImage: string;
  branding?: {
    text: string;
    repeatText?: string;
  };
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
        // style={{ backgroundImage: `url(${content.fallbackImage})` }}
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
  return (
    <section
      id={id || 'home-hero'}
      className={cn(
        'relative h-screen flex flex-col overflow-hidden',
        className,
      )}
    >
      <div
        id="hero-sentinel"
        aria-hidden
        className="absolute top-0 left-0 h-px w-px"
      />
      <HeroVideoBackground content={content} />

      {/* Main Content - Left Aligned */}
      <div className="relative z-10 flex flex-col justify-center h-full px-8 md:px-12 lg:px-16">
        {/* Top Left Branding */}
        {content.branding && (
          <div className="flex items-center gap-3 mb-8 relative">
            <span className="font-barlow-condensed text-3xl font-semibold text-white uppercase tracking-[6px] ">
              {content.branding.text}
            </span>
            {content.branding.repeatText && (
              <div className="relative flex items-center ml-4 w-[230px]">
                <img
                  src="/assets/svg/yellow-circle.svg"
                  className="w-full absolute -top-12 -left-4 object-cover"
                />
                <div className="relative">
                  <span className="font-nothing-you-could-do text-yellow-400 text-6xl">
                    {content.branding.repeatText}
                  </span>
                </div>
              </div>
            )}
            <img
              src="/assets/svg/yellow-arrow-back.svg"
              className="w-[300px] absolute top-15 left-25 object-cover"
            />
          </div>
        )}
        <div className="max-w-3xl flex flex-col justify-center">
          <h2 className="mb-6 text-white font-barlow-condensed font-extrabold text-[160px] z-10 leading-[170px]">
            {content.title}
          </h2>

          <p
            className="font-barlow text-xl font-normal leading-relaxed text-white max-w-2xl mb-8 [&_strong]:font-bold [&_strong]:text-white"
            dangerouslySetInnerHTML={{ __html: content.subtitle }}
          />

          {content.tagline && (
            <p className="font-jost text-base md:text-lg font-normal leading-relaxed text-gray-300 max-w-xl mb-8">
              {content.tagline}
            </p>
          )}

          {/* Tags/Chips */}
          {content.tags && content.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-8">
              {content.tags?.map((tag, index) => (
                <div
                  key={`${tag.label}-${index}`}
                  className="flex items-center"
                >
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
        </div>
        {/* CTA Button - Lower Left */}
        {content.primaryCta && (
          <Button
            asChild
            aria-label={content.primaryCta.ariaLabel}
            size="lg"
            variant="outline"
            className="mr-auto"
          >
            <Link href={content.primaryCta.href} scroll={true}>
              {content.primaryCta.text}
            </Link>
          </Button>
        )}

        {content.secondaryCta && (
          <div className="absolute bottom-12 left-8 md:bottom-16 md:left-12 lg:left-16 z-10">
            <Button
              asChild
              aria-label={content.secondaryCta.ariaLabel}
              className="border-2 border-white bg-transparent hover:bg-white/10 text-white font-sans text-sm md:text-base uppercase tracking-wider px-6 py-3 rounded-none"
              size="lg"
              variant="outline"
            >
              <Link href={content.secondaryCta.href} scroll={true}>
                {content.secondaryCta.text}
              </Link>
            </Button>
          </div>
        )}
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
