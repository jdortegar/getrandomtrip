'use client';

import Image from 'next/image';
import useVariantParam from '@/hooks/useVariantParam'; // <-- usa default O usa named de forma consistente

export default function TravellerHero({ type, data, searchParams }:{
  type:string; data:any; searchParams:any;
}) {
  const variant = useVariantParam(type);
  const isB = variant === 'B';

  const titleB: Record<string,string> = {
    familia: 'La sorpresa que junta a todos en la misma historia.',
    families: 'La sorpresa que junta a todos en la misma historia.',
    parejas: 'El mapa se guarda, la mirada se comparte.',
    couples: 'El mapa se guarda, la mirada se comparte.',
    honeymoon: 'Tu sí para siempre, nuestra sorpresa hoy.',
    honeymoons: 'Tu sí para siempre, nuestra sorpresa hoy.',
    solo: 'El viaje que hace silencio para que te escuches.',
    momentos: 'Celebrarlo sin spoiler lo cambia todo.',
    moment: 'Celebrarlo sin spoiler lo cambia todo.',
    grupo: 'Compartir aventura multiplica todo.',
    groups: 'Compartir aventura multiplica todo.',
    group: 'Compartir aventura multiplica todo.',
    couple: 'El mapa se guarda, la mirada se comparte.',
    family: 'La sorpresa que junta a todos en la misma historia.',
  };

  const subB: Record<string,string> = {
    familia: 'Diseñamos una Ruta con Alma para que la logística desaparezca y aparezca lo importante: ustedes.',
    families: 'Diseñamos una Ruta con Alma para que la logística desaparezca y aparezca lo importante: ustedes.',
    parejas: 'Una sorpresa curada para que vuelvan a elegirse en cada detalle.',
    couples: 'Una sorpresa curada para que vuelvan a elegirse en cada detalle.',
    honeymoon: 'La primera Ruta con Alma de su nueva vida: íntima, cuidada, inolvidable.',
    honeymoons: 'La primera Ruta con Alma de su nueva vida: íntima, cuidada, inolvidable.',
    solo: 'Suelta el control. Gana perspectiva. Vuelve con historia.',
    momentos: 'Un destino desconocido para decir: “esto merecía sorpresa”.',
    moment: 'Un destino desconocido para decir: “esto merecía sorpresa”.',
    grupo: 'Experiencias compartidas, logística invisible.',
    groups: 'Experiencias compartidas, logística invisible.',
    group: 'Experiencias compartidas, logística invisible.',
    couple: 'Una sorpresa curada para que vuelvan a elegirse en cada detalle.',
    family: 'Diseñamos una Ruta con Alma para que la logística desaparezca y aparezca lo importante: ustedes.',
  };

  const heroTitle = isB ? titleB[type] ?? data.heroTitle : data.heroTitle;
  const subcopy = isB ? subB[type] ?? data.subcopy : data.subcopy;

  const hero = data.images.hero;
  const heroIsSvg = hero?.toLowerCase?.().endsWith('.svg');

  return (
    <section className="relative w-full min-h-[60vh] lg:min-h-[72vh]">
      <Image src={hero} alt={heroTitle} fill priority className="object-cover" {...(heroIsSvg ? { unoptimized: true } : {})} />
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 container mx-auto px-4 py-16 lg:py-24 flex flex-col gap-4 max-w-3xl">
        <h1 className="text-4xl lg:text-6xl font-bold text-white drop-shadow">{heroTitle}</h1>
        <p className="text-white/90 text-lg lg:text-xl">{subcopy}</p>
        <div className="mt-4">
          <a href="/randomtripme" className="inline-block bg-[#F2C53D] text-black px-6 py-3 rounded-xl font-semibold focus:outline-none focus:ring-2">RandomtripME</a>
        </div>
      </div>
    </section>
  );
}