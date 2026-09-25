"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import BrandingAnimation from "@/components/BrandingAnimation";
import VideoBackground from "@/components/media/VideoBackground";
import { formatTitleWithCopyright } from "@/lib/helpers/stringHelpers";

export interface HeroContent {
  accent?: string;
  branding?: { repeatText?: string; text: string };
  fallbackImage?: string;
  primaryCta?: { ariaLabel: string; href: string; text: string };
  scrollText?: string;
  subtitle: string;
  tagline?: string;
  title: string;
  videoSrc?: string;
  secondaryCta?: { ariaLabel: string; href: string; text: string };
  tags?: unknown;
  eyebrow?: string;
}

interface HeroProps {
  content: HeroContent;
  className?: string;
  id?: string;
  scrollIndicator?: boolean;
  titleClassName?: string;
  variant?: "default" | "home";
}

// Main Hero Component
const Hero: React.FC<HeroProps> = ({
  content,
  className,
  id,
  scrollIndicator = false,
  titleClassName,
  variant = "default",
}) => {
  const isHome = variant === "home";
  const Heading = isHome ? motion.h1 : motion.h2;

  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden relative",
        isHome ? "min-h-svh" : "h-screen",
        className,
      )}
      data-component="Hero"
      id={id || "home-hero"}
    >
      <VideoBackground
        fallbackImage={content.fallbackImage}
        videoSrc={content.videoSrc}
      />

      {/* Main Content - Left Aligned */}
      <div
        className={cn(
          "flex flex-col justify-center relative rt-container z-10",
          isHome ? "flex-1 pb-24 pt-36" : "h-full",
          "md:px-20!",
        )}
      >
        {/* Top Left Branding */}

        {content.eyebrow ? (
          <span className="text-center md:text-left mb-2 font-bold text-sm uppercase tracking-[2px] md:tracking-[0.4em] md:text-base text-white">
            {content.eyebrow}
          </span>
        ) : (
          <BrandingAnimation className="w-fit mx-auto md:mx-0 flex items-center gap-3 mb-4 relative justify-center md:justify-start" />
        )}

        <div
          className={cn(
            "flex flex-col justify-center text-center",
            isHome ? "max-w-5xl" : "max-w-3xl",
            "lg:text-left",
          )}
        >
          <Heading
            animate={{ y: 0, opacity: 1 }}
            className={cn(
              "font-barlow-condensed font-extrabold mb-6 text-center text-white z-10 [&_sup]:text-[0.6em]",
              "md:text-left",
              isHome ? "text-[44px] whitespace-pre-line" : "text-[60px]",
              isHome
                ? "sm:text-[64px] lg:text-[100px]"
                : "md:text-[80px] lg:text-[130px]",
              "leading-none [&_sup]:leading-none",
              titleClassName,
            )}
            dangerouslySetInnerHTML={{
              __html: formatTitleWithCopyright(content.title),
            }}
            initial={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
          />

          {isHome && content.accent && (
            <motion.p
              animate={{ y: 0, opacity: 1 }}
              className={cn(
                "font-nothing-you-could-do font-normal mb-6 text-[26px] text-feature",
                "sm:text-[30px] md:text-left lg:text-[34px]",
                "leading-tight",
                "lg:leading-7",
              )}
              initial={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.35, delay: 0.25 }}
            >
              {content.accent}
            </motion.p>
          )}

          <motion.p
            animate={{ y: 0, opacity: 1 }}
            className={cn(
              "font-barlow font-normal mb-8 text-center text-lg text-white whitespace-pre-line [&_strong]:font-bold [&_strong]:text-white",
              "md:text-left",
              isHome
                ? "leading-7 max-w-[489px] mx-auto"
                : "leading-relaxed max-w-2xl",
              isHome && "md:mx-0",
            )}
            dangerouslySetInnerHTML={{ __html: content.subtitle }}
            initial={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.35, delay: 0.3 }}
          />

          {content.tagline && (
            <motion.p
              className="text-center md:text-left font-barlow text-base md:text-lg font-bold leading-relaxed text-white max-w-xl mb-8"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.3 }}
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
              transition={{ duration: 0.35, delay: 0.5 }}
            >
              <Button
                aria-label={content.primaryCta.ariaLabel}
                asChild
                className={isHome ? "bg-transparent" : undefined}
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
              transition={{ duration: 0.35, delay: 0.5 }}
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
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 hidden md:block">
          <div
            className="scroll-indicator pointer-events-none select-none z-10 text-white"
            aria-hidden="true"
          >
            {content.scrollText || "SCROLL"}
          </div>
        </div>
      )}
    </section>
  );
};

export default Hero;
