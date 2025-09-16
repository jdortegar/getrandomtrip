"use client";
import { personas as personasConst } from "@/constants/personas";

export default function PersonaSelector({
  currentPersonaId,
  onSelectPersona,
}: {
  currentPersonaId: string;
  onSelectPersona: (id: string) => void;
}) {
  // Usa la lista global; evita fallar si por alguna razón no carga
  const personas = Array.isArray(personasConst) ? personasConst : [];

  if (personas.length === 0) {
    return (
      <div className="flex items-center justify-center my-4 text-xs text-white/70">
        Cargando voces…
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap my-4">
      {personas.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelectPersona(p.id)}
          className={`px-3 py-2 rounded-full text-sm border transition ${
            currentPersonaId === p.id
              ? "bg-[#D4AF37] text-black border-transparent shadow"
              : "border-white/20 hover:border-white/40"
          }`}
          aria-pressed={currentPersonaId === p.id}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}