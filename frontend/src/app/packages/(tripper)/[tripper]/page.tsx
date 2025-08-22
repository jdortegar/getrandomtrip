// src/app/packages/(tripper)/[tripper]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Hardcode temporal de slugs válidos para evitar depender de content/trippers
const TRIPPER_SLUGS = [
  "ale-ramirez",
  "ilse-seaman",
  "cinthya-chavez",
  "horacio-teran",
  "sara-sanchez",
  "lucia-ortega",
  "mateo-campos",
  "renata-silva",
  "tomas-ibarra",
];

export function generateStaticParams() {
  return TRIPPER_SLUGS.map((t) => ({ tripper: t }));
}

// Utilidad simple para mostrar el nombre legible desde el slug
function slugToTitle(slug: string) {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: { tripper: string };
}): Promise<Metadata> {
  const titleBase = TRIPPER_SLUGS.includes(params.tripper)
    ? `${slugToTitle(params.tripper)} | Randomtrip`
    : "Randomtrip";
  return { title: titleBase };
}

export default function Page({ params }: { params: { tripper: string } }) {
  const { tripper } = params;
  if (!TRIPPER_SLUGS.includes(tripper)) return notFound();

  const displayName = slugToTitle(tripper);

  // Lienzo en blanco: sin imágenes, sin CTA, sin tiers, sin handlers.
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-semibold tracking-tight">{displayName}</h1>
        <p className="mt-2 text-slate-600">
          Perfil del Tripper — estructura base para empezar desde cero.
        </p>
      </header>

      {/* Sección de video (placeholder) */}
      <section className="max-w-5xl mx-auto px-4 py-8 border-t">
        <h2 className="text-xl font-medium">Video</h2>
        <div className="mt-4 h-56 w-full rounded-xl border border-dashed grid place-items-center">
          <span className="text-sm text-slate-500">Placeholder de video</span>
        </div>
      </section>

      {/* Sección About (placeholder) */}
      <section className="max-w-5xl mx-auto px-4 py-8 border-t">
        <h2 className="text-xl font-medium">Sobre {displayName}</h2>
        <p className="mt-4 text-slate-600">
          Aquí irá la bio/descripción del Tripper (pendiente de definir).
        </p>
      </section>

      {/* Travel Specialties (placeholder) */}
      <section className="max-w-5xl mx-auto px-4 py-8 border-t">
        <h2 className="text-xl font-medium">Travel Specialties</h2>
        <ul className="mt-4 list-disc pl-5 text-slate-600">
          <li>Especialidad 1 (por definir)</li>
          <li>Especialidad 2 (por definir)</li>
          <li>Especialidad 3 (por definir)</li>
        </ul>
      </section>

      {/* Mapa (placeholder) */}
      <section className="max-w-5xl mx-auto px-4 py-8 border-t">
        <h2 className="text-xl font-medium">Mapa de lugares visitados</h2>
        <div className="mt-4 h-72 w-full rounded-xl border border-dashed grid place-items-center">
          <span className="text-sm text-slate-500">Placeholder de mapa</span>
        </div>
      </section>

      {/* Niveles (placeholder) */}
      <section className="max-w-5xl mx-auto px-4 py-8 border-t">
        <h2 className="text-xl font-medium">Selecciona tu Nivel de Experiencia</h2>
        <p className="mt-2 text-slate-600">
          Aquí irán las tarjetas de niveles/paquetes más adelante.
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 rounded-xl border border-dashed grid place-items-center">
            <span className="text-sm text-slate-500">Tarjeta nivel (placeholder)</span>
          </div>
          <div className="h-32 rounded-xl border border-dashed grid place-items-center">
            <span className="text-sm text-slate-500">Tarjeta nivel (placeholder)</span>
          </div>
        </div>
      </section>

      <footer className="max-w-5xl mx-auto px-4 py-16 border-t">
        <p className="text-sm text-slate-500">
          Base limpia sin imágenes ni handlers. Lista para diseñar.
        </p>
      </footer>
    </main>
  );
}