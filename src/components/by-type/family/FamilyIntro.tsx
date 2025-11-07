'use client';
import React from 'react';
import EmpathyCard from './EmpathyCard';

export default function FamilyIntro({ onStart }: { onStart: () => void }) {
  return (
    <section className="rt-container px-4 md:px-8 py-12">
      <h2 className="text-center font-display text-3xl md:text-4xl">
        Comencemos a diseñar su Randomtrip Familiar
      </h2>
      <p className="mt-2 text-center text-sm text-neutral-600">
        3 pasos cortos, para crear la mejor experiencia.
      </p>

      <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6 place-items-center">
        <EmpathyCard
          label="Peques"
          headline="Traslados simples, más descubrimiento."
          support='Menos horas de auto, más “¿y esto qué es?”. Ritmo pensado para los más chicos.'
          color="bg-[#C77248]"
        />
        <EmpathyCard
          label="Adolescentes"
          headline="Experiencias que compiten con el WiFi."
          support="Actividades hands-on, locales y memorables. Publican después; primero viven."
          color="bg-[#2E7D73]"
        />
        <EmpathyCard
          label="Toda la familia"
          headline="Logística es nuestro superpoder."
          support="Horarios, traslados y reservas sin peleas. Todos llegan, todos disfrutan."
          color="bg-[#203643]"
        />
        <EmpathyCard
          label="Tiempo libre"
          headline="Días que fluyen sin culpas."
          support="Espacios para siestas, charlas y nada. Porque descansar también es viajar."
          color="bg-[#BE9D77]"
        />
      </div>

      <div className="mt-10 flex justify-center">
        <button
          onClick={onStart}
          className="rounded-full bg-[#D97E4A] hover:bg-[#cf7a40] text-white px-6 py-3 font-semibold shadow"
        >
          Empezar a diseñar nuestro Family Randomtrip →
        </button>
      </div>
    </section>
  );
}
