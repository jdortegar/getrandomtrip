'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { gotoBasicConfig, normalizeTierId } from '@/lib/linking';
import { TRAVELER_TYPES } from '@/lib/data/traveler-types';
import type { Tier, PresupuestoContent } from '@/types/planner';
import type { TravelerTypeSlug } from '@/lib/data/traveler-types';

interface PresupuestoProps {
  budgetTier: string | null;
  content?: PresupuestoContent; // Optional since we can get from centralized data
  plannerId: string;
  setBudgetTier: (tier: string | null) => void;
  setPendingPriceLabel: (label: string | null) => void;
  setStep: (stepIndex: number) => void;
  tiers: Tier[];
  type: TravelerTypeSlug;
}

// Helper function to get centralized traveler type data
const getTravelerTypeData = (type: TravelerTypeSlug) => {
  return TRAVELER_TYPES[type];
};

// Helper function to extract unique categories from tier features
const extractCategories = (tiers: Tier[]): string[] => {
  const categorySet = new Set<string>();

  tiers.forEach((tier) => {
    tier.features.forEach((feature) => {
      categorySet.add(feature.title);
    });
  });

  return Array.from(categorySet);
};

// Helper function to find feature by category
const findFeatureByCategory = (
  features: Tier['features'],
  category: string,
) => {
  return features.find((feature) => {
    const featureTitle = feature.title.toLowerCase();
    const categoryLower = category.toLowerCase();
    return (
      featureTitle === categoryLower ||
      featureTitle.includes(categoryLower) ||
      categoryLower.includes(featureTitle)
    );
  });
};

// Tier Card Component
interface TierCardProps {
  tier: Tier;
  categories: string[];
  budgetTier: string | null;
  onTierSelect: (tierId: string, priceLabel: string) => void;
}

const TierCard = ({
  tier,
  categories,
  budgetTier,
  onTierSelect,
}: TierCardProps) => {
  return (
    <div className="relative bg-gray-100 transition-all duration-200 min-w-[350px]">
      <div className="py-12 px-6">
        {/* Plan Name */}
        <div className="text-center h-[80px]">
          <h3 className="text-3xl font-bold text-gray-900 font-caveat">
            {tier.name}
          </h3>
          <p className="text-gray-600 font-jost text-sm">{tier.subtitle}</p>
        </div>

        {/* Pricing */}
        <div className="text-center h-[60px] items-center flex justify-center">
          <div className="font-bold text-xl text-primary-700 font-jost">
            {tier.priceLabel}
          </div>
        </div>

        {/* Features - aligned with categories */}
        {categories.map((category) => {
          const feature = findFeatureByCategory(tier.features, category);
          const featureText = feature?.description || '—';

          return (
            <div key={category}>
              <div className="flex items-center h-[40px] justify-center px-2">
                <span className="text-sm text-gray-700 font-jost text-center">
                  {featureText}
                </span>
              </div>
              <div className="border-t border-gray-200 my-2"></div>
            </div>
          );
        })}

        {/* CTA Button */}
        <div className="text-center mt-10">
          <Button
            className="w-full"
            onClick={() => onTierSelect(tier.id, tier.priceLabel)}
            type="button"
            variant={budgetTier === tier.id ? 'default' : 'secondary'}
          >
            {tier.ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

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

  // Get centralized traveler type data
  const travelerTypeData = React.useMemo(
    () => getTravelerTypeData(type),
    [type],
  );

  // Extract unique categories from tier features
  const categories = React.useMemo(() => extractCategories(tiers), [tiers]);

  // Use centralized content with fallback to props
  const presupuestoContent = React.useMemo(() => {
    return content || travelerTypeData?.planner?.steps?.presupuesto;
  }, [content, travelerTypeData]);

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
    setStep(3); // Go to next step
    document
      .getElementById(plannerId)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section
      className="w-full px-4 md:px-8 py-10 text-gray-900 -mr-[8px] md:pr-0"
      data-testid="tab-presupuesto"
    >
      {/* Header Section */}
      <div className="text-center mb-8 relative">
        <h3
          className="text-xl font-semibold text-neutral-900"
          data-testid="tab3-title"
        >
          {presupuestoContent?.title}
        </h3>
        <p
          className="mt-2 text-sm text-neutral-800 max-w-3xl mx-auto"
          data-testid="tab3-tagline"
        >
          {presupuestoContent?.tagline}
        </p>
        <div className="absolute top-1/2 -translate-y-1/2">
          <Button
            className="text-neutral-900 hover:underline decoration-neutral-400 hover:decoration-neutral-800"
            data-testid="cta-back-to-tab2"
            onClick={() => setStep(2)}
            variant="link"
          >
            ← Volver
          </Button>
        </div>
      </div>

      {/* Pricing Table */}
      <div className="flex no-wrap rounded-md overflow-hidden mx-auto justify-center">
        {/* Categories Header Card */}
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 px-6 py-12 min-w-[200px]">
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
          <div className="h-[60px] text-left items-center flex">
            <h4 className="font-semibold text-primary-700 font-jost text-sm">
              Precio por persona
            </h4>
          </div>

          {/* Feature Categories */}
          {(presupuestoContent?.categoryLabels || categories).map((label) => (
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

        {/* Tier Cards */}
        <div
          className={`flex no-wrap overflow-hidden overflow-x-auto ${tiers.length === 1 ? 'justify-center' : ''}`}
        >
          {tiers.map((tier) => (
            <TierCard
              key={tier.id}
              tier={tier}
              categories={presupuestoContent?.categoryLabels || categories}
              budgetTier={budgetTier}
              onTierSelect={handleTierCTA}
            />
          ))}
        </div>
      </div>

      {/* Footer Message */}
      <div className="text-center mt-10">
        <p className="text-gray-900 text-sm font-jost">
          Selecciona tu presupuesto para continuar con el diseño de tu viaje
        </p>
      </div>
    </section>
  );
}
