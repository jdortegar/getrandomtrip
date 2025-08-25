"use client";

import Link from "next/link";
import SectionHeading from "@/components/ui/SectionHeading"; // Import SectionHeading

const INSPIRATION_CARDS = [
  { title: "Valle de Uco", image: "/images/inspo/uco.jpg", href: "/blogs/couple#valle-de-uco" },
  { title: "José Ignacio", image: "/images/inspo/jose-ignacio.jpg", href: "/blogs/couple#jose-ignacio" },
  { title: "Bariloche íntimo", image: "/images/inspo/bariloche.jpg", href: "/blogs/couple#bariloche-intimo" },
  { title: "Sierras Secretas", image: "/images/inspo/sierras.jpg", href: "/blogs/couple#sierras" },
  { title: "Costa Atlántica", image: "/images/inspo/costa.jpg", href: "/blogs/couple#costa" },
];

export default function FavoritePlaces() {
  const goLevels = () => {
    const el = document.getElementById("planes");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="inspiracion-couples" className="py-20 px-8 bg-[#111827] text-white">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          title="Nuestros lugares favoritos para escapadas en pareja"
          subtitle="El viaje debe ser tan único como ustedes."
        />
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INSPIRATION_CARDS.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5"
            >
              <div className="aspect-[4/3] w-full bg-black/20">
                <img src={item.image} alt={item.title} className="h-full w-full object-cover opacity-90 transition group-hover:scale-105" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <h3 className="text-lg font-semibold text-white">
                  {item.title}
                </h3>
              </div>
            </Link>
          ))}
          {/* View All Card */}
          <Link href="/blogs/couple" className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <div className="aspect-[4/3] w-full bg-black/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <h3 className="text-lg font-semibold text-white">
                Ver todo
                <span className="ml-2 inline-block text-sm opacity-80">→</span>
              </h3>
            </div>
          </Link>
        </div>
        <div className="mt-12 flex justify-center">
          <Link
            href="#planes"
            className="bg-[#D97E4A] text-white font-bold uppercase tracking-wider py-3 px-8 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#111827] focus:ring-[#D4AF37] mt-8 animate-pulse-once"
          >
            RANDOMTRIP-us!
          </Link>
        </div>
      </div>
    </section>
  );
}