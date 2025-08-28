'use client';

import Navbar from '@/components/Navbar';
import ChatFab from '@/components/chrome/ChatFab';
import BgCarousel from '@/components/ui/BgCarousel';
import GlassCard from '@/components/ui/GlassCard';
import { useUserStore } from '@/store/userStore';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Pencil, LogOut } from 'lucide-react';

export default function LoginPage() {
  const { isAuthed, user, openAuth, signOut, upsertPrefs } = useUserStore();

  // Open auth modal if not authenticated
  useEffect(() => {
    if (!isAuthed) {
      openAuth('signin');
    }
  }, [isAuthed, openAuth]);

  // Dummy state for editable fields
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [newEmail, setNewEmail] = useState(user?.email || '');

  useEffect(() => {
    if (user) {
      setNewName(user.name);
      setNewEmail(user.email);
    }
  }, [user]);

  const handleSaveName = () => {
    if (user) {
      // In a real app, this would update the backend
      // For dummy, we can't directly change user.name in store without a dedicated action
      // For now, just toggle editing off
      setEditingName(false);
    }
  };

  const handleSaveEmail = () => {
    if (user) {
      // In a real app, this would update the backend
      // For dummy, just toggle editing off
      setEditingEmail(false);
    }
  };

  const commonChipClasses = "px-3 py-1 rounded-full text-sm font-medium";
  const chipBgClass = "bg-violet-100 text-violet-800";

  return (
    <>
      <Navbar />
      <div id="hero-sentinel" aria-hidden className="h-px w-px" />
      <BgCarousel scrim={0.75} />
      <main className="container mx-auto max-w-5xl px-4 pt-24 md:pt-28 pb-16">
        <h1 className="text-xl font-semibold text-white drop-shadow-sm mb-6">Mi Perfil</h1>

        {!isAuthed ? (
          <GlassCard>
            <div className="p-6 text-center text-neutral-700">
              Inicia sesión para ver tu perfil.
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-6">
            {/* Datos personales */}
            <GlassCard>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-neutral-900">Datos Personales</h2>
                  {/* Dummy edit button for now */}
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-600">Nombre</label>
                    {editingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="flex-grow p-2 border border-neutral-300 rounded-lg"
                        />
                        <button onClick={handleSaveName} className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700">
                          Guardar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-neutral-900">{user?.name}</p>
                        <button onClick={() => setEditingName(true)} className="text-neutral-500 hover:text-neutral-700">
                          <Pencil size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-600">Email</label>
                    {editingEmail ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="flex-grow p-2 border border-neutral-300 rounded-lg"
                        />
                        <button onClick={handleSaveEmail} className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700">
                          Guardar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-neutral-900">{user?.email}</p>
                        <button onClick={() => setEditingEmail(true)} className="text-neutral-500 hover:text-neutral-700">
                          <Pencil size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Preferencias de viaje */}
            <GlassCard>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-neutral-900">Preferencias de Viaje</h2>
                  <button
                    onClick={() => openAuth('onboarding')}
                    className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 flex items-center gap-1"
                  >
                    <Pencil size={14} /> Editar
                  </button>
                </div>
                <div className="space-y-3 text-neutral-900">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Tipo de viajero</p>
                    <span className={`${commonChipClasses} ${chipBgClass}`}>
                      {user?.prefs.travelerType || 'No especificado'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Intereses</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {user?.prefs.interests.length ? (
                        user.prefs.interests.map(interest => (
                          <span key={interest} className={`${commonChipClasses} ${chipBgClass}`}>
                            {interest}
                          </span>
                        ))
                      ) : (
                        <span className="text-neutral-700">Ninguno</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Evitar</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {user?.prefs.dislikes.length ? (
                        user.prefs.dislikes.map(dislike => (
                          <span key={dislike} className={`${commonChipClasses} ${chipBgClass}`}>
                            {dislike}
                          </span>
                        ))
                      ) : (
                        <span className="text-neutral-700">Ninguno</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Presupuesto típico</p>
                    <span className={`${commonChipClasses} ${chipBgClass}`}>
                      {user?.prefs.budget || 'No especificado'}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Métodos de pago */}
            <GlassCard>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Métodos de Pago</h2>
                <p className="text-neutral-700">No hay métodos de pago registrados.</p>
                <button className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm">
                  Agregar método de pago
                </button>
              </div>
            </GlassCard>

            {/* Pasajeros */}
            <GlassCard>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Pasajeros</h2>
                <p className="text-neutral-700">No hay pasajeros registrados.</p>
                <button className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm">
                  Agregar pasajero
                </button>
              </div>
            </GlassCard>

            {/* Privacidad y seguridad */}
            <GlassCard>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Privacidad y Seguridad</h2>
                <button
                  onClick={signOut}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm flex items-center gap-2"
                >
                  <LogOut size={16} /> Cerrar sesión
                </button>
              </div>
            </GlassCard>
          </div>
        )}
      </main>
      <ChatFab />
    </>
  );
}
