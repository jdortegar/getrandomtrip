'use client';

import Image from 'next/image';
import { TRAVELLER_TYPE_OPTIONS } from '@/lib/constants/traveller-types';
import { Button } from '@/components/ui/Button';

interface TravelerTypeStepProps {
  options: typeof TRAVELLER_TYPE_OPTIONS;
  onContinue: () => void;
  tripperName: string;
  handlePlanData: (travellerType: string) => void;
  onBack: () => void;
}

export default function TravelerTypeStep({
  options,
  handlePlanData,
  onContinue,
  tripperName,
  onBack,
}: TravelerTypeStepProps) {
  return (
    <section className="rt-container px-4 md:px-8 py-10 relative">
      <div className="space-y-8">
        <div className="text-center mb-8 relative">
          <h3
            className="text-xl font-semibold text-neutral-900"
            data-testid="tab3-title"
          >
            ¿Qué tipo de viaje estás planeando?
          </h3>
          <p
            className="mt-2 text-sm text-neutral-800 max-w-3xl mx-auto"
            data-testid="tab3-tagline"
          >
            Selecciona el estilo de viaje que {tripperName} diseñará para ti
          </p>
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <Button
              className="text-neutral-900 hover:underline decoration-neutral-400 hover:decoration-neutral-800"
              data-testid="cta-back-to-tab2"
              onClick={onBack}
              variant="link"
            >
              ← Volver
            </Button>
          </div>
        </div>

        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-6">
          {options.map((opt) => (
            <button
              key={opt.key}
              aria-label={`Seleccionar viaje ${opt.title}`}
              className="group relative h-80 w-full max-w-sm overflow-hidden rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:w-80 cursor-pointer"
              onClick={() => {
                handlePlanData(opt.key);
                onContinue();
              }}
            >
              <Image
                alt={opt.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                fill
                src={opt.img}
              />
              <div className="absolute inset-0 z-10 rounded-lg bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 z-20 p-6 text-white">
                <h4 className="text-2xl font-bold font-caveat">{opt.title}</h4>
                <p className="mt-1 text-sm text-white/90">{opt.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
