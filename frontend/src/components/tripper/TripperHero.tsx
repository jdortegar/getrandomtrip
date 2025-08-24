import Image from 'next/image';
'use client';
import clsx from 'clsx';

export default function TripperHero({
  name, heroImage, ambassadorId='167-2021', tierLevel='Rookie',
  agency, location
}: {
  name: string;
  heroImage?: string;
  ambassadorId?: string;
  tierLevel?: 'Rookie'|'Pro'|'Elite';
  agency?: string;
  location?: string;
}) {
  return (
    <section className="bg-[#07143A] text-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10 grid grid-cols-1 md:grid-cols-[220px,1fr] gap-6 md:gap-10 items-center">
        <div className="w-[220px] h-[220px] rounded-xl overflow-hidden mx-auto md:mx-0">
          <Image src={heroImage || '/images/fallback.jpg'} alt={name} width={220} height={220} className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-wide" style={{ fontFamily: 'Playfair Display, serif' }}>
            {name.toUpperCase()}
          </h1>
          {(agency || location) && (
            <div className="mt-3">
              {agency && <p className="underline">{agency}</p>}
              {location && <p className="text-white/80 text-sm">{location}</p>}
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="text-sm bg-white/10 px-3 py-1 rounded-full border border-white/20">
              <strong>Tripper Ambassador:</strong> ID {ambassadorId}
            </span>
            <span className={clsx(
              'text-sm px-3 py-1 rounded-full border',
              tierLevel==='Elite' ? 'bg-yellow-500/20 border-yellow-400' :
              tierLevel==='Pro' ? 'bg-emerald-500/20 border-emerald-400' :
              'bg-white/10 border-white/20'
            )}>
              <strong>Tripper Tier:</strong> {tierLevel}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}