'use client';
import { notFound } from 'next/navigation';
import PageContainer from '@/components/user/PageContainer';
import SectionCard from '@/components/user/SectionCard';
import StatCard from '@/components/user/StatCard';
import { formatUSD } from '@/lib/format';
import { useUserStore } from '@/store/userStore';
import Image from 'next/image';
import { MapPin, ShieldCheck } from 'lucide-react';

export default function PublicProfile({ params }: { params: { handle: string } }) {
  const { user } = useUserStore();
  const handleParam = params.handle?.toLowerCase();

  // Demo: si el store tiene ese handle, mostrar; sino 404.
  const match = user && (user.handle ?? 'usuario').toLowerCase() === handleParam ? user : null;
  if (!match) return notFound();

  const verified = !!match.prefs?.verified;
  const avatar = match.avatar ?? 'https://placehold.co/128x128';

  return (
    <PageContainer>
      <SectionCard>
        <div className="flex items-start gap-4">
          <Image src={avatar} alt="" width={96} height={96} className="rounded-full border border-neutral-200" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{match.name}</h1>
              {verified && <span className="rt-badge rt-badge--ok"><ShieldCheck size={14}/> Verificado</span>}
            </div>
            <div className="rt-subtle mt-1">@{match.handle ?? 'usuario'} · <MapPin className="inline -mt-1" size={14}/> {match.prefs?.country ?? '—'}</div>
            <p className="text-neutral-800 mt-3">{match.prefs?.bio ?? ''}</p>
          </div>
        </div>
      </SectionCard>

      <section className="rt-stats my-6">
        <StatCard label="Reservas (12m)" value={match.metrics?.bookings ?? 0} />
        <StatCard label="Gasto total" value={formatUSD(match.metrics?.spendUSD ?? 0)} />
        <StatCard label="Reseñas" value={match.metrics?.reviews ?? 0} />
        <StatCard label="Favoritos" value={match.metrics?.favs ?? 0} />
      </section>
    </PageContainer>
  );
}
