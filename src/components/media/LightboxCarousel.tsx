'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import Section from '@/components/layout/Section';
import { Carousel } from '@/components/Carousel';

interface LightboxImage {
  url: string;
  caption?: string;
}

interface LightboxCarouselProps {
  ariaCloseLabel?: string;
  ariaViewLargeLabel?: string;
  images: LightboxImage[];
}

export default function LightboxCarousel({
  ariaCloseLabel = 'Cerrar',
  ariaViewLargeLabel = 'Ver imagen en grande',
  images,
}: LightboxCarouselProps) {
  const [lightboxImage, setLightboxImage] = useState<LightboxImage | null>(null);

  useEffect(() => {
    if (!lightboxImage) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImage(null);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [lightboxImage]);

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
            {images.map((image, index) => (
              <button
                key={`${image.url}-${index}`}
                className="relative h-[316px] w-full cursor-pointer overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
                onClick={() => setLightboxImage(image)}
                type="button"
              >
                <Image
                  alt={image.caption ?? ''}
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 85vw, (max-width: 1024px) 70vw, 55vw"
                  src={image.url}
                />
              </button>
            ))}
          </Carousel>
        </div>
      </Section>

      {lightboxImage && (
        <div
          aria-label={ariaViewLargeLabel}
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-black/50"
            onClick={() => setLightboxImage(null)}
          />
          <div className="relative overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
            <button
              aria-label={ariaCloseLabel}
              className="absolute right-2 top-2 z-10 rounded-md p-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              onClick={() => setLightboxImage(null)}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
            <Image
              alt={lightboxImage.caption ?? ''}
              height={0}
              sizes="85vw"
              src={lightboxImage.url}
              style={{ display: 'block', height: 'auto', maxHeight: '80vh', maxWidth: '85vw', width: 'auto' }}
              unoptimized
              width={0}
            />
          </div>
        </div>
      )}
    </>
  );
}
