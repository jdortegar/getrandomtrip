'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { gotoBasicConfig, normalizeTierId } from '@/lib/linking';
import type { Tier, PresupuestoContent } from '@/types/planner';

interface PresupuestoProps {
  budgetTier: string | null;
  content: PresupuestoContent;
  plannerId: string;
  setBudgetTier: (tier: string | null) => void;
  setPendingPriceLabel: (label: string | null) => void;
  setStep: (stepIndex: number) => void;
  tiers: Tier[];
  type: string;
}

export default function Presupuesto({
  budgetTier,
  content,
  plannerId,
  setBudgetTier,
  setPendingPriceLabel,
  setStep,
  tiers,
  type,
}: PresupuestoProps) {
  const router = useRouter();

  const handleTierCTA = (tierId: string, priceLabel: string) => {
    const level = normalizeTierId(tierId);

    // Low tiers go directly to basic-config
    if (level === 'essenza' || level === 'modo-explora') {
      gotoBasicConfig(router, {
        fromOrType: type as
          | 'couple'
          | 'solo'
          | 'family'
          | 'group'
          | 'honeymoon'
          | 'paws',
        tierId,
        priceLabel,
      });
      return;
    }

    // Higher tiers: save tier info and proceed to the next step
    setBudgetTier(tiers.find((t) => t.id === tierId)?.name || '');
    setPendingPriceLabel(priceLabel);
    setStep(2); // Go to next step
    document
      .getElementById(plannerId)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section
      className="w-full px-4 md:px-8 py-10 text-gray-900 -mr-[8px] md:pr-0"
      data-testid="tab-presupuesto"
    >
      <div className="text-center mb-8">
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

            {content.categoryLabels.map((label) => (
              <div key={label}>
                <div className="h-[40px] items-center flex">
                  <h4 className="font-semibold text-primary-700 font-jost text-sm">
                    {label}
                  </h4>
                </div>
                <div className="border-t border-primary-200 my-2"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Tier Cards */}
        <div className="flex no-wrap overflow-hidden overflow-x-auto">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className="relative bg-gray-100 transition-all duration-200 min-w-[300px]"
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
                {tier.features.map((feature, idx) => (
                  <div key={idx}>
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
                    className="w-full"
                    onClick={() => handleTierCTA(tier.id, tier.priceLabel)}
                    type="button"
                    variant={budgetTier === tier.id ? 'default' : 'secondary'}
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
