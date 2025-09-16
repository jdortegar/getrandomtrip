'use client';

import dynamic from 'next/dynamic';

import { useSession } from 'next-auth/react';
import { useUserStore } from '@/store/userStore';
import Navbar from '@/components/Navbar';
import SecureRoute from '@/components/auth/SecureRoute';
import GlassCard from '@/components/ui/GlassCard';
import BgCarousel from '@/components/ui/BgCarousel';
import { User, Mail, Calendar, MapPin, Heart, Star } from 'lucide-react';

function ProfileContent() {
  const { data: session } = useSession();
  const { user } = useUserStore();

  const currentUser = session?.user || user;

  return (
    <>
      <Navbar />
      <BgCarousel scrim={0.75} />

      <main className="container mx-auto max-w-4xl px-4 pt-24 md:pt-28 pb-16">
        {/* Profile Header */}
        <GlassCard>
          <div className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                  {currentUser?.name || 'Usuario'}
                </h1>
                <p className="text-neutral-600 mb-4">
                  {currentUser?.email || 'usuario@email.com'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    Viajero Activo
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {currentUser?.role || 'client'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <GlassCard>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                  Información Personal
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-neutral-400" />
                    <div>
                      <p className="text-sm text-neutral-600">Nombre</p>
                      <p className="font-medium text-neutral-900">
                        {currentUser?.name || 'No especificado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-neutral-400" />
                    <div>
                      <p className="text-sm text-neutral-600">Email</p>
                      <p className="font-medium text-neutral-900">
                        {currentUser?.email || 'No especificado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-neutral-400" />
                    <div>
                      <p className="text-sm text-neutral-600">Miembro desde</p>
                      <p className="font-medium text-neutral-900">
                        {new Date().toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                  Preferencias de Viaje
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-neutral-600 mb-2">
                      Tipo de viajero
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {user?.prefs?.travelerType && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {user.prefs.travelerType}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-neutral-600 mb-2">Intereses</p>
                    <div className="flex flex-wrap gap-2">
                      {user?.prefs?.interests?.map((interest) => (
                        <span
                          key={interest}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-neutral-600 mb-2">Evitar</p>
                    <div className="flex flex-wrap gap-2">
                      {user?.prefs?.dislikes?.map((dislike) => (
                        <span
                          key={dislike}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                        >
                          {dislike}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <GlassCard>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Estadísticas
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-neutral-600">Viajes</span>
                    </div>
                    <span className="font-semibold text-neutral-900">12</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-neutral-600">
                        Favoritos
                      </span>
                    </div>
                    <span className="font-semibold text-neutral-900">8</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-neutral-600">Rating</span>
                    </div>
                    <span className="font-semibold text-neutral-900">4.8</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Acciones Rápidas
                </h3>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                    <div className="font-medium text-blue-900">
                      Editar Perfil
                    </div>
                    <div className="text-sm text-blue-700">
                      Actualizar información
                    </div>
                  </button>
                  <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                    <div className="font-medium text-green-900">
                      Cambiar Contraseña
                    </div>
                    <div className="text-sm text-green-700">
                      Actualizar seguridad
                    </div>
                  </button>
                  <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                    <div className="font-medium text-purple-900">
                      Preferencias
                    </div>
                    <div className="text-sm text-purple-700">
                      Personalizar viajes
                    </div>
                  </button>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </main>
    </>
  );
}

const ProfilePage = dynamic(() => Promise.resolve(ProfilePageComponent), {
  ssr: false,
});

function ProfilePageComponent() {
  return (
    <SecureRoute>
      <ProfileContent />
    </SecureRoute>
  );
}

export default ProfilePage;
