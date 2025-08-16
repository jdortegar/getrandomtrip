"use client";

import SectionHeading from "@/components/ui/SectionHeading"; // Import SectionHeading

const TESTIMONIALS = [
  { quote: "No supimos el destino hasta llegar al aeropuerto. Fue perfecto para nosotros dos.", author: "Agustina & Leo" },
  { quote: "El nivel Explora+ fue un golazo: detalles, experiencias y cero fricción.", author: "Caro & Eze" },
  { quote: "Nos cuidaron en todo. Volvimos con historias imposibles de contar sin gestos.", author: "Vicky & Nacho" },
];

export default function Testimonials() {
  const goLevels = () => {
    const el = document.getElementById("experience-levels");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="bg-neutral-50 py-16">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          title="Lo que dicen quienes ya viajaron"
          align="center"
        />

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.author} className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-black/5">
              <blockquote className="text-neutral-800 leading-relaxed">{t.quote}</blockquote>
              <figcaption className="mt-4 text-sm text-neutral-500">— {t.author}</figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <button
            onClick={goLevels}
            className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-ink/90 active:scale-[0.99] transition cursor-pointer"
          >
            Randomtrip-us
          </button>
        </div>
      </div>
    </section>
  );
}