'use client';

import clsx from 'clsx';

type Props = {
  src: string;
  poster?: string;
  overlayClassName?: string; // opcional: para oscurecer más/menos
  className?: string;
};

export default function BackgroundVideo({
  src,
  poster,
  overlayClassName,
  className,
}: Props) {
  return (
    <div className={clsx("absolute inset-0 overflow-hidden isolate", className)}>
      <video
        className="h-full w-full object-cover pointer-events-none"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={poster}
        aria-hidden="true"
      >
        <source src={src} type="video/mp4" />
        Tu navegador no soporta video en HTML5.
      </video>
      <div className={clsx("absolute inset-0 bg-black/30", overlayClassName)} />
    </div>
  );
}