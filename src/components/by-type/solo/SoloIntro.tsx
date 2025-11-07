'use client';
import React from 'react';

export default function SoloIntro() {
  return (
    <section className="bg-white">
      <div className="rt-container px-4 md:px-8 py-16 grid md:grid-cols-2 gap-10">
        <div>
          <h3 className="font-display text-2xl text-neutral-900">
            SOLUM<sup className="align-super text-[0.65em] ml-0.5">©</sup> CONFIDENCIAL
          </h3>
          <p className="mt-4 text-neutral-700 leading-relaxed">
            Cuando uno viaja solo, no hay que rendir cuentas. No habrá listas de “cosas que hacer”.
            Habrá un camino que se abre frente a vos. Y detrás, nosotros, asegurando que todo funcione
            aunque parezca improvisado.
          </p>
          <p className="mt-4 text-neutral-700 leading-relaxed">
            Quizá amanezcas mirando un lago que no sabías que existía. O termines hablando con extraños
            que ya no lo serán. Lo único seguro es que vas a volver distinto.
          </p>
        </div>
        <aside className="md:pl-6">
          <ul className="space-y-3 text-sm text-neutral-800">
            <li>• Cero fricción logística.</li>
            <li>• Tu ritmo, tu guion.</li>
            <li>• Sorpresa bien diseñada.</li>
            <li>• Destination Decoded (en Explora+, Bivouac y Atelier).</li>
          </ul>
        </aside>
      </div>
    </section>
  );
}
