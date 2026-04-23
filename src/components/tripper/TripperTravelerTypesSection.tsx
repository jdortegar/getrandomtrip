import { TravelerTypesCarousel } from '@/components/landing/exploration';
import Section from '@/components/layout/Section';

/** Anchor id for scroll targets (Hero, Planner, HomeInfo CTAs). Use hash: `#tripper-traveler-types`. */
export const TRIPPER_TRAVELER_TYPES_ANCHOR_ID = 'tripper-traveler-types';

interface TripperTravelerTypesSectionProps {
  availableTypes: string[];
  tripperName: string;
  tripperSlug: string | null;
}

export function TripperTravelerTypesSection({
  availableTypes,
  tripperName,
  tripperSlug,
}: TripperTravelerTypesSectionProps) {
  if (!availableTypes?.length) return null;

  return (
    <Section
      eyebrow="Tipos de viajero"
      id={TRIPPER_TRAVELER_TYPES_ANCHOR_ID}
      subtitle={`Explora los paquetes de ${tripperName} por tipo de viajero`}
      title={`Viajes con ${tripperName}`}
    >
      <TravelerTypesCarousel
        availableTypes={availableTypes}
        tripperMode
        tripperSlug={tripperSlug ?? undefined}
      />
    </Section>
  );
}
