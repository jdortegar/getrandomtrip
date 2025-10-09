'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { coupleTiers } from '@/lib/data/coupleTiers';
import { gotoBasicConfig, normalizeTierId } from '@/lib/linking';

interface PresupuestoProps {
  budgetTier: string | null;
  setBudgetTier: (tier: string | null) => void;
  setPendingPriceLabel: (label: string | null) => void;
  setStep: (stepIndex: number) => void;
}

export default function Presupuesto({
  budgetTier,
  setBudgetTier,
  setPendingPriceLabel,
  setStep,
}: PresupuestoProps) {
  const router = useRouter();
  const tiers = coupleTiers;

  const handleTierCTA = (tierId: string, priceLabel: string) => {
    const level = normalizeTierId(tierId);

    // Low tiers go directly to basic-config
    if (level === 'essenza' || level === 'modo-explora') {
      gotoBasicConfig(router, { fromOrType: 'couple', tierId, priceLabel });
      return;
    }

    // Higher tiers: save tier info and proceed to the next step
    setBudgetTier(tiers.find((t) => t.id === tierId)?.name || '');
    setPendingPriceLabel(priceLabel);
    setStep(2); // Go to next step (La Excusa)
    document
      .getElementById('couple-planner')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section
      data-testid="tab-presupuesto"
      className="w-full px-4 md:px-8 py-10 text-gray-900 -mr-[8px] md:pr-0"
    >
      <div className="text-center mb-8">
        <h3
          data-testid="tab3-title"
          className="text-center text-xl font-semibold text-neutral-900"
        >
          Cuánto quieres gastar?
        </h3>
        <p
          data-testid="tab3-tagline"
          className="mt-2 text-center text-sm text-neutral-800 max-w-3xl mx-auto"
        >
          Lo único que definen acá es el presupuesto por persona para pasaje y
          alojamiento. Ese será su techo. Del resto… nos ocupamos nosotros.
        </p>
      </div>

      <div className="flex no-wrap rounded-md overflow-hidden">
        {/* Categories Header Card */}
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 px-6 py-12 min-w-[200px]">
          <div className="">
            {/* Plan Name */}
            <div className="h-[80px] text-left">
              <h3 className="text-2xl font-bold text-primary-700 font-jost">
                Planes
              </h3>
              <p className="text-primary-600 font-jost text-[12px]">
                Elige tu presupuesto
              </p>
            </div>

            {/* Pricing Category */}
            <div className="h-[60px] text-left">
              <h4 className="font-semibold text-primary-700 font-jost text-sm">
                Precio por persona
              </h4>
              <div className="text-sm text-primary-600 font-jost">
                Incluye vuelo y alojamiento
              </div>
            </div>

            <div className="h-[40px] flex items-center">
              <h4 className="font-semibold text-primary-700 font-jost text-sm">
                Duración del viaje
              </h4>
            </div>
            <div className="border-t border-primary-200 my-2"></div>

            <div className="h-[40px] items-center flex">
              <h4 className="font-semibold text-primary-700 font-jost text-sm">
                Transporte
              </h4>
            </div>
            <div className="border-t border-primary-200 my-2"></div>

            <div className="h-[40px] items-center flex">
              <h4 className="font-semibold text-primary-700 font-jost text-sm">
                Alojamiento
              </h4>
            </div>
            <div className="border-t border-primary-200 my-2"></div>

            <div className="h-[40px] items-center flex">
              <h4 className="font-semibold text-primary-700 font-jost text-sm">
                Experiencias únicas
              </h4>
            </div>
            <div className="border-t border-primary-200 my-2"></div>
            <div className="h-[40px] items-center flex">
              <h4 className="font-semibold text-primary-700 font-jost text-sm">
                Extras
              </h4>
            </div>
            <div className="border-t border-primary-200 my-2"></div>
            <div className="h-[40px] items-center flex">
              <h4 className="font-semibold text-primary-700 font-jost text-sm">
                Destination Decoded
              </h4>
            </div>
          </div>
        </div>

        <div className="flex no-wrap overflow-hidden overflow-x-auto ">
          {/* Pricing Cards */}
          {tiers.map((tier, index) => (
            <div
              key={tier.id}
              className={`relative bg-gray-100 transition-all duration-200 min-w-[300px]`}
            >
              <div className="py-12 px-6">
                {/* Plan Name */}
                <div className="text-center h-[80px]">
                  <h3 className="text-3xl font-bold text-gray-900 font-caveat">
                    {tier.name}
                  </h3>
                  <p className="text-gray-600 font-jost text-sm">
                    {tier.subtitle}
                  </p>
                </div>

                {/* Pricing */}
                <div className="text-center h-[60px]">
                  <div className="font-bold text-xl text-primary-700 font-jost">
                    {tier.priceLabel}
                  </div>
                </div>

                {/* Features */}
                {tier.features.map((feature, featureIndex) => (
                  <div key={featureIndex}>
                    <div className="flex items-center h-[40px] justify-center">
                      <span className="text-sm text-gray-700 font-jost text-center">
                        {feature.text}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 my-2"></div>
                  </div>
                ))}

                {/* CTA Button */}
                <div className="text-center mt-10">
                  <Button
                    type="button"
                    variant={budgetTier === tier.id ? 'default' : 'secondary'}
                    className="w-full"
                    onClick={() => {
                      handleTierCTA(tier.id, tier.priceLabel);
                    }}
                  >
                    {tier.ctaLabel}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <p className="text-gray-900 text-sm mt-10 font-jost">
          Selecciona tu presupuesto para continuar con el diseño de tu viaje
        </p>
      </div>
    </section>
  );
}
