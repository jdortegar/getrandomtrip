'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import CoupleAlmaDetails from '@/components/by-type/couple/CoupleAlmaDetails';
import { gotoBasicConfig } from '@/lib/linking';

interface AfinarDetallesProps {
  coupleAlma: string | null;
  budgetTier: string | null;
  pendingPriceLabel: string | null;
  setStep: (stepIndex: number) => void;
}

export default function AfinarDetalles({
  coupleAlma,
  budgetTier,
  pendingPriceLabel,
  setStep,
}: AfinarDetallesProps) {
  const router = useRouter();

  return (
    <section
      data-testid="tab-pareja-alma"
      className="max-w-7xl mx-auto px-4 md:px-8 py-10 relative"
    >
      <div className="text-center mb-8 relative">
        <h3
          data-testid="tab3-title"
          className="text-center text-xl font-semibold text-neutral-900"
        >
          Afinen sus detalles
        </h3>
        <p
          data-testid="tab3-tagline"
          className="mt-2 text-center text-sm text-neutral-800 max-w-3xl mx-auto"
        >
          Elijan las opciones que les gustan para crear su viaje.
        </p>
        <div className="mt-8 text-center absolute left-0 top-1/2 -translate-y-1/2">
          <Button
            data-testid="cta-back-to-tab2"
            variant="link"
            className="text-neutral-900 hover:underline decoration-neutral-400 hover:decoration-neutral-800"
            onClick={() => setStep(0)}
          >
            ← Volver
          </Button>
        </div>
      </div>
      <CoupleAlmaDetails
        coupleKey={coupleAlma!}
        budgetTier={budgetTier}
        onBack={() => {
          setStep(1); // Go back to La Excusa
          document
            .getElementById('couple-planner')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
        onContinue={(selectedKeys) => {
          // Final navigation for higher tiers
          gotoBasicConfig(router, {
            fromOrType: 'couple',
            tierId: budgetTier!,
            priceLabel: pendingPriceLabel!,
            extra: {
              coupleAlma: coupleAlma!,
              almaOptions: selectedKeys.join(','),
            },
          });
        }}
      />
    </section>
    // <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
    //   <div className="rounded-xl border border-neutral-200 bg-white/85 backdrop-blur p-6">
    //     <p className="text-neutral-800">
    //       Por favor, seleccionen un alma de viaje primero.
    //     </p>
    //     <div className="mt-8 text-center">
    //       <Button
    //         variant="link"
    //         className="text-neutral-900 underline decoration-neutral-400 hover:decoration-neutral-800"
    //         onClick={() => setStep(1)}
    //       >
    //         ← Volver
    //       </Button>
    //     </div>
    //   </div>
    // </section>
  );
}
