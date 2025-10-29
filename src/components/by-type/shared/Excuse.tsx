'use client';

import { useState, useRef, useCallback, type CSSProperties } from 'react';
import Img from '@/components/common/Img';
import { Button } from '@/components/ui/button';
import type { ExcuseCard, ExcuseContent } from '@/types/planner';

interface ExcuseProps {
  excuseCards: ExcuseCard[];
  content: ExcuseContent;
  plannerId: string;
  setExcuseKey: (excuse: string | null) => void;
  setStep: (stepIndex: number) => void;
  nextStep?: number; // Optional prop to specify which step to go to next
}

// Flip card component
function FlipCard({
  item,
  onChoose,
}: {
  item: ExcuseCard;
  onChoose: (key: string) => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const innerStyle: CSSProperties = {
    transformStyle: 'preserve-3d',
    transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
  };
  const faceStyle: CSSProperties = {
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
  };

  const debouncedFlipBack = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setFlipped(false);
    }, 150);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setFlipped(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    debouncedFlipBack();
  }, [debouncedFlipBack]);

  return (
    <div
      className="relative aspect-square w-full rounded-2xl overflow-hidden border border-white/10 bg-white/5 text-white"
      style={{
        perspective: '1000px',
        perspectiveOrigin: 'center center',
      }}
    >
      <div
        style={innerStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => onChoose(item.key)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onChoose(item.key);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`${item.title} — ver detalles`}
        className="h-full w-full cursor-pointer"
      >
        {/* Front */}
        <div className="absolute inset-0" style={faceStyle}>
          <Img
            alt={item.title}
            className="h-full w-full object-cover"
            height={420}
            src={item.img}
            width={420}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="text-2xl font-semibold font-caveat">{item.title}</h3>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0"
          style={{
            ...faceStyle,
            transform: 'rotateY(180deg)',
            transformOrigin: 'center center',
          }}
        >
          <Img
            alt=""
            className="h-full w-full object-cover"
            height={420}
            src={item.img}
            width={420}
          />
          <div className="absolute inset-0 bg-black/70 p-4 flex flex-col justify-center items-center text-center">
            <p className="text-sm leading-relaxed mb-4 font-jost">
              {item.description}
            </p>
            <Button variant="outline">Elegir y continuar →</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Excuse({
  excuseCards,
  content,
  plannerId,
  setExcuseKey,
  setStep,
  nextStep = 3, // Default to step 3 for backward compatibility
}: ExcuseProps) {
  return (
    <section
      className="max-w-7xl mx-auto px-4 md:px-8 py-10 relative"
      data-testid="tab-excuse"
    >
      <div className="text-center mb-8 relative">
        <h3
          className="text-center text-xl font-semibold text-neutral-900"
          data-testid="tab3-title"
        >
          {content.title}
        </h3>
        <p
          className="mt-2 text-center text-sm text-neutral-800 max-w-3xl mx-auto"
          data-testid="tab3-tagline"
        >
          {content.tagline}
        </p>
        <div className="text-center absolute top-1/2 -translate-y-1/2">
          <Button
            className="text-neutral-900 hover:underline decoration-neutral-400 hover:decoration-neutral-800"
            data-testid="cta-back-to-tab2"
            onClick={() => setStep(1)}
            variant="link"
          >
            ← Volver
          </Button>
        </div>
      </div>

      <div
        className={`grid gap-6 mt-8 justify-center ${
          excuseCards.length === 1
            ? 'grid-cols-1 max-w-md mx-auto'
            : excuseCards.length === 2
              ? 'grid-cols-1 sm:grid-cols-2 max-w-4xl mx-auto'
              : excuseCards.length === 3
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        }`}
      >
        {excuseCards.map((card) => (
          <FlipCard
            key={card.key}
            item={card}
            onChoose={(key) => {
              setExcuseKey(key);
              setStep(nextStep); // Go to next step (configurable)
              document
                .getElementById(plannerId)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
        ))}
      </div>
    </section>
  );
}
