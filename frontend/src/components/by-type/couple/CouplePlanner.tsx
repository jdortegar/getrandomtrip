'use client';
import React from 'react';
import { track } from '@/components/common/analytics';
import { ALL_TIERS_CONTENT } from '@/content/experienceTiers';
import ExperienceCard from '@/components/common/ExperienceCard';

const experienceLevels = [
  { id: 'essenza', ...ALL_TIERS_CONTENT.couple.essenza },
  { id: 'explora', ...ALL_TIERS_CONTENT.couple.explora },
  { id: 'exploraPlus', ...ALL_TIERS_CONTENT.couple.exploraPlus },
  { id: 'bivouac', ...ALL_TIERS_CONTENT.couple.bivouac },
  { id: 'atelier', ...ALL_TIERS_CONTENT.couple.atelier },
];

export default function CouplePlanner() {
  return (
    <section id="couple-levels" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <header className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Elige tu nivel Randomtrip
          </h2>
          <p className="mt-3 text-sm md:text-base text-slate-700">
            Selecciona el nivel que mejor se adapta a esta escapada.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {experienceLevels.map((tier) => (
            <ExperienceCard
              key={tier.id}
              tier={tier}
              href={`/packages/by-type/couple?tier=${tier.id}`}
              onSelect={() => {
                track('couple_card_click', { tier: tier.id });
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}