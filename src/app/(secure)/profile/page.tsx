'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUserStore } from '@/store/slices/userStore';
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
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type TabType = 'personal' | 'preferences' | 'security';

function ProfileContent() {
  const { data: session, update: updateSession } = useSession();
  const { user } = useUserStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    travelerType: '',
    interests: [] as string[],
    dislikes: [] as string[],
  });
  const [stats, setStats] = useState({
    totalTrips: 0,
    averageRating: 0,
  });

  const currentUser = session?.user || user;

  // Fetch user stats
  useEffect(() => {
    async function fetchStats() {
      if (!currentUser?.id) {
        console.log('No user ID available');
        return;
      }

      try {
        console.log('Fetching trips for user:', currentUser.id);
        const tripsRes = await fetch(`/api/trips?userId=${currentUser.id}`);
        const tripsData = await tripsRes.json();
        console.log('Trips response:', tripsData);

        if (tripsData.error) {
          console.error('API Error:', tripsData.error, tripsData.details);
          return;
        }

        const trips = tripsData.trips || [];

        const ratingsTrips = trips.filter((t: any) => t.customerRating);
        const avgRating =
          ratingsTrips.length > 0
            ? ratingsTrips.reduce(
                (sum: number, t: any) => sum + (t.customerRating || 0),
                0,
              ) / ratingsTrips.length
            : 0;

        console.log('Stats calculated:', {
          totalTrips: trips.length,
          avgRating,
        });
        setStats({
          totalTrips: trips.length,
          averageRating: avgRating,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    }

    fetchStats();
  }, [currentUser?.id, session]);

  const openModal = () => {
    setIsModalOpen(true);
    // Pre-fill form with current data
    // User data comes from NextAuth session or Zustand store
    const travelerType =
      (user as any)?.travelerType || (currentUser as any)?.travelerType || '';
    const interests =
      (user as any)?.interests || (currentUser as any)?.interests || [];
    const dislikes =
      (user as any)?.dislikes || (currentUser as any)?.dislikes || [];

    setFormData({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      travelerType,
      interests: Array.isArray(interests) ? interests : [],
      dislikes: Array.isArray(dislikes) ? dislikes : [],
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveTab('personal');
    setFormData({
      name: '',
      email: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      travelerType: '',
      interests: [],
      dislikes: [],
    });
  };

  const handleSavePersonal = async () => {
    try {
      const response = await fetch('/api/user/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update NextAuth session
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            name: data.user.name,
            email: data.user.email,
          },
        });

        toast.success('Información actualizada correctamente');
        closeModal();
      } else {
        toast.error('Error al actualizar información');
      }
    } catch (error) {
      console.error('Error updating personal info:', error);
      toast.error('Error al actualizar información');
    }
  };

  const handleSavePreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          travelerType: formData.travelerType,
          interests: formData.interests.filter((i) => i.trim() !== ''),
          dislikes: formData.dislikes.filter((d) => d.trim() !== ''),
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update NextAuth session with new preferences
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            travelerType: data.user.travelerType,
            interests: data.user.interests,
            dislikes: data.user.dislikes,
          },
        });

        toast.success('Preferencias actualizadas correctamente');
        closeModal();
      } else {
        toast.error('Error al actualizar preferencias');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Error al actualizar preferencias');
    }
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const response = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      if (response.ok) {
        toast.success('Contraseña actualizada correctamente');
        closeModal();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error al cambiar contraseña');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Error al cambiar contraseña');
    }
  };

  return (
    <>
      <Hero
        content={{
          title: 'Mi Perfil',
          subtitle: 'Gestiona tu cuenta y preferencias',
          videoSrc: '/videos/hero-video.mp4',
          fallbackImage: '/images/bg-playa-mexico.jpg',
        }}
        className="!h-[40vh]"
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

              <Button variant="secondary" onClick={openModal}>
                <Edit className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Main Content */}
            <div className="space-y-6">
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
                      {(user as any)?.travelerType ||
                      (currentUser as any)?.travelerType ? (
                        <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm border border-blue-200">
                          {(user as any)?.travelerType ||
                            (currentUser as any)?.travelerType}
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
                      {(user as any)?.interests?.length ||
                      (currentUser as any)?.interests?.length ? (
                        (
                          (user as any)?.interests ||
                          (currentUser as any)?.interests ||
                          []
                        ).map((interest: string) => (
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
                      {(user as any)?.dislikes?.length ||
                      (currentUser as any)?.dislikes?.length ? (
                        (
                          (user as any)?.dislikes ||
                          (currentUser as any)?.dislikes ||
                          []
                        ).map((dislike: string) => (
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
                    <span className="font-bold text-neutral-900">
                      {stats.totalTrips}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm text-neutral-700">Rating</span>
                    </div>
                    <span className="font-bold text-neutral-900">
                      {stats.averageRating > 0
                        ? stats.averageRating.toFixed(1)
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal with Tabs */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b flex items-center justify-between">
                <div className="flex-1 p-6">
                  <h3 className="text-xl font-semibold text-neutral-900 font-jost">
                    Editar Perfil
                  </h3>
                </div>
                <button
                  onClick={closeModal}
                  className="p-6 text-neutral-500 hover:text-neutral-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="border-b">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('personal')}
                    className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'personal'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <User className="w-4 h-4 inline mr-2" />
                    Personal
                  </button>
                  <button
                    onClick={() => setActiveTab('preferences')}
                    className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'preferences'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Settings className="w-4 h-4 inline mr-2" />
                    Preferencias
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'security'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Lock className="w-4 h-4 inline mr-2" />
                    Seguridad
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'personal' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Nombre
                      </label>
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Tu nombre completo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'preferences' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Tipo de Viajero
                      </label>
                      <select
                        value={formData.travelerType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            travelerType: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="solo">Solo</option>
                        <option value="couple">Pareja</option>
                        <option value="family">Familia</option>
                        <option value="group">Grupo</option>
                        <option value="honeymoon">Luna de Miel</option>
                        <option value="paws">Con Mascotas</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Intereses (separados por coma)
                      </label>
                      <Input
                        type="text"
                        value={formData.interests.filter((i) => i).join(', ')}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            interests: e.target.value
                              .split(',')
                              .map((i) => i.trim())
                              .filter((i) => i !== ''),
                          })
                        }
                        placeholder="aventura, cultura, comida"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Evitar (separados por coma)
                      </label>
                      <Input
                        type="text"
                        value={formData.dislikes.filter((d) => d).join(', ')}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dislikes: e.target.value
                              .split(',')
                              .map((i) => i.trim())
                              .filter((i) => i !== ''),
                          })
                        }
                        placeholder="multitudes, frío"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Contraseña Actual
                      </label>
                      <Input
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            currentPassword: e.target.value,
                          })
                        }
                        placeholder="••••••••"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Nueva Contraseña
                      </label>
                      <Input
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            newPassword: e.target.value,
                          })
                        }
                        placeholder="••••••••"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Confirmar Nueva Contraseña
                      </label>
                      <Input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t p-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (activeTab === 'personal') handleSavePersonal();
                    else if (activeTab === 'preferences')
                      handleSavePreferences();
                    else if (activeTab === 'security') handleChangePassword();
                  }}
                  className="flex-1"
                >
                  Guardar Cambios
                </Button>
              </div>
            </div>
          </div>
        )}
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
