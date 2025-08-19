'use client';

import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { type CityCard } from '@/lib/types';

interface CardScrollProps {
  cityCards: CityCard[];
}

export function CardScroll({ cityCards }: CardScrollProps) {
  const scrollToHero = () => {
    const heroSection = document.getElementById('hero-section');
    if (heroSection) {
      heroSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-gray-600 mb-2">
            ¿QUÉ ES RANDOM TRIP?
          </p>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            DEJA QUE EL DESTINO TE SORPRENDA
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Descubre tu destino 48h antes de viajar, con vuelos y hotel
            incluidos. Decide las fechas, prepara la maleta y deja que el azar
            decida. ¡Empieza tu aventura! Vivirás una experiencia divertida,
            espontánea y sorprendente.
          </p>
        </div>

        <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide">
          {cityCards.map((card) => (
            <Card
              key={card.id}
              className="flex-none w-48 h-72 rounded-2xl overflow-hidden shadow-lg relative bg-gray-100"
              style={{ minWidth: '12rem' }}
            >
              <div className="absolute inset-0 border-[4px] border-black rounded-2xl z-10 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-3 bg-black rounded-b-md"></div>
              </div>

              <div className="absolute inset-0">
                <Image
                  src={card.imageUrl}
                  alt={card.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 12rem, 12rem"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
              </div>

              <div className="absolute bottom-4 left-0 right-0 text-center text-white z-20">
                <h3 className="text-lg font-bold">{card.name}</h3>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            onClick={scrollToHero}
            className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-4 px-10 rounded-full text-xl transition-colors duration-300"
          >
            Empezar
          </Button>
        </div>
      </div>
    </section>
  );
}
