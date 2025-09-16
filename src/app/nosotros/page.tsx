import type { Metadata } from "next";
import Image from "next/image";
import React from "react";

// Metadata (App Router - server component)
export const metadata: Metadata = {
  title: "Nosotros | Randomtrip — Arquitectura de la confianza",
  description:
    "Conocé la filosofía, la historia del fundador y el equipo curador detrás de Randomtrip. Serendipia diseñada con seguridad y gusto impecable.",
  openGraph: {
    title: "Nosotros | Randomtrip — Arquitectura de la confianza",
    description:
      "Conocé la filosofía, la historia del fundador y el equipo curador detrás de Randomtrip.",
    type: "website",
  },
};

// ------------------------------------------------------------
// Tipos
// ------------------------------------------------------------
type Curator = {
  name: string;
  role: string;
  bio: string;
  img: string;
};

// ------------------------------------------------------------
// Data (editable)
// ------------------------------------------------------------
const CURATORS: Curator[] = [
  {
    name: "Ana García",
    role: "Inmersión Cultural",
    bio: "Diseña itinerarios que conectan con lo local: talleres, mesas compartidas y rituales auténticos.",
    img: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
  },
  {
    name: "Carlos Mendoza",
    role: "Aventura & Aire Libre",
    bio: "Busca el punto justo entre adrenalina y seguridad. Trekking, cielos abiertos y micro-retos controlados.",
    img: "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
  },
  {
    name: "Sofía Rossi",
    role: "Lujo & Bienestar",
    bio: "Cura spaces con diseño, calma y atención plena. Silencio, spa, música baja, servicio impecable.",
    img: "https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
  },
];

const VALUE_PROPS = [
  {
    title: "Curaduría experta",
    copy:
      "Guías con gusto impecable y metodología propia. Menos scroll, más vivir.",
  },
  {
    title: "Seguridad y transparencia",
    copy:
      "Protocolos, partners auditados y comunicación clara antes, durante y después.",
  },
  {
    title: "Comunidad Tripper",
    copy:
      "Historias reales, referidos y aprendizajes compartidos que elevan cada viaje.",
  },
];

const STEPS = [
  {
    k: "01",
    t: "Brief de sentimientos",
    d: "Cómo te querés sentir. Límites blandos/duros. Señales rojas y verdes.",
  },
  {
    k: "02",
    t: "Diseño invisible",
    d: "Nosotros cargamos la logística. Vos solo recibís señales y momentos.",
  },
  {
    k: "03",
    t: "Serendipia segura",
    d: "Sorpresas curadas con respaldo y plan B. Libertad con red.",
  },
];

const FAQ = [
  {
    q: "¿Qué compro exactamente si el destino es sorpresa?",
    a: "Comprás un resultado emocional: alivio de la elección y descubrimiento guiado. El destino y la logística quedan en nuestras manos (con tus límites claros).",
  },
  {
    q: "¿Cómo trabajan la seguridad?",
    a: "Evaluación de riesgos por destino, partners verificados, cobertura y protocolos de comunicación 24/7.",
  },
  {
    q: "¿Puedo rechazar actividades?",
    a: "Sí. El brief define no-go's. En destino, mantenemos flexibilidad sin romper la narrativa del viaje.",
  },
  {
    q: "¿Qué pasa si no me gusta la sorpresa?",
    a: "Iteramos. Tomamos tu feedback y ajustamos para el siguiente. Nuestro NPS y tasa de recompra guían la mejora.",
  },
];

// ------------------------------------------------------------
// UI helpers
// ------------------------------------------------------------
function SectionHeading({
  children,
  id,
}: {
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <h2
      id={id}
      className="scroll-mt-24 text-3xl md:text-4xl font-semibold tracking-tight text-neutral-900 font-serif"
    >
      {children}
    </h2>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm leading-none text-neutral-700 border-neutral-200">
      {children}
    </span>
  );
}

