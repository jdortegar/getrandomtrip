'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Shield, Clock, CreditCard, Heart } from 'lucide-react';

// Types
export type TrustSignalVariant = 'default' | 'compact' | 'minimal';

export interface TrustSignalItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  description: string;
}

export interface TrustSignalsProps {
  className?: string;
  variant?: TrustSignalVariant;
  showDescriptions?: boolean;
}

export interface TrustSignalProps {
  signal: TrustSignalItem;
  variant?: TrustSignalVariant;
  showDescription?: boolean;
  className?: string;
}

// Constants
const TRUST_SIGNALS_CONSTANTS = {
  SIGNALS: [
    {
      id: 'trusted',
      icon: Shield,
      text: 'Confiado por viajeros',
      description: 'Miles de viajeros ya vivieron la experiencia Random Trip.',
    },
    {
      id: 'support',
      icon: Clock,
      text: 'Atención humana 24/7',
      description:
        'Siempre estamos para ayudarte, antes, durante y después de tu viaje.',
    },
    {
      id: 'secure-payments',
      icon: CreditCard,
      text: 'Pagos seguros',
      description:
        'Tus transacciones están protegidas con la última tecnología.',
    },
    {
      id: 'pet-friendly',
      icon: Heart,
      text: 'Pet-friendly ready',
      description: 'Viaja con tu mejor amigo, tenemos opciones para todos.',
    },
  ] as const,

  SECTION_ARIA_LABEL: 'Sección de señales de confianza',
} as const;

// TrustSignal Component
function TrustSignal({
  signal,
  variant = 'default',
  showDescription = false,
  className = '',
}: TrustSignalProps) {
  const Icon = signal.icon;

  return (
    <div className="relative flex-shrink-0 p-4 md:p-6">
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 md:h-12 md:w-12">
          <Icon className="h-5 w-5 flex-shrink-0 text-primary md:h-6 md:w-6" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-jost text-sm font-semibold text-neutral-800 whitespace-nowrap md:text-base">
            {signal.text}
          </span>
          {showDescription && (
            <p className="font-jost text-[10px] text-neutral-500 whitespace-nowrap md:text-xs">
              {signal.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Main TrustSignals Component
export default function TrustSignals({
  className = '',
  variant = 'default',
  showDescriptions = false,
}: TrustSignalsProps) {
  // Create 3 blocks of signals for seamless infinite scroll
  const [blocks, setBlocks] = useState([
    { id: 0, signals: [...TRUST_SIGNALS_CONSTANTS.SIGNALS] },
    { id: 1, signals: [...TRUST_SIGNALS_CONSTANTS.SIGNALS] },
    { id: 2, signals: [...TRUST_SIGNALS_CONSTANTS.SIGNALS] },
  ]);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);
  const blockWidthRef = useRef(0);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Wait for first render to measure block width
    const measureBlockWidth = () => {
      const firstBlock = container.firstElementChild as HTMLElement;
      if (!firstBlock) return;

      // Calculate width of one block (4 cards + gaps)
      const cards = firstBlock.querySelectorAll('.trust-signal-card');
      let totalWidth = 0;
      cards.forEach((card) => {
        totalWidth += (card as HTMLElement).offsetWidth + 32; // card + gap
      });
      blockWidthRef.current = totalWidth;
    };

    // Measure after a brief delay to ensure render
    setTimeout(measureBlockWidth, 100);

    const scrollSpeed = 0.3; // pixels per frame

    const animate = () => {
      if (!blockWidthRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      scrollPositionRef.current += scrollSpeed;

      // When we've scrolled past one full block, move first block to end
      if (scrollPositionRef.current >= blockWidthRef.current) {
        scrollPositionRef.current = 0;

        setBlocks((prev) => {
          const [firstBlock, ...rest] = prev;
          return [...rest, { ...firstBlock, id: Date.now() }];
        });
      }

      if (container) {
        container.style.transform = `translateX(-${scrollPositionRef.current}px)`;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <section
      aria-label={TRUST_SIGNALS_CONSTANTS.SECTION_ARIA_LABEL}
      className={`py-12 ${className}`.trim()}
    >
      <div className="relative overflow-hidden">
        {/* Gradient fade edges for smooth effect */}
        <div className="absolute bottom-0 left-0 top-0 z-10 w-32 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 right-0 top-0 z-10 w-32 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />

        <div className="flex" ref={containerRef}>
          {blocks.map((block) => (
            <div key={block.id} className="flex gap-8 flex-shrink-0">
              {block.signals.map((signal, index) => (
                <div
                  key={`${signal.id}-${index}`}
                  className="trust-signal-card"
                >
                  <TrustSignal
                    showDescription={showDescriptions}
                    signal={signal}
                    variant={variant}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
