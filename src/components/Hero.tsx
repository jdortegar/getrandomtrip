'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import BrandingAnimation from '@/components/BrandingAnimation';
import VideoBackground from '@/components/media/VideoBackground';
import { formatTitleWithCopyright } from '@/lib/helpers/stringHelpers';

export interface HeroContent {
  branding?: { repeatText?: string; text: string };
  fallbackImage?: string;
  primaryCta?: { ariaLabel: string; href: string; text: string };
  scrollText?: string;
  subtitle: string;
  tagline?: string;
  title: string;
  videoSrc: string;
  secondaryCta?: { ariaLabel: string; href: string; text: string };
  tags?: unknown;
}

interface HeroProps {
  content: HeroContent;
  className?: string;
  id?: string;
  scrollIndicator?: boolean;
  titleClassName?: string;
}

// Main Hero Component
const Hero: React.FC<HeroProps> = ({
  content,
  className,
  id,
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
      <VideoBackground
        fallbackImage={content.fallbackImage}
        videoSrc={content.videoSrc}
      />

      {/* Main Content - Left Aligned */}
      <div className="relative z-10 flex flex-col justify-center h-full rt-container md:px-20!">
        {/* Top Left Branding */}

        <BrandingAnimation className="w-fit mx-auto md:mx-0 flex items-center gap-3 mb-4 relative justify-center md:justify-start" />

        <div className="max-w-3xl flex flex-col justify-center text-center lg:text-left">
          <motion.h2
            className={cn(
              'text-center md:text-left mb-6 text-white font-barlow-condensed font-extrabold text-[60px] md:text-[80px] lg:text-[130px] z-10 leading-none [&_sup]:text-[0.6em] [&_sup]:leading-none',
              titleClassName,
            )}
            dangerouslySetInnerHTML={{
              __html: formatTitleWithCopyright(content.title),
            }}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          />

          <motion.p
            className="text-center md:text-left font-barlow text-lg font-normal leading-relaxed text-white max-w-2xl mb-8 [&_strong]:font-bold [&_strong]:text-white"
            dangerouslySetInnerHTML={{ __html: content.subtitle }}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          />

          {content.tagline && (
            <motion.p
              className="text-center md:text-left font-barlow text-base md:text-lg font-bold leading-relaxed text-white max-w-xl mb-8"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              {content.tagline}
            </motion.p>
          )}
        </div>
        <div className="flex items-center justify-center md:justify-start gap-4 flex-wrap">
          {/* CTA Button - Lower Left */}
          {content.primaryCta && (
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <Button
                asChild
                aria-label={content.primaryCta.ariaLabel}
                size="lg"
                variant="outline"
              >
                <Link href={content.primaryCta.href} scroll={true}>
                  {content.primaryCta.text}
                </Link>
              </Button>
            </motion.div>
          )}

          {content.secondaryCta && (
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <Button
                asChild
                aria-label={content.secondaryCta.ariaLabel}
                size="lg"
                variant="white"
              >
                <Link href={content.secondaryCta.href} scroll={true}>
                  {content.secondaryCta.text}
                </Link>
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {scrollIndicator && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div
            className="scroll-indicator pointer-events-none select-none z-10 text-white"
            aria-hidden="true"
          >
            {content.scrollText || 'SCROLL'}
          </div>
        </div>
      )}
    </section>
  );
};

export default Hero;
