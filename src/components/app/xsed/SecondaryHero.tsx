"use client";

import React from "react";
import { motion } from "framer-motion";

import BrandingAnimation from "@/components/BrandingAnimation";
import VideoBackground from "@/components/media/VideoBackground";
import { Button } from "@/components/ui/Button";
import type { XsedPageDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface SecondaryHeroProps {
  className?: string;
  content: XsedPageDict["hero"];
  id?: string;
  scrollIndicator?: boolean;
  titleClassName?: string;
}

export function SecondaryHero({
  className,
  content,
  id,
  scrollIndicator = false,
  titleClassName,
}: SecondaryHeroProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <section
      className={cn("relative flex h-screen flex-col overflow-hidden", className)}
      id={id || "secondary-hero"}
    >
      <div
        aria-hidden
        className="absolute left-0 top-0 h-px w-px"
        id="hero-sentinel"
      />
      <VideoBackground
        fallbackImage={content.fallbackImage}
        videoSrc={content.videoSrc}
      />

      <div className="container relative z-10 mx-auto flex h-full flex-col justify-center px-4 md:px-20">
        <BrandingAnimation className="relative mb-4 flex items-center justify-center gap-3 md:justify-start" />

        <div className="flex max-w-3xl flex-col justify-center text-center md:text-left">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-end justify-center gap-3 md:justify-start"
            initial={{ opacity: 0, y: 60 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <h1
              className={cn(
                "z-10 font-barlow-condensed text-[80px] font-extrabold leading-none text-white",
                "[&_sup]:text-[0.6em] [&_sup]:leading-none",
                "md:text-[88px]",
                titleClassName,
              )}
            >
              {content.title}
            </h1>
            <p className="mb-4 max-w-24 text-left text-xs font-semibold leading-tight uppercase tracking-wide text-white md:text-sm">
              {content.subtitle}
            </p>
          </motion.div>

          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 max-w-2xl font-barlow text-sm font-normal leading-relaxed text-white md:text-base [&_strong]:font-bold [&_strong]:text-white"
            initial={{ opacity: 0, y: 40 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <strong>{content.tagline}</strong>
          </motion.p>

          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 max-w-xl font-barlow text-xs font-normal leading-relaxed text-white md:text-sm"
            initial={{ opacity: 0, y: 40 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            {content.availabilityNote}
          </motion.p>
        </div>

        <motion.form
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex max-w-[465px] flex-col justify-center gap-0 md:justify-start sm:flex-row"
          initial={{ opacity: 0, y: 40 }}
          onSubmit={handleSubmit}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <label className="sr-only" htmlFor="xsed-contact">
            {content.inputLabel}
          </label>
          <input
            className={cn(
              "h-12 min-w-0 flex-1 rounded-none border border-white/40 bg-transparent px-6 text-center text-sm text-white",
              "placeholder:text-white",
              "focus:border-white focus:outline-none focus:ring-2 focus:ring-white/40",
            )}
            id="xsed-contact"
            name="contact"
            placeholder={content.inputPlaceholder}
            type="text"
          />
          <Button
            aria-label={content.submitAriaLabel}
            className="h-12 px-7 text-xs md:text-sm"
            size="lg"
            type="submit"
            variant="tertiary"
          >
            {content.submitLabel}
          </Button>
        </motion.form>

        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl font-barlow text-sm font-normal leading-relaxed text-white"
          initial={{ opacity: 0, y: 40 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          {content.helper}
        </motion.p>
      </div>

      {scrollIndicator && (
        <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2">
          <div
            aria-hidden="true"
            className="scroll-indicator pointer-events-none z-10 select-none text-white"
          >
            {content.scrollText || "SCROLL"}
          </div>
        </div>
      )}
    </section>
  );
}
