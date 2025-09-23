'use client';

import React from 'react';
import { Shield, Clock, CreditCard, Heart } from 'lucide-react';

// Types
export type TrustSignalVariant = 'default' | 'compact' | 'minimal';

export interface TrustSignalItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  description: string;
}

export interface TrustSignalsProps {
  className?: string;
  variant?: TrustSignalVariant;
  showDescriptions?: boolean;
}

export interface TrustSignalProps {
  signal: TrustSignalItem;
  variant?: TrustSignalVariant;
  showDescription?: boolean;
  className?: string;
}

// Constants
const TRUST_SIGNALS_CONSTANTS = {
  SIGNALS: [
    {
      id: 'trusted',
      icon: Shield,
      text: 'Confiado por viajeros',
      description: 'Miles de viajeros ya vivieron la experiencia Random Trip.',
    },
    {
      id: 'support',
      icon: Clock,
      text: 'Atención humana 24/7',
      description:
        'Siempre estamos para ayudarte, antes, durante y después de tu viaje.',
    },
    {
      id: 'secure-payments',
      icon: CreditCard,
      text: 'Pagos seguros',
      description:
        'Tus transacciones están protegidas con la última tecnología.',
    },
    {
      id: 'pet-friendly',
      icon: Heart,
      text: 'Pet-friendly ready',
      description: 'Viaja con tu mejor amigo, tenemos opciones para todos.',
    },
  ] as const,

  SECTION_ARIA_LABEL: 'Sección de señales de confianza',
} as const;

// TrustSignal Component
function TrustSignal({
  signal,
  variant = 'default',
  showDescription = false,
  className = '',
}: TrustSignalProps) {
  const Icon = signal.icon;

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl bg-white  hover:border-primary/20 hover:shadow-md transition-all duration-300 whitespace-nowrap`}
    >
      <Icon className="h-6 w-6 text-primary flex-shrink-0" />
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-neutral-800">
          {signal.text}
        </span>
        {showDescription && (
          <p className="text-xs text-neutral-500">{signal.description}</p>
        )}
      </div>
    </div>
  );
}

// Main TrustSignals Component
export default function TrustSignals({
  className = '',
  variant = 'default',
  showDescriptions = false,
}: TrustSignalsProps) {
  // Create duplicated signals for infinite scroll
  const duplicatedSignals = [
    ...TRUST_SIGNALS_CONSTANTS.SIGNALS,
    ...TRUST_SIGNALS_CONSTANTS.SIGNALS,
  ];

  return (
    <section
      aria-label={TRUST_SIGNALS_CONSTANTS.SECTION_ARIA_LABEL}
      className={`py-8 ${className}`.trim()}
    >
      <div className="overflow-hidden">
        <div className="flex animate-infinite-scroll gap-8">
          {duplicatedSignals.map((signal, index) => (
            <TrustSignal
              key={`${signal.id}-${index}`}
              signal={signal}
              variant={variant}
              showDescription={showDescriptions}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
