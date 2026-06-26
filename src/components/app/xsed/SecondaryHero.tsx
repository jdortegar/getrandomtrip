"use client";

import { motion } from "framer-motion";

import VideoBackground from "@/components/media/VideoBackground";
import type { XsedPageDict } from "@/lib/types/dictionary";
import { formatTitleWithCopyright } from "@/lib/helpers/stringHelpers";
import { cn } from "@/lib/utils";
import { XsedNotifyForm } from "./XsedNotifyForm";

interface SecondaryHeroProps {
  className?: string;
  content: XsedPageDict["hero"];
  id?: string;
  locale: string;
  scrollIndicator?: boolean;
  titleClassName?: string;
}

export function SecondaryHero({
  className,
  content,
  id,
  locale,
  scrollIndicator = false,
  titleClassName,
}: SecondaryHeroProps) {
  console.log(content.videoSrc);
  return (
    <section
      className={cn(
        "relative flex h-screen flex-col overflow-hidden",
        className,
      )}
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
      <div className="relative z-10 flex flex-col justify-center h-full container mx-auto md:px-20 px-4">
        <div className="max-w-3xl flex flex-col justify-center text-left">
          <motion.div
            className={cn(
              "flex flex-wrap gap-x-5 gap-y-3 items-end mb-8 text-white justify-center md:justify-start",
            )}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h2 className="font-barlow-condensed font-extrabold text-[100px] md:text-[130px] z-10 leading-[0.8] [&_sup]:text-[0.6em]">
              {formatTitleWithCopyright(content.title)}
            </h2>
            <div className="flex justify-end gap-2">
              <span
                aria-hidden
                className="self-stretch w-px bg-xsed rounded-full"
                style={{ minHeight: 40 }}
              />
              <div className="flex flex-col justify-end">
                <p
                  className="font-barlow text-sm sm:text-lg uppercase leading-tight tracking-wide text-white"
                  dangerouslySetInnerHTML={{ __html: content.subtitle }}
                />
              </div>
            </div>
          </motion.div>

          <motion.p
            className="font-barlow text-base sm:text-lg leading-relaxed text-white mb-8 [&_strong]:font-bold"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            dangerouslySetInnerHTML={{ __html: content.tagline }}
          />
        </div>

        <XsedNotifyForm variant="dark" className="md:justify-start" />
      </div>

      {scrollIndicator && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div
            className="scroll-indicator pointer-events-none select-none z-10 text-white"
            aria-hidden="true"
          >
            "SCROLL"
          </div>
        </div>
      )}
    </section>
  );
}
