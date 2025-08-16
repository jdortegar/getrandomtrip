"use client";

import SectionHeading from "@/components/ui/SectionHeading"; // Import SectionHeading

const PLACES = [
  { name: "Bacalar", image: "/images/places/bacalar.jpg" },
  { name: "San Miguel de Allende", image: "/images/places/sma.jpg" },
  { name: "Valle de Bravo", image: "/images/places/valle.jpg" },
  // ... los que ya tengas
];

export default function FavoritePlaces() {
  const goLevels = () => {
    const el = document.getElementById("experience-levels");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          title="Nuestros lugares favoritos para escapadas en pareja"
          subtitle="El viaje debe ser tan único como ustedes."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PLACES.map((p) => (
            <div key={p.name} className="group relative overflow-hidden rounded-2xl bg-neutral-100">
              <img src={p.image} alt={p.name} className="h-64 w-full object-cover transition group-hover:scale-[1.02]" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white font-semibold drop-shadow">
                {p.name}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <button onClick={goLevels}
            className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-ink/90 active:scale-[0.99] transition cursor-pointer">
            Randomtrip-us
          </button>
        </div>
      </div>
    </section>
  );
}