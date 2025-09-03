'use client';

import { useMemo } from 'react';
import Link from 'next/link';

type LevelId = 'essenza' | 'explora' | 'explora-plus' | 'exploraPlus' | 'bivouac' | 'atelier';

const ESCAPES = [
  {
    key: 'trails-nature',
    title: 'Senderos & Naturaleza 🌲🐾',
    img: 'https://images.unsplash.com/photo-1747133462919-ea91d748a2e2',
    copy: 'Rutas y paisajes pensados para caminar juntos, sin correa al tiempo.',
  },
  {
    key: 'dog-friendly-beaches',
    title: 'Playas Dog-Friendly 🏖️🐕',
    img: 'https://plus.unsplash.com/premium_photo-1671496450445-01c3f9088b8a',
    copy: 'Arena, mar y carreras infinitas. El paraíso también tiene huellas.',
  },
  {
    key: 'pet-lover-cities',
    title: 'Ciudades Pet Lovers 🏙️🐩',
    img: 'https://plus.unsplash.com/premium_photo-1679519057198-81180a5419a8',
    copy: 'Explorar urbes donde cada café, parque y esquina los recibe como locales.',
  },
  {
    key: 'outdoor-adventure',
    title: 'Aventura Outdoor ⛰️🐕‍🦺',
    img: 'https://images.unsplash.com/photo-1629952071864-c7aa7cf93e97',
    copy: 'Trekking, camping y escapadas off-road, con tu compañero de cuatro patas al lado.',
  },
  {
    key: 'relax-wellness',
    title: 'Relax & Bienestar 🛶🐾',
    img: 'https://plus.unsplash.com/premium_photo-1663036405014-3b4f2713633c',
    copy: 'Hoteles pet-friendly, spas con calma y rincones donde el descanso también es compartido.',
  },
  {
    key: 'food-getaways',
    title: 'Escapadas Gastronómicas 🍲🐕',
    img: 'https://plus.unsplash.com/premium_photo-1679503586519-49c94c258b74',
    copy: 'Descubrir sabores locales en destinos donde las mascotas también tienen mesa reservada.',
  },
  {
    key: 'rural-farm',
    title: 'Trips Rurales & Granja 🐓🐶',
    img: 'https://plus.unsplash.com/premium_photo-1666275372016-42a8ad9744c5',
    copy: 'Volver a lo simple: aire puro, espacios abiertos y la alegría de lo natural.',
  },
  {
    key: 'dog-events',
    title: 'Dog Events & Comunidades 🎪🐕',
    img: 'https://images.unsplash.com/photo-1580230273708-4e7b8f6d63c0',
    copy: 'Viajes que giran en torno a festivales, encuentros o actividades caninas.',
  },
] as const;

function normalizeLevel(id: LevelId): 'essenza' | 'explora' | 'explora-plus' | 'bivouac' | 'atelier' {
  if (id === 'exploraPlus') return 'explora-plus';
  return id as any;
}

export default function PawsEscapeTypeTab({
  levelId,
  onBackToInteractive,
}: {
  levelId: LevelId;
  onBackToInteractive?: () => void;
}) {
  const isPremium = useMemo(() => {
    const norm = normalizeLevel(levelId);
    return norm === 'explora-plus' || norm === 'bivouac' || norm === 'atelier';
  }, [levelId]);

  if (!isPremium) {
    // Seguridad: si alguien llega directo por URL y no es premium, no mostrar nada relevante.
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">
        <div className="rounded-xl border bg-white p-6 text-center">
          <p className="text-sm text-neutral-600">
            Esta etapa está disponible desde <strong>Explora+</strong> en adelante.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
      {/* Back to Tab 2 */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => onBackToInteractive && onBackToInteractive()}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-neutral-200 text-neutral-800 px-4 text-sm font-medium hover:bg-neutral-300"
        >
          ← Volver a Más detalles
        </button>
      </div>

      <div className="text-center mb-8">
        <h3 className="text-2xl md:text-3xl font-bold text-neutral-900">Tipo de escapada</h3>
        <p className="text-neutral-600 mt-2">
          Elijan el mood del viaje. Al pasar el mouse, verán un detalle y podrán continuar.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {ESCAPES.map((card) => (
          <CardFlip key={card.key} item={card} levelId={levelId} />
        ))}
      </div>
    </div>
  );
}

function CardFlip({
  item,
  levelId,
}: {
  item: { key: string; title: string; img: string; copy: string };
  levelId: LevelId;
}) {
  // Construimos la URL a basic-config con el escapeType
  const href = (() => {
    const params = new URLSearchParams({
      from: 'paws',
      level: String(levelId),
      escapeType: item.key,
    });
    return `/journey/basic-config?${params.toString()}`;
  })();

  return (
    <div className="group [perspective:1200px]">
      <div className="relative h-64 w-full rounded-2xl shadow-lg transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
        {/* FRONT */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl [backface-visibility:hidden]">
          <img src={item.img} alt={item.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h4 className="text-white font-semibold drop-shadow">{item.title}</h4>
          </div>
        </div>

        {/* BACK */}
        <div className="absolute inset-0 rounded-2xl bg-white p-4 flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden]">
          <p className="text-sm text-neutral-700">{item.copy}</p>
          <Link
            href={href}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800"
          >
            Continuar →
          </Link>
        </div>
      </div>
    </div>
  );
}
