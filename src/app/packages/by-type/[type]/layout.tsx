import type { Metadata } from 'next';

/**
 * Canonicalización local SOLO para este archivo:
 * (no tiene que coincidir con las claves del JSON; esto es para slug/UI)
 */
const ALIAS: Record<string, string> = {
  // family
  families: 'family',
  familia: 'family',

  // honeymoon
  honeymoons: 'honeymoon',

  // group
  groups: 'group',
  grupo: 'group',

  // parejas → couple
  parejas: 'couple',
  pareja: 'couple',
  couples: 'couple',

  // solo
  solos: 'solo',

  // paws
  paw: 'paws',
};

const canonicalType = (raw: string) => {
  const k = raw?.toLowerCase?.();
  return (ALIAS[k] ?? k) as string;
};

// --- Enhanced Metadata with SEO ---
export async function generateMetadata({
  params,
}: {
  params: { type: string };
}): Promise<Metadata> {
  const type = canonicalType(params.type);

  const metadataMap: Record<
    string,
    { title: string; description: string; keywords: string[] }
  > = {
    couple: {
      title: 'En Pareja | Randomtrip',
      description:
        'Descubre destinos románticos perfectos para viajar en pareja. Experiencias únicas y memorables.',
      keywords: [
        'viajes en pareja',
        'destinos románticos',
        'viajes',
        'turismo',
      ],
    },
    solo: {
      title: 'Solo | Randomtrip',
      description:
        'Viaja solo y descubre el mundo a tu ritmo. Aventuras personalizadas para viajeros independientes.',
      keywords: [
        'viajar solo',
        'viajes independientes',
        'aventuras',
        'turismo',
      ],
    },
    family: {
      title: 'En Familia | Randomtrip',
      description:
        'Planes familiares perfectos para todas las edades. Experiencias seguras y divertidas.',
      keywords: [
        'viajes familiares',
        'planes con niños',
        'turismo familiar',
        'vacaciones',
      ],
    },
    honeymoon: {
      title: 'Honeymoon | Randomtrip',
      description:
        'Luna de miel perfecta en destinos de ensueño. Experiencias románticas inolvidables.',
      keywords: [
        'luna de miel',
        'destinos románticos',
        'viajes de novios',
        'honeymoon',
      ],
    },
    group: {
      title: 'En Grupo | Randomtrip',
      description:
        'Viajes grupales perfectos para amigos. Aventuras compartidas y experiencias únicas.',
      keywords: [
        'viajes en grupo',
        'viajes con amigos',
        'aventuras grupales',
        'turismo',
      ],
    },
    paws: {
      title: 'Paws | Randomtrip',
      description:
        'Viajes pet-friendly para ti y tu mascota. Destinos que aman a los animales.',
      keywords: [
        'viajes con mascotas',
        'pet-friendly',
        'turismo con animales',
        'viajes',
      ],
    },
  };

  const meta = metadataMap[type] ?? {
    title: 'Randomtrip',
    description: 'Descubre destinos únicos y experiencias memorables.',
    keywords: ['viajes', 'turismo', 'destinos', 'experiencias'],
  };

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords.join(', '),
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: 'website',
      locale: 'es_ES',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
    },
    alternates: {
      canonical: `/packages/by-type/${type}`,
    },
  };
}

export default function TypeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
