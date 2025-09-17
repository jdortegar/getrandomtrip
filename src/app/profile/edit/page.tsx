'use client';

import PageContainer from '@/components/user/PageContainer';
import SectionCard from '@/components/user/SectionCard';
import GlassCard from '@/components/ui/GlassCard';
import { useUserStore } from '@/store/slices/userStore';
import { useEffect, useState } from 'react';
import Link from 'next/link'; // Added import
import type { TravelerType, BudgetLevel } from '@/store/slices/userStore';

export default function EditProfilePage() {
  const { isAuthed, user, openAuth, updateAccount, upsertPrefs } = useUserStore();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [travelerType, setTravelerType] = useState<TravelerType | undefined>(user?.prefs.travelerType);
  const [budget, setBudget] = useState<BudgetLevel | undefined>(user?.prefs.budget);
  const [publicProfile, setPublicProfile] = useState<boolean>(!!user?.prefs.publicProfile);

  useEffect(() => {
    if (!isAuthed) openAuth('signin');
  }, [isAuthed, openAuth]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setTravelerType(user.prefs.travelerType);
      setBudget(user.prefs.budget);
      setPublicProfile(!!user.prefs.publicProfile);
    }
  }, [user]);

  const onSaveAccount = () => updateAccount?.(name, email);
  const onSavePrefs = () => upsertPrefs?.({ travelerType, budget, publicProfile });

  if (!isAuthed) {
    return (
      <PageContainer>
        <GlassCard><div className="p-6 text-center text-neutral-700">Inicia sesión para editar tu perfil.</div></GlassCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h1 className="rt-h1 mb-4">Editar perfil</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Cuenta">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-neutral-700">Nombre</label>
            <input className="rt-input" value={name} onChange={e=>setName(e.target.value)} />
            <label className="block mt-3 text-sm font-medium text-neutral-700">Email</label>
            <input className="rt-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
            <div className="mt-4">
              <button className="rt-btn rt-btn--primary" onClick={onSaveAccount}>Guardar cuenta</button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Preferencias">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-neutral-700">Tipo de viajero</label>
            <select
              className="rt-input"
              value={travelerType ?? ''}
              onChange={e => setTravelerType((e.target.value || undefined) as TravelerType | undefined)}
            >
              <option value="">Selecciona…</option>
              <option value="solo">Solo</option>
              <option value="pareja">Pareja</option>
              <option value="familia">Familia</option>
              <option value="amigos">Amigos</option>
              <option value="empresa">Empresa</option>
            </select>

            <label className="block mt-3 text-sm font-medium text-neutral-700">Presupuesto típico</label>
            <select
              className="rt-input"
              value={budget ?? ''}
              onChange={e => setBudget((e.target.value || undefined) as BudgetLevel | undefined)}
            >
              <option value="">Selecciona…</option>
              <option value="low">Low</option>
              <option value="mid">Mid</option>
              <option value="high">High</option>
            </select>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-700">Perfil público</label>
              <input
                type="checkbox"
                checked={publicProfile}
                onChange={(e) => setPublicProfile(e.target.checked)}
                className="h-4 w-4"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={onSavePrefs} className="rt-btn rt-btn--primary">Guardar preferencias</button>
              <Link href="/profile" className="rt-btn rt-btn--ghost">Ver vista pública</Link>
            </div>
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}