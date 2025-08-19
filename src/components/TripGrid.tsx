'use client';

import { ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { type TripCard } from '@/lib/types';

interface TripGridProps {
  tripCards: TripCard[];
}

export function TripGrid({ tripCards }: TripGridProps) {
  const handleCardClick = (link: string) => {
    // Navigate to the trip page
    console.log('Navigate to:', link);
  };

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-gray-600 mb-2">OTROS VIAJES</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
            DESCUBRE TODOS LOS VIAJES SORPRESA
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {tripCards.map((card) => (
            <Card
              key={card.id}
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => handleCardClick(card.link)}
            >
              <div className="relative h-64 md:h-80">
                <div
                  className="absolute inset-0 bg-center bg-cover bg-no-repeat"
                  style={{ backgroundImage: `url(${card.imageUrl})` }}
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300" />

                <div className="absolute bottom-0 left-0 right-0 text-white">
                  <div className="p-6 flex items-end justify-between">
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold mb-2">
                        {card.title}
                      </h3>
                      <p className="text-sm md:text-base opacity-90">
                        {card.description}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      className="bg-gray-800 hover:bg-gray-700 text-white rounded-full w-10 h-10 p-0 flex-shrink-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200 inline-flex items-center">
            Ver todos los viajes →
          </button>
        </div>
      </div>
    </section>
  );
}
