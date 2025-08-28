"use client";

import Link from "next/link";
import { COUPLE_LEVELS } from "@/content/levels";
import SectionHeading from "@/components/ui/SectionHeading";

// Tipo flexible que cubre las variantes que vi en tu contenido
type CoupleLevel = {
  id: string;
  name?: string;
  title?: string;
  subtitle?: string;
  priceLabel?: string;
  priceFootnote?: string;
  features?: string[];
  closingLine?: string;
  ctaLabel?: string; // antes algunos tenían "cta"
};

// Evita que TS infiera never[] si el tipo de COUPLE_LEVELS es complejo
const LEVELS: CoupleLevel[] = (COUPLE_LEVELS as unknown as CoupleLevel[]) ?? [];

export default function ExperienceLevels() {
  return (
    <section id="planes" className="relative scroll-mt-16 bg-white text-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-20">
        <div className="text-white">
          <SectionHeading
            title="✨ Comiencen a planear su escapada"
            subtitle="💡 Lo único que definen en este paso es el presupuesto por persona. Ese será su techo. El resto… corre por nuestra cuenta."
          />
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {LEVELS.map((lvl) => (
            <article
              key={lvl.id}
              className="rounded-2xl bg-white p-6 border border-gray-200 shadow-md transition hover:shadow-lg hover:scale-[1.02] flex flex-col"
            >
              <h3 className="font-display text-xl tracking-tightish font-bold">
                {lvl.name ?? lvl.title ?? "—"}
              </h3>
              <p className="text-gray-700 text-sm">{lvl.subtitle ?? ""}</p>

              <div className="mt-6">
                <div className="font-display text-3xl leading-tight font-bold text-[var(--rt-terracotta)]">
                  {lvl.priceLabel ?? ""}
                </div>
                <span className="block text-xs text-gray-900">{lvl.priceFootnote ?? ""}</span>
              </div>

              <ul className="mt-5 space-y-2 text-sm">
                {(lvl.features ?? []).map((f, i) => (
                  <li key={i} className="leading-snug">
                    • {f}
                  </li>
                ))}
              </ul>

              {lvl.closingLine && (
                <p className="mt-3 text-neutral-700 text-sm leading-relaxed">{lvl.closingLine}</p>
              )}

              <Link
                href={`/journey/basic-config?from=tripper&type=couple&level=${lvl.id}&price=${encodeURIComponent(
                  lvl.priceLabel ?? ""
                )}`}
                className="btn-card mt-auto"
              >
                {lvl.ctaLabel ?? "Elegir"}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
