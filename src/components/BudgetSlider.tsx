'use client';

import React, { useState, useMemo } from 'react';
import { PACKAGE_TIERS, PACKAGE_ICONS } from '@/lib/data/packages';
import { MapPin, Plane, Bed, Gift } from 'lucide-react';

// Types
export interface TripCharacteristic {
  id: string;
  label: string;
  emoji: string;
  description: string;
  minBudget: number;
  maxBudget: number;
}

export interface BudgetSliderProps {
  className?: string;
  onBudgetChange?: (
    budget: number,
    characteristics: TripCharacteristic[],
  ) => void;
}

export default function BudgetSlider({
  className = '',
  onBudgetChange,
}: BudgetSliderProps) {
  const [budget, setBudget] = useState(500);

  // Get current package based on budget
  const currentPackage = useMemo(() => {
    return (
      PACKAGE_TIERS.find(
        (tier) => budget >= tier.minBudget && budget <= tier.maxBudget,
      ) || PACKAGE_TIERS[0]
    );
  }, [budget]);

  const handleBudgetChange = (newBudget: number) => {
    setBudget(newBudget);
    onBudgetChange?.(newBudget, []);
  };

  return (
    <section className={`py-6 px-4 md:px-8`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-center text-gray-600 italic font-jost text-lg mb-6">
            Cada dólar cuenta. Mueve el slider y descubre cómo tu presupuesto
            transforma completamente la experiencia de tu viaje.
          </p>
        </div>

        {/* Budget Slider */}
        <div className="bg-white rounded-2xl ">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-gray-700 font-jost">
                Presupuesto por persona
              </span>
              <span className="text-2xl font-bold text-gray-900 font-jost">
                US$ {budget}
              </span>
            </div>

            <div className="relative">
              <input
                type="range"
                min="200"
                max="2000"
                step="200"
                value={budget}
                onChange={(e) => handleBudgetChange(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #3b82f6 50%, #8b5cf6 100%)`,
                }}
              />

              {/* Budget range indicators */}
              <div className="flex justify-between mt-2 text-xs text-gray-500 font-jost">
                <span>US$ 200</span>
                <span>US$ 2000</span>
              </div>
            </div>
          </div>

          {/* Current Package Details */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-8 flex flex-col gap-6">
            <div className="flex items-start gap-3 mb-6 justify-between">
              <div>
                <div className="font-bold text-primary-700 text-4xl font-caveat ">
                  {currentPackage.name}
                </div>
                <div className="text-primary-600 font-jost max-w-xs">
                  {currentPackage.subtitle}
                </div>
              </div>
              <p className="text-gray-700 italic text-right text-sm max-w-[300px]">
                {currentPackage.note}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="flex justify-center mb-2">
                  <MapPin className="w-8 h-8 text-primary-600" />
                </div>
                <div className="font-semibold text-gray-900 font-jost">
                  Duración
                </div>
                <div className="text-sm text-primary-700 font-jost">
                  {
                    currentPackage.features.find((f) => f.label === 'Duración')
                      ?.value
                  }
                </div>
              </div>

              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="flex justify-center mb-2">
                  <Plane className="w-8 h-8 text-primary-600" />
                </div>
                <div className="font-semibold text-gray-900 font-jost">
                  Transporte
                </div>
                <div className="text-sm text-primary-700 font-jost">
                  {
                    currentPackage.features.find(
                      (f) => f.label === 'Transporte',
                    )?.value
                  }
                </div>
              </div>

              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="flex justify-center mb-2">
                  <Bed className="w-8 h-8 text-primary-600" />
                </div>
                <div className="font-semibold text-gray-900 font-jost">
                  Alojamiento
                </div>
                <div className="text-sm text-primary-700 font-jost">
                  {
                    currentPackage.features.find(
                      (f) => f.label === 'Alojamiento',
                    )?.value
                  }
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="flex justify-center mb-2">
                  <svg
                    className="w-8 h-8 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="font-semibold text-gray-900 font-jost">
                  Experiencia
                </div>
                <div className="text-sm text-gray-600 font-jost">
                  {budget < 500
                    ? 'Básica pero auténtica'
                    : budget < 800
                      ? 'Equilibrada y flexible'
                      : budget < 1200
                        ? 'Enriquecida y personalizada'
                        : budget < 1700
                          ? 'Premium y curada'
                          : 'Luxury y exclusiva'}
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="flex justify-center mb-2">
                  <svg
                    className="w-8 h-8 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="font-semibold text-gray-900 font-jost">
                  Flexibilidad
                </div>
                <div className="text-sm text-gray-600 font-jost">
                  {budget < 500
                    ? 'Fechas limitadas'
                    : budget < 800
                      ? 'Mayor disponibilidad'
                      : budget < 1200
                        ? 'Alta flexibilidad'
                        : budget < 1700
                          ? 'Sin restricciones'
                          : 'Totalmente personalizable'}
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="flex justify-center mb-2">
                  <svg
                    className="w-8 h-8 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z"
                    />
                  </svg>
                </div>
                <div className="font-semibold text-gray-900 font-jost">
                  Soporte
                </div>
                <div className="text-sm text-gray-600 font-jost">
                  {budget < 500
                    ? 'Guía esencial'
                    : budget < 800
                      ? 'Guía personalizada'
                      : budget < 1200
                        ? 'Experiencias curadas'
                        : budget < 1700
                          ? 'Concierge dedicado'
                          : 'Luxury Travel Advisor'}
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg">
              <div className="flex items-start gap-3">
                <Gift className="w-6 h-6 text-primary-600 mt-1" />
                <div>
                  <div className="font-semibold text-gray-900 mb-2 font-jost">
                    Extras incluidos:
                  </div>
                  <div className="text-sm text-primary-700 font-jost">
                    {
                      currentPackage.features.find((f) => f.label === 'Extras')
                        ?.value
                    }
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-600">{currentPackage.disclaimer}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
