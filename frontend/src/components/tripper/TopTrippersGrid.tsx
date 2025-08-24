"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import TripperCard from "@/components/TripperCard";
import { TRIPPERS } from "@/content/trippers";

export default function TopTrippersGrid() {
  const router = useRouter();
  const [tripperSearchState, setTripperSearchState] = useState<
    "initial" | "categories" | "searching" | "found"
  >("initial");
  const [foundTripper, setFoundTripper] = useState<{ name: string; img: string } | null>(null);

  const findTripper = (name: string) => {
    if (!name.trim()) return;
    const hit = TRIPPERS.find((t) => t.name.toLowerCase().includes(name.toLowerCase()));
    setFoundTripper(
      hit ? { name: hit.name, img: hit.avatar ?? hit.heroImage ?? "/images/fallback.jpg" } 
          : { name: "Tripper no encontrado", img: "/images/fallback.jpg" }
    );
    setTripperSearchState("found");
  };

  return (
    <div id="top-trippers" className="py-8">
      <p className="text-center text-gray-600 mb-8 italic">
        Ellos ya dejaron huella. ¿Quién será tu cómplice de viaje?
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
        {TRIPPERS.map((tripper) => (
          <motion.div
            key={tripper.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <TripperCard
              name={tripper.name}
              img={tripper.avatar ?? tripper.heroImage ?? "/images/fallback.jpg"}
              slug={tripper.slug}
              bio={tripper.bio}
              
            />
          </motion.div>
        ))}

        {/* Tarjeta interactiva de búsqueda */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative group rounded-2xl overflow-hidden shadow-xl hover:scale-[1.03] transition-all cursor-pointer bg-white text-gray-900 flex flex-col items-center justify-center p-6 min-h-[196px]"
        >
          {tripperSearchState === "initial" && (
            <div onClick={() => setTripperSearchState("categories")} className="cursor-pointer text-center">
              <h3 className="font-bold text-lg">Busca a tu Tripper favorito</h3>
              <p className="text-sm text-gray-400 mt-1">Haz click aquí</p>
            </div>
          )}

          {tripperSearchState === "categories" && (
            <div className="w-full flex flex-col space-y-2 text-center">
              <h3 className="font-bold text-lg mb-2">Busca por Categoría</h3>
              <button
                onClick={() => setTripperSearchState("searching")}
                className="w-full bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded transition-colors text-gray-900"
              >
                Travel Bloggers
              </button>
              <button
                onClick={() => setTripperSearchState("searching")}
                className="w-full bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded transition-colors text-gray-900"
              >
                Creadores
              </button>
              <button
                onClick={() => setTripperSearchState("searching")}
                className="w-full bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded transition-colors text-gray-900"
              >
                Travel Advisors
              </button>
            </div>
          )}

          {tripperSearchState === "searching" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const input = (form.elements.namedItem("tripperName") as HTMLInputElement) || { value: "" };
                findTripper(input.value);
              }}
              className="w-full flex flex-col items-center"
            >
              <h3 className="font-bold text-lg mb-2">Nombre del Tripper</h3>
              <input
                name="tripperName"
                type="text"
                placeholder="Escribe un nombre..."
                autoFocus
                className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] outline-none placeholder-gray-500"
              />
              <button
                type="submit"
                className="mt-4 w-full bg-[#D4AF37] text-gray-900 hover:bg-[#EACD65] py-3 rounded-lg transition-colors font-bold"
              >
                Buscar
              </button>
            </form>
          )}

          {tripperSearchState === "found" && foundTripper && (
            <div className="flex flex-col items-center text-center">
              <img
                src={foundTripper.img}
                alt={foundTripper.name}
                className="w-24 h-24 rounded-full border-4 border-[#D4AF37]"
              />
              <h3 className="mt-2 font-semibold text-gray-900">{foundTripper.name}</h3>
              <p className="text-xs text-[#D4AF37]">¡Tripper encontrado!</p>
              <button
                onClick={() => router.push("/journey/experience-level")}
                className="text-sm text-gray-600 mt-2 hover:text-gray-900 transition-colors"
              >
                Continuar con {foundTripper.name.split(" ")[0]}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}