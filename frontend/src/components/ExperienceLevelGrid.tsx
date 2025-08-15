import React from "react";
import { useRouter } from "next/navigation";

type ExperienceLevel = {
  id: "essenza" | "modo-explora" | "explora-plus" | "bivouac" | "atelier-getaway";
  name: string;
  tagline: string;
  price: string;
  bullets: string[];
};

const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  {
    id: "essenza",
    name: "Essenza",
    tagline: "Lo esencial con estilo",
    price: "$350 USD por persona",
    bullets: [
      "Noches: Hasta 2 noches",
      "Alojamiento: Midscale (3★)",
      "Transporte: Low-cost",
      "Extras: Guía esencial del destino",
    ],
  },
  {
    id: "modo-explora",
    name: "Modo Explora",
    tagline: "Viaje activo y flexible",
    price: "$500 USD por persona",
    bullets: [
      "Noches: Hasta 3 noches",
      "Alojamiento: Mid-to-Upscale",
      "Transporte: Multimodal flexible",
      "Extras: Guía curada “Decode”",
    ],
  },
  {
    id: "explora-plus",
    name: "Explora+",
    tagline: "Más capas, más detalles",
    price: "$850 USD por persona",
    bullets: [
      "Noches: Hasta 4 noches",
      "Alojamiento: Upscale Garantizado",
      "Transporte: Multimodal",
      "Extras: 1 Experiencia Curada",
    ],
  },
  {
    id: "bivouac",
    name: "Bivouac",
    tagline: "Curaduría que se siente artesanal",
    price: "$1,200 USD por persona",
    bullets: [
      "Noches: Hasta 5 noches",
      "Alojamiento: Diseño / Boutique",
      "Transporte: Multimodal Premium",
      "Extras: 1 Experiencia Premium",
    ],
  },
  {
    id: "atelier-getaway",
    name: "Atelier Getaway",
    tagline: "Distinción, sin esfuerzo",
    price: "Desde $1,200 USD por persona",
    bullets: [
      "Noches: Customizable",
      "Alojamiento: Luxury / De Autor",
      "Transporte: A medida (privados)",
      "Extras: 2+ Experiencias Premium",
    ],
  },
];

type Props = {
  onSelect: (packageId: string) => void;
  className?: string;
};

export default function ExperienceLevelGrid({ onSelect, className }: Props) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 ${className || ""}`}>
      {EXPERIENCE_LEVELS.map((level) => (
        <div
          key={level.id}
          className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 border border-gray-200 flex flex-col"
        >
          <div className="p-6 flex-grow">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{level.name}</h3>
            <p className="text-gray-600 text-sm mb-4">{level.tagline}</p>
            <p className="text-3xl font-extrabold text-[#D4AF37] mb-4">{level.price}</p>
            <ul className="text-gray-700 text-sm space-y-2">
              {level.bullets.map((bullet, index) => (
                <li key={index} className="flex items-center">
                  <svg
                    className="w-4 h-4 text-[#D4AF37] mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6 border-t border-gray-100">
            <button
              onClick={() => onSelect(level.id)}
              className="w-full bg-[#D4AF37] text-white py-3 rounded-lg font-semibold hover:bg-[#EACD65] transition-colors duration-200"
            >
              Reservar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
