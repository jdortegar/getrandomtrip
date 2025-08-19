"use client";

import Link from 'next/link';

import SectionHeading from "@/components/ui/SectionHeading"; // Import SectionHeading

const TESTIMONIALS = [
  { quote: "No supimos el destino hasta llegar al aeropuerto. Fue perfecto para nosotros dos.", author: "Agustina & Leo" },
  { quote: "El nivel Explora+ fue un golazo: detalles, experiencias y cero fricción.", author: "Caro & Eze" },
  { quote: "Nos cuidaron en todo. Volvimos con historias imposibles de contar sin gestos.", author: "Vicky & Nacho" },
];

export default function Testimonials() {

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          title="Lo que dicen quienes ya viajaron"
          align="center"
          className="text-3xl md:text-4xl font-extrabold text-neutral-900"
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
          <Link
            href="#planes"
            className="btn-primary"
          >
            RANDOMTRIP-us!
          </Link>
        </div>
      </div>
    </section>
  );
}