// ------------------------------------------------------------
// Page (Server Component)
// ------------------------------------------------------------
export default function NosotrosPage() {
  return (
    <div className="bg-white text-neutral-900">
      {/* HERO */}
      <header className="relative isolate">
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="flex flex-col items-center text-center">
            <Pill>Nosotros</Pill>
            <h1 className="mt-4 text-5xl md:text-6xl font-bold font-serif tracking-tight">
              Arquitectura de la confianza
            </h1>
            <p className="mt-4 max-w-2xl text-base md:text-lg text-neutral-600">
              El lujo no es elegir entre 500 opciones. Es no tener que elegir.
              Diseñamos<strong> serendipia segura</strong> para que vivas lo que
              importa.
            </p>
            <div className="mt-8 flex gap-3">
              <a
                href="#filosofia"
                className="rounded-2xl border border-neutral-200 px-5 py-3 text-sm md:text-base hover:bg-neutral-50"
              >
                Nuestra filosofía
              </a>
              <a
                href="/?tab=By%20Traveller#start-your-journey-anchor"
                aria-label="Ir a la sección 'Comienza tu Viaje' con la tab 'By Traveller' seleccionada"
                className="rounded-2xl bg-neutral-900 text-white px-5 py-3 text-sm md:text-base hover:opacity-90"
              >
                GETRANDOMTRIP!
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 space-y-24">
        {/* VALOR / POR QUÉ CONFIAR */}
        <section aria-labelledby="valor">
          <SectionHeading id="valor">Por qué confiar en Randomtrip</SectionHeading>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {VALUE_PROPS.map((v) => (
              <div key={v.title} className="rounded-3xl border border-neutral-200 p-6">
                <h3 className="text-xl font-semibold font-serif">{v.title}</h3>
                <p className="mt-2 text-neutral-600">{v.copy}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FILOSOFÍA */}
        <section id="filosofia" aria-labelledby="filosofia-title">
          <SectionHeading id="filosofia-title">Nuestra filosofía</SectionHeading>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            <div className="space-y-4 text-neutral-700">
              <p>
                No vendemos un destino; vendemos un <strong>resultado emocional</strong>.
                Nuestra misión es liberar tu mente de la parálisis por análisis y
                guiarte hacia estados como asombro, calma o conexión.
              </p>
              <p>
                Lo llamamos <strong>Serendipia Diseñada</strong>: entornos seguros y
                meticulosamente planificados que se sienten espontáneos y
                transformadores. Renunciás al control logístico para ganar libertad
                verdadera.
              </p>
            </div>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-neutral-200">
              <Image
                src="https://images.pexels.com/photos/21014/pexels-photo.jpg?auto=compress&cs=tinysrgb&dpr=1&w=1200"
                alt="Momentos de serendipia en viaje"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Pill>Brief emocional</Pill>
            <Pill>Diseño invisible</Pill>
            <Pill>Sorpresa con red</Pill>
          </div>
        </section>

        {/* FUNDADOR */}
        <section aria-labelledby="fundador">
          <SectionHeading id="fundador">Historia del fundador</SectionHeading>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-1">
              <div className="relative aspect-square overflow-hidden rounded-full">
                <Image
                  src="https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=600"
                  alt="Fundador de Randomtrip"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="md:col-span-2 text-neutral-700">
              <p>
                Nacimos para combatir la <em>parálisis por análisis</em> que frena los
                grandes viajes. Convertimos el <em>¿y si…?</em> en
                <strong> ¡vamos!</strong> con un sistema que protege tu tiempo y tu
                energía.
              </p>
              <p className="mt-3">
                Esto no es solo una agencia: es un manifiesto contra la rutina y a favor
                del asombro bien diseñado.
              </p>
            </div>
          </div>
        </section>

        {/* METODOLOGÍA */}
        <section aria-labelledby="metodologia">
          <SectionHeading id="metodologia">Cómo diseñamos tu viaje</SectionHeading>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div key={s.k} className="rounded-3xl border border-neutral-200 p-6">
                <div className="text-sm text-neutral-500">Paso {s.k}</div>
                <h3 className="mt-1 text-xl font-semibold font-serif">{s.t}</h3>
                <p className="mt-2 text-neutral-600">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* EQUIPO */}
        <section id="equipo" aria-labelledby="equipo-title">
          <SectionHeading id="equipo-title">Conocé a los curadores</SectionHeading>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {CURATORS.map((c) => (
              <article key={c.name} className="rounded-3xl border border-neutral-200 p-6">
                <div className="mx-auto relative h-28 w-28 overflow-hidden rounded-full">
                  <Image src={c.img} alt={c.name} fill className="object-cover" />
                </div>
                <h3 className="mt-4 text-lg font-semibold font-serif text-center">
                  {c.name}
                </h3>
                <p className="text-sm text-neutral-500 text-center">{c.role}</p>
                <p className="mt-3 text-neutral-700 text-center">{c.bio}</p>
              </article>
            ))}
          </div>
        </section>

        {/* PRUEBAS DE CONFIANZA */}
        <section aria-labelledby="pruebas">
          <SectionHeading id="pruebas">Confianza en números</SectionHeading>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-neutral-200 p-6 text-center">
              <div className="text-4xl font-bold font-serif">NPS 65+*</div>
              <p className="mt-2 text-neutral-600 text-sm">
                Meta pública y seguimiento continuo.
              </p>
            </div>
            <div className="rounded-3xl border border-neutral-200 p-6 text-center">
              <div className="text-4xl font-bold font-serif">55%+</div>
              <p className="mt-2 text-neutral-600 text-sm">
                Adopción de upsells (bienestar, experiencias).
              </p>
            </div>
            <div className="rounded-3xl border border-neutral-200 p-6 text-center">
              <div className="text-4xl font-bold font-serif">20%+</div>
              <p className="mt-2 text-neutral-600 text-sm">Tasa de recompra objetivo.</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            * Objetivos del plan de marca. Actualizaremos métricas vivas en el dashboard.
          </p>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq">
          <SectionHeading id="faq">Preguntas frecuentes</SectionHeading>
          <div className="mt-6 divide-y divide-neutral-200 rounded-3xl border border-neutral-200">
            {FAQ.map((f, i) => (
              <details key={i} className="group open:bg-neutral-50">
                <summary className="list-none cursor-pointer select-none p-5 md:p-6 flex items-center justify-between">
                  <span className="font-medium text-neutral-900">{f.q}</span>
                  <span className="ml-4 inline-flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 text-xs">
                    +
                  </span>
                </summary>
                <div className="px-5 pb-6 md:px-6 text-neutral-700">{f.a}</div>
              </details>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="rounded-3xl border border-neutral-200 p-8 md:p-12 text-center bg-neutral-50">
          <h3 className="text-2xl md:text-3xl font-semibold font-serif">
            ¿Listo para soltar el control y ganar libertad?
          </h3>
          <p className="mt-2 text-neutral-600">
            Empezá con un brief de sentimientos. Tarda 3 minutos.
          </p>
          <a
            href="/?tab=By%20Traveller#start-your-journey-anchor"
            aria-label="Ir a la sección 'Comienza tu Viaje' con la tab 'By Traveller' seleccionada"
            className="mt-6 inline-flex rounded-2xl bg-neutral-900 px-6 py-3 text-white hover:opacity-90"
          >
            GETRANDOMTRIP!
          </a>
        </section>
      </main>

      {/* JSON-LD (SEO) */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Randomtrip",
            url: "https://getrandomtrip.com",
            description:
              "Serendipia diseñada: viajes sorpresa curados con seguridad y gusto impecable.",
            brand: {
              "@type": "Brand",
              name: "Randomtrip",
            },
            sameAs: [
              "https://www.instagram.com/",
              "https://www.tiktok.com/",
              "https://www.linkedin.com/",
            ],
          }),
        }}
      />
    </div>
  );
}
