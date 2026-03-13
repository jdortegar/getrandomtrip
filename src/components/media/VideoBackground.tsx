'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface VideoBackgroundProps {
  fallbackImage?: string;
  overlayClassName?: string;
  videoSrc: string;
  className?: string;
}

export default function VideoBackground({
  fallbackImage,
  overlayClassName,
  videoSrc,
  className,
}: VideoBackgroundProps) {
  if (!videoSrc) return null;
  return (
    <div
      className={cn('absolute inset-0 w-full h-full', className)}
      aria-hidden
    >
      {fallbackImage && (
        <div
          className="absolute inset-0 z-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${fallbackImage})` }}
        />
      )}

      <video
        autoPlay
        className="absolute inset-0 z-10 w-full h-full object-cover"
        loop
        muted
        playsInline
        poster={fallbackImage}
        preload="auto"
        src={videoSrc}
      >
        <source src={videoSrc.replace('.mp4', '.webm')} type="video/webm" />
        <source src={videoSrc} type="video/mp4" />
      </video>

      <div
        className={cn('absolute inset-0 z-10 bg-black/40', overlayClassName)}
        aria-hidden
      />
    </div>
  );
}
