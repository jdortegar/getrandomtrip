'use client';
import Image from 'next/image';

const LEVELS = [
  { key:'essenza', name:'Essenza', desc:'Asombro esencial, cero ruido.' },
  { key:'modo-explora', name:'Modo Explora', desc:'Explorar con red: libertad + guía.' },
  { key:'explora-plus', name:'Explora+', desc:'Más capas, más detalles curados.' },
  { key:'bivouac', name:'Bivouac', desc:'Aventura con respaldo invisible.' },
  { key:'atelier', name:'Atelier', desc:'Hecho a medida. Sin límites.' }
];

const isSvg = (src:string) => src?.toLowerCase?.().endsWith('.svg');

export default function LevelsGrid({ type }:{ type:string }){
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
      {LEVELS.map((lv)=> (
        <article key={lv.key} className="theme-card rounded-2xl p-5 shadow-lg">
          <div className="relative w-full aspect-square mb-4 overflow-hidden rounded-xl">
            <Image src={`/images/travellers/${type}/levels/${lv.key}.jpg`} alt={lv.name} fill className="object-cover" loading="lazy" {...(isSvg(`/images/travellers/${type}/levels/${lv.key}.jpg`) ? { unoptimized: true } : {})} />
          </div>
          <h3 className="text-lg font-semibold">{lv.name}</h3>
          <p className="text-sm opacity-80 mb-4">{lv.desc}</p>
          <a href="/randomtripme" className="inline-block theme-accent px-4 py-2 rounded-lg font-medium focus:outline-none focus:ring-2">RandomtripME</a>
        </article>
      ))}
    </div>
  );
}
