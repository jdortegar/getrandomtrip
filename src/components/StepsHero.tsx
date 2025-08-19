'use client';

import { Calendar, MapPin, PartyPopper } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { type TrustSignal } from '@/lib/types';

interface StepsHeroProps {
  trustSignals: TrustSignal[];
}

export function StepsHero({ trustSignals }: StepsHeroProps) {
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Calendar':
        return Calendar;
      case 'MapPin':
        return MapPin;
      case 'PartyPopper':
        return PartyPopper;
      default:
        return Calendar;
    }
  };

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-gray-600 mb-2">PASO A PASO</p>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            ¿CÓMO FUNCIONA RANDOM TRIP?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Un proceso simple de 3 pasos para crear tu viaje sorpresa perfecto
          </p>
        </div>

        <div className="hidden md:grid md:grid-cols-3 md:gap-8">
          {trustSignals.map((signal) => {
            const IconComponent = getIconComponent(signal.icon);

            return (
              <Card
                key={signal.id}
                className="p-8 text-center hover:shadow-xl transition-shadow duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <IconComponent className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {signal.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {signal.description}
                </p>
              </Card>
            );
          })}
        </div>

        <div className="md:hidden">
          <div className="flex overflow-x-auto space-x-6 pb-4 scrollbar-hide">
            {trustSignals.map((signal) => {
              const IconComponent = getIconComponent(signal.icon);

              return (
                <Card
                  key={signal.id}
                  className="flex-shrink-0 w-80 p-6 text-center hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {signal.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {signal.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="text-center mt-12">
          <Button
            size="lg"
            className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-8 py-4"
          >
            Saber más
          </Button>
        </div>
      </div>
    </section>
  );
}
