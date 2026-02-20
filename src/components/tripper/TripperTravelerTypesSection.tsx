import { TravelerTypesCarousel } from '@/components/landing/exploration';
import Section from '@/components/layout/Section';

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
      id="tripper-traveler-types"
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
