'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useUserStore } from '@/store/slices/userStore';
import Navbar from '@/components/Navbar';
import SecureRoute from '@/components/auth/SecureRoute';
import Section from '@/components/layout/Section';
import Hero from '@/components/Hero';
import { Button } from '@/components/ui/button';
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Heart,
  Star,
  Edit,
  Lock,
  Settings,
} from 'lucide-react';

function ProfileContent() {
  const { data: session } = useSession();
  const { user } = useUserStore();

  const currentUser = session?.user || user;

  return (
    <>
      <Hero
        content={{
          title: 'Mi Perfil',
          subtitle: 'Gestiona tu cuenta y preferencias',
          videoSrc: '/videos/hero-video.mp4',
          fallbackImage: '/images/bg-playa-mexico.jpg',
        }}
      />

      <Section>
        <div className="max-w-6xl mx-auto">
          {/* Profile Header Card */}
          <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full border-4 border-white"></div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-neutral-900 mb-2 font-jost">
                  {currentUser?.name || 'Usuario'}
                </h1>
                <p className="text-neutral-600 mb-3">
                  {currentUser?.email || 'usuario@email.com'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
                    Viajero Activo
                  </span>
                  <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
                    {currentUser?.role || 'client'}
                  </span>
                </div>
              </div>

              <Button asChild variant="secondary">
                <Link href="/profile/edit">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Perfil
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-semibold text-neutral-900 mb-4 font-jost">
                  Información Personal
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
                    <User className="h-5 w-5 text-neutral-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-neutral-600 mb-1">Nombre</p>
                      <p className="font-medium text-neutral-900">
                        {currentUser?.name || 'No especificado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
                    <Mail className="h-5 w-5 text-neutral-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-neutral-600 mb-1">Email</p>
                      <p className="font-medium text-neutral-900">
                        {currentUser?.email || 'No especificado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
                    <Calendar className="h-5 w-5 text-neutral-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-neutral-600 mb-1">
                        Miembro desde
                      </p>
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

              {/* Travel Preferences */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-semibold text-neutral-900 mb-4 font-jost">
                  Preferencias de Viaje
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-700 mb-2">
                      Tipo de viajero
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {user?.prefs?.travelerType ? (
                        <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm border border-blue-200">
                          {user.prefs.travelerType}
                        </span>
                      ) : (
                        <p className="text-sm text-neutral-500">
                          No especificado
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-neutral-700 mb-2">
                      Intereses
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {user?.prefs?.interests?.length ? (
                        user.prefs.interests.map((interest) => (
                          <span
                            key={interest}
                            className="px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-sm border border-green-200"
                          >
                            {interest}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-neutral-500">
                          No especificado
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-neutral-700 mb-2">
                      Evitar
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {user?.prefs?.dislikes?.length ? (
                        user.prefs.dislikes.map((dislike) => (
                          <span
                            key={dislike}
                            className="px-3 py-1.5 bg-red-50 text-red-700 rounded-md text-sm border border-red-200"
                          >
                            {dislike}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-neutral-500">
                          No especificado
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Stats Card */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4 font-jost">
                  Estadísticas
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-500" />
                      <span className="text-sm text-neutral-700">Viajes</span>
                    </div>
                    <span className="font-bold text-neutral-900">0</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      <span className="text-sm text-neutral-700">
                        Favoritos
                      </span>
                    </div>
                    <span className="font-bold text-neutral-900">0</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm text-neutral-700">Rating</span>
                    </div>
                    <span className="font-bold text-neutral-900">—</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4 font-jost">
                  Acciones Rápidas
                </h3>
                <div className="space-y-3">
                  <Button
                    asChild
                    className="w-full justify-start"
                    variant="secondary"
                  >
                    <Link href="/profile/edit">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar Perfil
                    </Link>
                  </Button>

                  <Button
                    asChild
                    className="w-full justify-start"
                    variant="secondary"
                  >
                    <Link href="/profile/security">
                      <Lock className="w-4 h-4 mr-2" />
                      Seguridad
                    </Link>
                  </Button>

                  <Button
                    asChild
                    className="w-full justify-start"
                    variant="secondary"
                  >
                    <Link href="/profile/preferences">
                      <Settings className="w-4 h-4 mr-2" />
                      Preferencias
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
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
