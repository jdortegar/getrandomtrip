'use client';

import Image from 'next/image';
import Link from 'next/link';
import PageContainer from '@/components/user/PageContainer';
import SectionCard from '@/components/user/SectionCard';
import StatCard from '@/components/user/StatCard';
import { formatUSD } from '@/lib/format';
import { ShieldCheck, Edit3, Link as LinkIcon, MapPin } from 'lucide-react';

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
  return (
    <PageContainer>
      {/* Header */}
      <SectionCard>
        <div className="flex items-start gap-4">
          <Image src={mockUser.avatar} alt="" width={96} height={96} className="rounded-full border border-neutral-200" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{mockUser.name}</h1>
              {mockUser.verified && <span className="rt-badge rt-badge--ok"><ShieldCheck size={14}/> Verificado</span>}
            </div>
            <div className="rt-subtle mt-1">@{mockUser.handle} · <MapPin className="inline -mt-1" size={14}/> {mockUser.country}</div>
            <p className="text-neutral-800 mt-3">{mockUser.bio}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/profile/edit" className="rt-btn rt-btn--ghost"><Edit3 size={16}/> Editar perfil</Link>
              <Link href={`https://instagram.com/${mockUser.socials.ig}`} target="_blank" className="rt-btn rt-btn--ghost"><LinkIcon size={16}/> Instagram</Link>
              <Link href={`https://youtube.com/${mockUser.socials.yt}`} target="_blank" className="rt-btn rt-btn--ghost"><LinkIcon size={16}/> YouTube</Link>
              <Link href={`https://${mockUser.socials.web}`} target="_blank" className="rt-btn rt-btn--ghost"><LinkIcon size={16}/> Web</Link>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Stats */}
      <section className="rt-stats my-6">
        <StatCard label="Reservas (12m)" value={mockUser.metrics.bookings} />
        <StatCard label="Gasto total" value={formatUSD(mockUser.metrics.spendUSD)} />
        <StatCard label="Reseñas" value={mockUser.metrics.reviews} />
        <StatCard label="Favoritos" value={mockUser.metrics.favs} />
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
