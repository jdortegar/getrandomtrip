"use client";

import { useRouter } from "next/navigation";
import { COUPLE_LEVELS } from "@/content/levels";

export default function ExperienceLevels() {
  const router = useRouter();

  return (
    <section id="experience-levels" className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-3xl text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Comienza a planear la escapada
        </h2>
        <p className="text-muted-foreground mt-3">
          💡 Lo único que definís en este paso es el presupuesto por persona (base doble).
          Ese será tu techo. El resto… corre por nuestra cuenta.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {COUPLE_LEVELS.map((lvl) => (
          <article
            key={lvl.id}
            className="rounded-2xl border bg-white/60 backdrop-blur p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
          >
            <div>
              <h3 className="text-xl font-semibold">{lvl.name}</h3>
              {lvl.subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{lvl.subtitle}</p>
              )}
              <p className="text-2xl font-bold mt-4">Hasta {lvl.price} USD</p>
              <p className="text-xs text-muted-foreground">por persona</p>

              <ul className="mt-4 space-y-2 text-sm">
                {lvl.features.map((f, i) => (
                  <li key={i} className="leading-snug">• {f}</li>
                ))}
              </ul>

              {lvl.priceFootnote && (
                <p className="text-xs text-muted-foreground mt-4">{lvl.priceFootnote}</p>
              )}
            </div>

            <button
              onClick={() => router.push(`/journey/experience-level?tier=${lvl.id}`)}
              className="mt-6 w-full rounded-full bg-black text-white py-3 text-sm font-semibold hover:bg-black/90"
            >
              {lvl.cta ?? "Reservar"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}