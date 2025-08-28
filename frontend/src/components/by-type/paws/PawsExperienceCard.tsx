// frontend/src/components/by-type/paws/PawsExperienceCard.tsx
'use client';
import Link from 'next/link';

export type Props = {
  id: string;
  title: string;
  cta: string;
  /** “Techo” referencial en USD para mostrar como “Desde/Top” */
  top?: number;

  /** Campos opcionales que PawsPlanner pasa con defaults por seguridad */
  duration?: string;
  transport?: string;
  accommodation?: string;
  extras?: string;
  description?: string;

  /** NUEVO: lista de bullets rica; si viene, tiene prioridad para mostrar */
  bullets?: string[];

  /** handler para que el contenedor defina la acción (cambiar tab, scroll, tracking) */
  onClick?: () => void;
};

export default function PawsExperienceCard({
  id,
  title,
  cta,
  top,
  duration,
  transport,
  accommodation,
  extras,
  description,
  bullets,
  onClick,
}: Props) {
  const computedBullets =
    bullets && bullets.length > 0
      ? bullets
      : [
          duration ? `Duración: ${duration}` : undefined,
          transport ? `Transporte: ${transport}` : undefined,
          accommodation ? `Alojamiento: ${accommodation}` : undefined,
          extras ? `Extras: ${extras}` : undefined,
          description,
        ].filter(Boolean) as string[];

  return (
    <article
      id={`paws-card-${id}`}
      className="group relative flex flex-col justify-between rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm backdrop-blur transition-all hover:shadow-lg"
    >
      <header className="mb-4">
        <h3 className="font-display text-xl leading-tight">{title}</h3>
        {typeof top === 'number' && top > 0 && (
          <p className="mt-1 text-sm text-neutral-600">
            Presupuesto techo ref.: <span className="font-semibold">USD {top.toLocaleString('en-US')}</span>
          </p>
        )}
      </header>

      {computedBullets.length > 0 && (
        <ul className="mb-6 space-y-2 text-sm text-neutral-700">
          {computedBullets.map((b, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-[6px] inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-neutral-400" />
              <span dangerouslySetInnerHTML={{ __html: b }} />
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-auto">
        <Link
          href="/packages/by-type/paws#paws-planner"
          onClick={(e) => {
            e.preventDefault();
            onClick?.();
          }}
          className="inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-5 py-2 font-semibold text-neutral-900 transition-colors hover:bg-[#EACD65]"
        >
          {cta}
        </Link>
      </footer>

      {/* Halo decorativo al hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5 transition group-hover:ring-black/10" />
    </article>
  );
}
