'use client';

import { useState, useRef, useCallback, type CSSProperties } from 'react';
import Img from '@/components/common/Img';
import { Button } from '@/components/ui/button';

interface LaExcusaProps {
  setCoupleAlma: (alma: string | null) => void;
  setStep: (stepIndex: number) => void;
}

// 8 tarjetas (4x4) para "La Excusa"
const COUPLES_CARDS = [
  {
    key: 'romantic-getaway',
    title: 'Escapada Romántica',
    img: 'https://images.unsplash.com/photo-1639748399660-734ae9ec2f8a',
  },
  {
    key: 'adventure-duo',
    title: 'Dúo de Aventura',
    img: 'https://images.unsplash.com/photo-1562337635-a4d98d22c1d2',
  },
  {
    key: 'foodie-lovers',
    title: 'Foodie Lovers',
    img: 'https://images.unsplash.com/photo-1663428710477-c7c838be76b5',
  },
  {
    key: 'culture-tradition',
    title: 'Cultura & Tradición',
    img: 'https://images.unsplash.com/photo-1717801556175-3a22bd4a0360',
  },
  {
    key: 'wellness-retreat',
    title: 'Wellness Retreat',
    img: 'https://images.unsplash.com/photo-1687875495230-96dfea96d9da',
  },
  {
    key: 'celebrations',
    title: 'Celebraciones',
    img: 'https://images.unsplash.com/photo-1746559893894-92e3318393bc',
  },
  {
    key: 'beach-dunes',
    title: 'Playa & Dunas',
    img: 'https://images.unsplash.com/photo-1756506606876-e0ed2a999616',
  },
  {
    key: 'urban-getaway',
    title: 'Escapada Urbana',
    img: 'https://images.unsplash.com/photo-1634452584863-e6590064b4d3',
  },
] as const;

// Flip card de La Excusa
function CoupleFlipCard({
  item,
  onChoose,
}: {
  item: { key: string; title: string; img: string };
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

  const supportCopy: Record<string, string> = {
    'romantic-getaway':
      'Un viaje corto, suficiente para apagar el mundo y encenderse mutuamente.',
    'adventure-duo':
      'Porque nada une más que perderse juntos en la naturaleza y conquistar lo inesperado.',
    'foodie-lovers':
      'Para quienes creen que el amor también entra por el paladar.',
    'culture-tradition':
      'El encanto de descubrir juntos pueblos, historias y costumbres locales.',
    'wellness-retreat':
      'Un respiro compartido: spa, silencio y bienestar en pareja.',
    celebrations:
      'Un aniversario, un logro, o simplemente la excusa perfecta para brindar juntos.',
    'beach-dunes':
      'Sol, arena y la excusa eterna para caminar de la mano al atardecer.',
    'urban-getaway':
      'Porque la ciudad también puede ser el mejor escenario para perderse en pareja.',
  };

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
            src={item.img}
            alt={item.title}
            className="h-full w-full object-cover"
            width={420}
            height={420}
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
            src={item.img}
            alt=""
            className="h-full w-full object-cover"
            width={420}
            height={420}
          />
          <div className="absolute inset-0 bg-black/70 p-4 flex flex-col justify-center items-center text-center">
            <p className="text-sm leading-relaxed mb-4 font-jost">
              {supportCopy[item.key]}
            </p>
            <Button
              variant="outline"
              // className="bg-white/90 border-white/20 text-neutral-900 hover:bg-white hover:text-neutral-900"
            >
              Elegir y continuar →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LaExcusa({ setCoupleAlma, setStep }: LaExcusaProps) {
  return (
    <section
      data-testid="tab-pareja-alma"
      className="max-w-7xl mx-auto px-4 md:px-8 py-10 relative"
    >
      <div className="text-center mb-8 relative">
        <h3
          data-testid="tab3-title"
          className="text-center text-xl font-semibold text-neutral-900"
        >
          Viajamos por muchas razones, ¿cuál los mueve hoy?
        </h3>
        <p
          data-testid="tab3-tagline"
          className="mt-2 text-center text-sm text-neutral-800 max-w-3xl mx-auto"
        >
          Toda escapada tiene su "porque sí". Armando el Destination Decoded.
        </p>
        <div className="text-center absolute top-1/2 -translate-y-1/2">
          <Button
            data-testid="cta-back-to-tab2"
            variant="link"
            className="text-neutral-900 hover:underline decoration-neutral-400 hover:decoration-neutral-800"
            onClick={() => setStep(1)}
          >
            ← Volver
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {COUPLES_CARDS.map((it) => (
          <CoupleFlipCard
            key={it.key}
            item={it}
            onChoose={(key) => {
              setCoupleAlma(key);
              setStep(3); // Go to next step (Afinar detalles)
              document
                .getElementById('couple-planner')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
        ))}
      </div>
    </section>
  );
}
