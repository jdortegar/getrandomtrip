"use client";

import Link from "next/link";
import { COUPLE_LEVELS } from "@/content/levels";
import SectionHeading from "@/components/ui/SectionHeading";

export default function ExperienceLevels() {
  return (
    <section id="planes" className="relative scroll-mt-16 bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-20">
        <SectionHeading
          title="Comienza a planear la escapada"
          subtitle="💡 Lo único que definís en este paso es el presupuesto por persona (base doble). Ese será tu techo. El resto… corre por nuestra cuenta."
          className="text-white/80"
        />

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {COUPLE_LEVELS.map((lvl) => (
            <article
              key={lvl.id}
              className="rounded-2xl bg-white/8 p-6 ring-1 ring-white/10 transition hover:bg-white/12 hover:shadow-soft flex flex-col"
            >
              <h3 className="font-display text-xl tracking-tightish">{lvl.name}</h3>
              <p className="text-white/80 text-sm">{lvl.subtitle}</p>

              <div className="mt-6">
                <div className="font-display text-2xl leading-tight">
                  {lvl.priceLabel}
                </div>
                <span className="block text-xs text-white/60">por persona</span>
              </div>

              <ul className="mt-5 space-y-2 text-sm">
                {(lvl.features ?? []).map((f, i) => (
                  <li key={i} className="leading-snug">• {f}</li>
                ))}
              </ul>

              {lvl.priceFootnote && (
                <p className="mt-4 text-xs text-white/60">{lvl.priceFootnote}</p>
              )}

              <Link
                href={`/journey/experience-level?tier=${lvl.id}&origin=couple`}
                className="btn-card mt-auto"
              >
                {lvl.cta}
                <span className="ml-2 transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}