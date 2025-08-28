"use client";

import Link from "next/link";
import clsx from "clsx";

type Traveller = {
  key: "couple" | "solo" | "family" | "group" | "honeymoon" | "paws";
  title: string;
  href: string;
  base: string; // nombre base del archivo sin extensión
  alt: string;
};

const FALLBACK =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%23e5e7eb" offset="0%"/><stop stop-color="%23d1d5db" offset="100%"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23g)"/></svg>';

const travellers: Traveller[] = [
  { key: "couple",    title: "Couple",    href: "/packages/by-type/couple",    base: "couple-card",    alt: "Viajes sorpresa en pareja" },
  { key: "solo",      title: "Solo",      href: "/packages/by-type/solo",      base: "solo-card",      alt: "Viajes sorpresa en solitario" },
  { key: "family",    title: "Family",    href: "/packages/by-type/family",    base: "family-card",    alt: "Viajes sorpresa en familia" },
  { key: "group",     title: "Group",     href: "/packages/by-type/group",     base: "group-card",     alt: "Viajes sorpresa en grupo" },
  { key: "honeymoon", title: "Honeymoon", href: "/packages/by-type/honeymoon", base: "honeymoon-card", alt: "Viajes sorpresa honeymoon" },
  { key: "paws",      title: "Paws",      href: "/packages/by-type/paws",      base: "paws-card",      alt: "Viajes con mascotas" },
];

export default function ByTravellerRow() {
  return (
    <div className="relative w-full overflow-x-auto lg:overflow-visible">
      <ul
        className="flex items-stretch gap-0 lg:justify-center [--overlap:-2rem] lg:[--overlap:-3rem] snap-x snap-mandatory"
        aria-label="Tipos de viaje"
      >
        {travellers.map((t, idx) => (
          <li
            key={t.key}
            className={clsx(
              "group relative first:ml-0 ml-[var(--overlap)] transition-transform duration-300 ease-out will-change-transform",
              "hover:z-20 focus-within:z-20 hover:-translate-y-2 lg:rotate-[-1.5deg] lg:hover:rotate-0 snap-center"
            )}
            style={{ marginLeft: idx === 0 ? 0 : ("var(--overlap)" as any) }}
          >
            <Link
              href={t.href}
              className="block w-[260px] h-[360px] lg:w-[300px] lg:h-[420px] rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5 bg-white"
            >
              <div className="relative h-full">
                {/* Imagen con soporte webp/jpg + fallback inline */}
                <picture>
                  <source
                    srcSet={`/images/journey-types/${t.base}.webp`}
                    type="image/webp"
                  />
                  <img
                    src={`/images/journey-types/${t.base}.jpg`}
                    alt={t.alt}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK;
                    }}
                  />
                </picture>

                {/* Overlay para legibilidad del título */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />

                {/* Título */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="inline-flex rounded-xl bg-white/90 px-3 py-1 text-sm font-semibold text-neutral-900 shadow">
                    {t.title}
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}