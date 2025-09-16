"use client";

import { useMemo, useState } from "react";
import RoadtripFilterForm from "@/components/roadtrip/RoadtripFilterForm";

// ---------------------------------------------
// UI helpers muy livianos (sin next/image / emojis)
// ---------------------------------------------
type Card = { id: string; title: string; subtitle?: string };

function Pill({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-3 py-1 rounded-full border transition",
        active
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white/70 text-slate-700 border-slate-300 hover:bg-white",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SimpleCard({
  item,
  selected,
  onSelect,
}: {
  item: Card;
  selected?: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(item.id)}
      className={[
        "group w-full text-left rounded-2xl border bg-white/90 hover:bg-white",
        "border-slate-200 shadow-sm hover:shadow-md transition",
        "p-5 flex flex-col gap-2",
        selected ? "ring-2 ring-amber-400" : "",
      ].join(" ")}
    >
      <div className="h-28 w-full rounded-xl bg-gradient-to-br from-slate-100 to-slate-200" />
      <div className="text-slate-900 text-base font-semibold">{item.title}</div>
      {item.subtitle ? (
        <div className="text-slate-500 text-sm">{item.subtitle}</div>
      ) : null}
    </button>
  );
}

function CardGrid({
  items,
  value,
  onChange,
}: {
  items: Card[];
  value?: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
      {items.map((it) => (
        <SimpleCard
          key={it.id}
          item={it}
          selected={value === it.id}
          onSelect={onChange}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------
// Datos (solo ids/títulos; sin imágenes para evitar crashes)
// ---------------------------------------------
const BY_TRAVELLER: Card[] = [
  { id: "couple", title: "En Pareja" },
  { id: "solo", title: "Solo" },
  { id: "family", title: "En Familia" },
  { id: "group", title: "En Grupo" },
  { id: "paws", title: "Paws" },
];

const ALMA_COUPLE_SOLO_PAWS: Card[] = [
  { id: "visual", title: "Narradores Visuales" },
  { id: "foodie", title: "Gastronómico" },
  { id: "nature", title: "Naturaleza & Aventura" },
  { id: "music", title: "Música & Festivales" },
];

const FAMILY_TRIP_TYPE: Card[] = [
  { id: "small-kids", title: "Con los más chicos" },
  { id: "teens", title: "Con adolescentes" },
  { id: "grown-kids", title: "Con hijos grandes" },
  { id: "all-family", title: "Con toda la familia" },
];

const FAMILY_ESCAPE_TYPE: Card[] = [
  { id: "adventure", title: "Aventura en familia" },
  { id: "nature", title: "Naturaleza & fauna" },
  { id: "culture", title: "Cultura & tradiciones" },
  { id: "beach", title: "Playas & dunas" },
  { id: "graduations", title: "Graduaciones & celebraciones" },
  { id: "escapadas", title: "Escapadas madre/padre – hij@" },
];

const GROUP_ALMA: Card[] = [
  { id: "visual", title: "Narradores Visuales" },
  { id: "friends", title: "Amigos" },
  { id: "foodie", title: "Gastronómico" },
  { id: "nature", title: "Naturaleza & Aventura" },
  { id: "music", title: "Música & Festivales" },
];

// ---------------------------------------------
// Página
// ---------------------------------------------
type Step =
  | "basic" // Info básica (tu form)
  | "traveller" // By Traveller
  | "substep" // depende de elección
  | "tune"; // Afinar detalles (tu form + ayuda)

export default function RoadtripBasicConfigPage() {
  const [step, setStep] = useState<Step>("basic");

  // selección del paso intermedio
  const [traveller, setTraveller] = useState<string | undefined>();
  const [subChoice1, setSubChoice1] = useState<string | undefined>(); // alma / tipo de viaje
  const [subChoice2, setSubChoice2] = useState<string | undefined>(); // tipo de escapada (familia)

  // Título / subtítulo dinámico
  const header = useMemo(() => {
    switch (step) {
      case "basic":
        return {
          title: "Configuración básica de tu Roadtrip",
          subtitle:
            "Contanos desde dónde salen, cuántos días tienen y qué estilo les va. Después ajustamos los detalles y pasamos a los add-ons.",
        };
      case "traveller":
        return {
          title: "By Traveller",
          subtitle: "Elegí quién viaja para personalizar el viaje.",
        };
      case "substep": {
        if (traveller === "family") {
          // puede estar en tipo de viaje o tipo de escapada
          return {
            title:
              subChoice1 == null
                ? "Tipo de viaje (En Familia)"
                : "Tipo de escapada (En Familia)",
            subtitle:
              subChoice1 == null
                ? "Pensá en la composición de la familia para ajustar el plan."
                : "Ahora demosle un ‘porqué sí’ a la escapada.",
          };
        }
        if (traveller === "group") {
          return {
            title: "Grupo & Alma",
            subtitle:
              "¿Qué mueve al grupo? Definamos la vibra para armarlo a medida.",
          };
        }
        return {
          title: "Alma de Viaje",
          subtitle:
            "Elegí el ‘porqué sí’ del viaje para afinar ideas y experiencias.",
        };
      }
      case "tune":
        return {
          title: "Afinar detalles",
          subtitle:
            "Ritmo y presupuesto. Sumamos contexto para ajustar la propuesta.",
        };
      default:
        return { title: "", subtitle: "" };
    }
  }, [step, traveller, subChoice1]);

  // Contenido del paso intermedio
  const substepCards = useMemo<Card[]>(() => {
    if (traveller === "family") {
      return subChoice1 == null ? FAMILY_TRIP_TYPE : FAMILY_ESCAPE_TYPE;
    }
    if (traveller === "group") {
      return GROUP_ALMA;
    }
    // couple / solo / paws
    return ALMA_COUPLE_SOLO_PAWS;
  }, [traveller, subChoice1]);

  // Avances de flujo
  const goFromTraveller = (id: string) => {
    setTraveller(id);
    setSubChoice1(undefined);
    setSubChoice2(undefined);
    setStep("substep");
  };

  const onPickSub1 = (id: string) => {
    if (traveller === "family") {
      setSubChoice1(id);
      // familia tiene un 2º sub-paso
    } else {
      setSubChoice1(id);
      setStep("tune");
    }
  };

  const onPickSub2ForFamily = (id: string) => {
    setSubChoice2(id);
    setStep("tune");
  };

  const resetToBasic = () => {
    setStep("basic");
    setTraveller(undefined);
    setSubChoice1(undefined);
    setSubChoice2(undefined);
  };

  // ---------------------------------------------
  // Render
  // ---------------------------------------------
  return (
    <div className="relative min-h-[100svh] bg-black">
      {/* Fondo con video */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <video
          className="h-full w-full object-cover opacity-20"
          autoPlay
          muted
          loop
          playsInline
          poster="/images/journey-types/friends-group.jpg"
        >
          <source src="/videos/hero-video.webm" type="video/webm" />
          <source src="/videos/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-black/50" />
      </div>

      {/* Contenido */}
      <main className="relative z-10">
        <header className="mx-auto max-w-5xl px-4 pt-14 pb-6 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            {header.title}
          </h1>
          <p className="mt-3 text-slate-200">
            {header.subtitle}
          </p>
        </header>

        {/* Tabs */}
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex gap-2 justify-center mb-6">
            <Pill active={step === "basic"} onClick={() => setStep("basic")}>
              Info Básica
            </Pill>
            <Pill
              active={step === "traveller" || step === "substep"}
              onClick={() => setStep("traveller")}
            >
              By Traveller
            </Pill>
            <Pill active={step === "tune"} onClick={() => setStep("tune")}>
              Afinar detalles
            </Pill>
          </div>

          {/* Panel */}
          <section className="rounded-3xl bg-white/95 backdrop-blur shadow-xl border border-white/60">
            <div className="p-6 md:p-8">
              {step === "basic" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Punto de Partida y Ritmo
                  </h2>
                  <p className="text-slate-600">
                    Contanos desde dónde arrancás y cómo te gusta viajar.
                  </p>
                  {/* Tu formulario existente. Mantiene labels/inputs pero con contenedor de alto contraste */}
                  <div className="rounded-2xl border border-slate-200 p-4 bg-white">
                    <RoadtripFilterForm />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setStep("traveller")}
                      className="inline-flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 font-medium"
                    >
                      Continuar →
                    </button>
                  </div>
                </div>
              )}

              {step === "traveller" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-slate-900 text-center">
                    ¿Qué tipo de viajero sos?
                  </h2>
                  <CardGrid
                    items={BY_TRAVELLER}
                    value={traveller}
                    onChange={goFromTraveller}
                  />
                  <div className="pt-4">
                    <button
                      onClick={resetToBasic}
                      className="text-sm text-slate-600 hover:text-slate-900 underline"
                    >
                      ← Volver a Info Básica
                    </button>
                  </div>
                </div>
              )}

              {step === "substep" && (
                <div className="space-y-6">
                  {traveller !== "family" ? (
                    <>
                      <h2 className="text-lg font-semibold text-slate-900 text-center">
                        Alma de Viaje
                      </h2>
                      <CardGrid
                        items={substepCards}
                        value={subChoice1}
                        onChange={onPickSub1}
                      />
                    </>
                  ) : (
                    <>
                      {subChoice1 == null ? (
                        <>
                          <h2 className="text-lg font-semibold text-slate-900 text-center">
                            Tipo de viaje (En Familia)
                          </h2>
                          <CardGrid
                            items={FAMILY_TRIP_TYPE}
                            value={subChoice1}
                            onChange={onPickSub1}
                          />
                        </>
                      ) : (
                        <>
                          <h2 className="text-lg font-semibold text-slate-900 text-center">
                            Tipo de escapada
                          </h2>
                          <CardGrid
                            items={FAMILY_ESCAPE_TYPE}
                            value={subChoice2}
                            onChange={onPickSub2ForFamily}
                          />
                        </>
                      )}
                    </>
                  )}

                  <div className="pt-4 flex items-center justify-between">
                    <button
                      onClick={() => setStep("traveller")}
                      className="text-sm text-slate-600 hover:text-slate-900 underline"
                    >
                      ← Volver
                    </button>
                    {(traveller !== "family" && subChoice1) ||
                    (traveller === "family" && subChoice2) ? (
                      <button
                        onClick={() => setStep("tune")}
                        className="inline-flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 font-medium"
                      >
                        Continuar →
                      </button>
                    ) : (
                      <span className="text-sm text-slate-400">
                        Elegí una tarjeta para continuar
                      </span>
                    )}
                  </div>
                </div>
              )}

              {step === "tune" && (
                <div className="space-y-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill onClick={() => setStep("basic")}>Info Básica</Pill>
                    <Pill onClick={() => setStep("traveller")}>By Traveller</Pill>
                    <Pill active>Afinar detalles</Pill>
                  </div>

                  {/* Ayuda contextual */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50">
                      <h3 className="text-slate-900 font-semibold mb-2">
                        Ritmo del viaje
                      </h3>
                      <ul className="space-y-2 text-slate-700 text-sm leading-relaxed">
                        <li>
                          <span className="font-semibold">Relax:</span> pocas
                          horas al volante, paradas largas, foco en descanso.
                        </li>
                        <li>
                          <span className="font-semibold">Balanceado:</span>{" "}
                          equilibrio entre kilómetros, visitas y relax.
                        </li>
                        <li>
                          <span className="font-semibold">Intenso:</span> muchos
                          kilómetros por día, más movimiento y variedad de
                          paradas.
                        </li>
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50">
                      <h3 className="text-slate-900 font-semibold mb-2">
                        Presupuesto (por persona / día)
                      </h3>
                      <ul className="space-y-2 text-slate-700 text-sm leading-relaxed">
                        <li>
                          <span className="font-semibold">Smart:</span> ~
                          USD&nbsp;25–60 (hospedaje simple + comidas casuales).
                        </li>
                        <li>
                          <span className="font-semibold">Comfort:</span> ~
                          USD&nbsp;60–120 (hoteles 3★–4★ + buenas comidas).
                        </li>
                        <li>
                          <span className="font-semibold">Premium:</span> ~
                          USD&nbsp;120–250+ (4★–5★, experiencias destacadas).
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Tu formulario dentro de un contenedor con alto contraste */}
                  <div className="rounded-2xl border border-slate-200 p-4 bg-white">
                    <RoadtripFilterForm />
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setStep("substep")}
                      className="text-sm text-slate-600 hover:text-slate-900 underline"
                    >
                      ← Volver
                    </button>
                    {/* El CTA de tu form ya envía a /journey/add-ons; no duplicamos botón */}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Claim inferior */}
          <div className="text-center text-slate-300 mt-10 mb-16">
            Wonder. Wander. Repeat.
          </div>
        </div>
      </main>
    </div>
  );
}
