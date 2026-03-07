'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import Section from '@/components/layout/Section';
import { Carousel } from '@/components/Carousel';

interface LightboxCarouselProps {
  ariaCloseLabel?: string;
  ariaViewLargeLabel?: string;
  images: string[];
}

export default function LightboxCarousel({
  ariaCloseLabel = 'Cerrar',
  ariaViewLargeLabel = 'Ver imagen en grande',
  images,
}: LightboxCarouselProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!lightboxUrl) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxUrl(null);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [lightboxUrl]);

  if (images.length === 0) return null;

  return (
    <>
      <Section className="!py-0">
        <div className="relative">
          <Carousel
            edgeBleed={false}
            itemClassName="min-w-0 flex-shrink-0 basis-full md:basis-[calc((100%-2*1rem)/3)]"
            opts={{ align: 'start', loop: true }}
            showArrows
            showDots
            slidesToScroll={3}
          >
            {images.map((url, index) => (
              <button
                key={`${url}-${index}`}
                className="relative h-[316px] w-full cursor-pointer overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
                onClick={() => setLightboxUrl(url)}
                type="button"
              >
                <Image
                  alt=""
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 85vw, (max-width: 1024px) 70vw, 55vw"
                  src={url}
                />
              </button>
            ))}
          </Carousel>
        </div>
      </Section>

      {lightboxUrl && (
        <div
          aria-label={ariaViewLargeLabel}
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-black/50"
            onClick={() => setLightboxUrl(null)}
          />
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
            <button
              aria-label={ariaCloseLabel}
              className="absolute right-2 top-2 z-10 rounded-md p-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              onClick={() => setLightboxUrl(null)}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative aspect-video w-full">
              <Image
                alt=""
                className="object-contain"
                fill
                sizes="90vw"
                src={lightboxUrl}
                unoptimized
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
