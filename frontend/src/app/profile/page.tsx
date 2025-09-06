'use client';

import Image from 'next/image';
import Link from 'next/link';
import PageContainer from '@/components/user/PageContainer';
import SectionCard from '@/components/user/SectionCard';
import StatCard from '@/components/user/StatCard';
import { formatUSD } from '@/lib/format';
import { ShieldCheck, Edit3, Link as LinkIcon, MapPin } from 'lucide-react';
import { useUserStore } from '@/store/userStore';

const mockUser = {
  name: 'Santiago Senega',
  handle: 'santi.user',
  country: 'México',
  avatar: 'https://placehold.co/128x128',
  verified: true,
  bio: 'Viajero frecuente, amante del café y los road trips. Probando nuevas rutas cada mes.',
  metrics: { bookings: 6, spendUSD: 2400, reviews: 12, favs: 8 },
  socials: { ig: 'randomtrip.ig', yt: 'randomtrip.yt', web: 'getrandomtrip.com' },
};

export default function ProfilePage() {
  const { user, isAuthed } = useUserStore();

  // Normalización (si no hay user, usa el mock existente)
  const data = user ? {
    name: user.name,
    handle: user.handle ?? 'usuario',
    country: user.prefs?.country ?? '—',
    avatar: user.avatar ?? 'https://placehold.co/128x128',
    verified: !!user.prefs?.verified,
    bio: user.prefs?.bio ?? '',
    metrics: {
      bookings: user.metrics?.bookings ?? 0,
      spendUSD: user.metrics?.spendUSD ?? 0,
      reviews: user.metrics?.reviews ?? 0,
      favs: user.metrics?.favs ?? 0,
    },
    socials: user.socials ?? {},
    publicProfile: !!user.prefs?.publicProfile,
  } : {
    ...mockUser,
    publicProfile: true,
  };
  return (
    <PageContainer>
      {isAuthed && (
        <div className="mb-4 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 px-4 py-2 text-sm">
          Estás viendo la <strong>vista pública</strong> de tu perfil. {data.publicProfile ? 'Actualmente es público.' : 'Actualmente es privado.'} <Link href="/profile/edit" className="underline ml-2">Editar visibilidad</Link>
          {data.publicProfile && data.handle && (
            <Link href={`/u/${data.handle}`} className="underline ml-2">Ver perfil público</Link>
          )}
        </div>
      )}

      {!isAuthed && data.publicProfile === false && (
        <SectionCard>
          <p className="text-sm text-neutral-700">Este perfil es privado.</p>
        </SectionCard>
      )}

      {/* Header */}
      <SectionCard>
        <div className="flex items-start gap-4">
          <Image src={data.avatar} alt="" width={96} height={96} className="rounded-full border border-neutral-200" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{data.name}</h1>
              {data.verified && <span className="rt-badge rt-badge--ok"><ShieldCheck size={14}/> Verificado</span>}
            </div>
            <div className="rt-subtle mt-1">@{data.handle} · <MapPin className="inline -mt-1" size={14}/> {data.country}</div>
            <p className="text-neutral-800 mt-3">{data.bio}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/profile/edit" className="rt-btn rt-btn--ghost"><Edit3 size={16}/> Editar perfil</Link>
              <Link href={`https://instagram.com/${data.socials.ig}`} target="_blank" className="rt-btn rt-btn--ghost"><LinkIcon size={16}/> Instagram</Link>
              <Link href={`https://youtube.com/${data.socials.yt}`} target="_blank" className="rt-btn rt-btn--ghost"><LinkIcon size={16}/> YouTube</Link>
              <Link href={`https://${data.socials.web}`} target="_blank" className="rt-btn rt-btn--ghost"><LinkIcon size={16}/> Web</Link>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Stats */}
      <section className="rt-stats my-6">
        <StatCard label="Reservas (12m)" value={data.metrics.bookings} />
        <StatCard label="Gasto total" value={formatUSD(data.metrics.spendUSD)} />
        <StatCard label="Reseñas" value={data.metrics.reviews} />
        <StatCard label="Favoritos" value={data.metrics.favs} />
      </section>

      {/* Preferencias & Historial */}
      <section className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Preferencias de viaje" actions={<Link href="/profile/edit" className="rt-btn rt-btn--ghost">Editar</Link>}>
          <ul className="rt-list text-sm text-neutral-800">
            <li className="rt-list-item">Alojamientos preferidos: <strong>Boutique / B&B</strong></li>
            <li className="rt-list-item">Estilo: <strong>Café · Gastronomía · Trekking suave</strong></li>
            <li className="rt-list-item">Presupuesto diario: <strong>{formatUSD(150)}</strong></li>
          </ul>
        </SectionCard>

        <SectionCard title="Últimas reseñas">
          <ul className="rt-list text-sm text-neutral-800">
            <li className="rt-list-item">“Ruta del Café” — ★★★★★ — “Excelente curaduría y tiempos.”</li>
            <li className="rt-list-item">“Escapada al Viñedo” — ★★★★☆ — “Lugares hermosos.”</li>
          </ul>
        </SectionCard>

        <SectionCard title="Favoritos">
          <ul className="rt-list text-sm text-neutral-800">
            <li className="rt-list-item">Aventura en la Patagonia</li>
            <li className="rt-list-item">Ruta del Café (CDMX)</li>
          </ul>
        </SectionCard>
      </section>
    </PageContainer>
  );
}
