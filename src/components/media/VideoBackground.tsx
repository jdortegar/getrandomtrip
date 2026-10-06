"use client";

import React from "react";
import { cn } from "@/lib/utils";
import SafeImage from "@/components/common/SafeImage";

export interface VideoBackgroundProps {
  fallbackImage?: string;
  overlayClassName?: string;
  videoSrc?: string;
  className?: string;
  /** Preload the still; turn off when the background sits below the fold. */
  priority?: boolean;
}

export default function VideoBackground({
  fallbackImage,
  overlayClassName,
  videoSrc,
  className,
  priority = true,
}: VideoBackgroundProps) {
  if (!videoSrc && !fallbackImage) return null;
  return (
    <div
      className={cn("absolute inset-0 w-full h-full", className)}
      aria-hidden data-component="VideoBackground"
    >
      {fallbackImage && (
        <SafeImage
          alt=""
          className="absolute inset-0 z-0 w-full h-full object-cover object-center"
          fill
          priority={priority}
          sizes="100vw"
          src={fallbackImage}
        />
      )}

      {videoSrc && (
        <video
          autoPlay
          className="absolute inset-0 z-10 w-full h-full object-cover"
          loop
          muted
          playsInline
          preload="auto"
          src={videoSrc}
        >
          <source src={videoSrc.replace(".mp4", ".webm")} type="video/webm" />
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      <div
        className={cn("absolute inset-0 z-10 bg-black/40", overlayClassName)}
        aria-hidden
      />
    </div>
  );
}
