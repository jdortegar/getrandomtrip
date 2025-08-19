'use client';

import { Bed, Euro, Headphones, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { type TrustSignalItem } from '@/lib/types';

interface TrustSignalProps {
  trustSignalItems: TrustSignalItem[];
}

export function TrustSignal({ trustSignalItems }: TrustSignalProps) {
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'MapPin':
        return MapPin;
      case 'Bed':
        return Bed;
      case 'Euro':
        return Euro;
      case 'Headphones':
        return Headphones;
      default:
        return MapPin;
    }
  };

  const scrollToHero = () => {
    const heroSection = document.getElementById('hero-section');
    if (heroSection) {
      heroSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            ¿QUÉ ESPERAR DE UN VIAJE RANDOM TRIP?
          </h2>
          <p className="text-2xl font-bold text-gray-700">
            EMOCIÓN, SORPRESA Y DIVERSIÓN
          </p>
        </div>

        <div className="hidden md:grid md:grid-cols-2 md:gap-8 lg:gap-12">
          {trustSignalItems.map((item) => {
            const IconComponent = getIconComponent(item.icon);

            return (
              <Card
                key={item.id}
                className="p-8 hover:shadow-lg transition-shadow duration-300 bg-white"
              >
                <div className="flex items-start space-x-4">
                  <div className={`${item.color} flex-shrink-0`}>
                    <IconComponent className="h-12 w-12" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="md:hidden">
          <div className="flex overflow-x-auto space-x-6 pb-4 scrollbar-hide">
            {trustSignalItems.map((item) => {
              const IconComponent = getIconComponent(item.icon);

              return (
                <Card
                  key={item.id}
                  className="flex-shrink-0 w-80 p-6 bg-white hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`${item.color} flex-shrink-0`}>
                      <IconComponent className="h-10 w-10" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed text-sm">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="text-center mt-12">
          <Button
            onClick={scrollToHero}
            size="lg"
            className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-8 py-4"
          >
            Empezar
          </Button>
        </div>
      </div>
    </section>
  );
}
