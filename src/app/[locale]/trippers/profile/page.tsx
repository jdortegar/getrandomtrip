'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUserStore } from '@/store/slices/userStore';
import SecureRoute from '@/components/auth/SecureRoute';
import Section from '@/components/layout/Section';
import { Button } from '@/components/ui/Button';
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
  Briefcase,
  Package,
  TrendingUp,
  DollarSign,
  Users,
  Globe,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type TabType = 'overview' | 'packages' | 'performance' | 'settings';

function TripperProfileContent() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const { user } = useUserStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    heroImage: '',
    location: '',
    tierLevel: '',
    destinations: [] as string[],
    tripperSlug: '',
    commission: 0,
    availableTypes: [] as string[],
  });
  const [stats, setStats] = useState({
    totalPackages: 0,
    totalBookings: 0,
    averageRating: 0,
    totalEarnings: 0,
  });
  const [packages, setPackages] = useState([]);

  const currentUser = session?.user || user;

  // Check if user is a tripper
  if ((currentUser as any)?.role !== 'TRIPPER') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-center gap-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              Acceso Restringido
            </h1>
            <p className="text-neutral-600">
              Esta página es solo para trippers.
            </p>
          </div>
          <Button variant="secondary" onClick={() => router.push('/')}>
            Volver a la página principal
          </Button>
        </div>
      </div>
    );
  }

  // Fetch tripper stats and packages
  useEffect(() => {
    async function fetchTripperData() {
      if (!currentUser?.id) return;

      try {
        // Fetch packages
        const packagesRes = await fetch(
          `/api/packages?ownerId=${currentUser.id}`,
        );
        const packagesData = await packagesRes.json();
        setPackages(packagesData.packages || []);

        // Calculate stats
        const totalPackages = packagesData.packages?.length || 0;
        const totalBookings = 0; // TODO: Calculate from bookings
        const averageRating = 0; // TODO: Calculate from reviews
        const totalEarnings = 0; // TODO: Calculate from payments

        setStats({
          totalPackages,
          totalBookings,
          averageRating,
          totalEarnings,
        });
      } catch (error) {
        console.error('Error fetching tripper data:', error);
      }
    }

    fetchTripperData();
  }, [currentUser?.id]);

  const openModal = () => {
    setIsModalOpen(true);
    setFormData({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      bio: (currentUser as any)?.bio || '',
      heroImage: (currentUser as any)?.heroImage || '',
      location: (currentUser as any)?.location || '',
      tierLevel: (currentUser as any)?.tierLevel || '',
      destinations: (currentUser as any)?.destinations || [],
      tripperSlug: (currentUser as any)?.tripperSlug || '',
      commission: (currentUser as any)?.commission || 0,
      availableTypes: (currentUser as any)?.availableTypes || [],
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveTab('overview');
  };

  const handleSaveTripper = async () => {
    try {
      const response = await fetch('/api/user/tripper', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: formData.bio,
          heroImage: formData.heroImage,
          location: formData.location,
          tierLevel: formData.tierLevel,
          destinations: formData.destinations.filter((d) => d.trim() !== ''),
          tripperSlug: formData.tripperSlug,
          commission: formData.commission,
          availableTypes: formData.availableTypes.filter(
            (t) => t.trim() !== '',
          ),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            bio: data.user.bio,
            heroImage: data.user.heroImage,
            location: data.user.location,
            tierLevel: data.user.tierLevel,
            destinations: data.user.destinations,
            tripperSlug: data.user.tripperSlug,
            commission: data.user.commission,
            availableTypes: data.user.availableTypes,
          },
        });

        toast.success('Perfil de tripper actualizado correctamente');
        closeModal();
      } else {
        toast.error('Error al actualizar perfil de tripper');
      }
    } catch (error) {
      console.error('Error updating tripper profile:', error);
      toast.error('Error al actualizar perfil de tripper');
    }
  };

  return (
    <>
      {/* Simple header instead of Hero component */}
      <div className="bg-primary py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-white mb-4 font-caveat">
            Mi Perfil de Tripper
          </h1>
          <p className="text-xl text-white/90 font-jost">
            Gestiona tu negocio de viajes
          </p>
        </div>
      </div>

      <Section>
        <div className="max-w-6xl mx-auto">
          {/* Tripper Header Card */}
          <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {currentUser?.name?.charAt(0)?.toUpperCase() || 'T'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full border-4 border-white"></div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-neutral-900 mb-2 font-jost">
                  {currentUser?.name || 'Tripper'}
                </h1>
                <p className="text-neutral-600 mb-3">
                  {currentUser?.email || 'tripper@email.com'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
                    Tripper{' '}
                    {(
                      (currentUser as any)?.tierLevel || 'rookie'
                    ).toUpperCase()}
                  </span>
                  <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
                    {(currentUser as any)?.location || 'Sin ubicación'}
                  </span>
                </div>
              </div>

              <Button variant="secondary" onClick={openModal}>
                <Edit className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <>
                  {/* Bio Section */}
                  {(currentUser as any)?.bio && (
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                      <h2 className="text-xl font-semibold text-neutral-900 mb-4 font-jost">
                        Sobre Mí
                      </h2>
                      <p className="text-neutral-700 leading-relaxed">
                        {(currentUser as any)?.bio}
                      </p>
                    </div>
                  )}

                  {/* Destinations */}
                  {(currentUser as any)?.destinations?.length > 0 && (
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                      <h2 className="text-xl font-semibold text-neutral-900 mb-4 font-jost">
                        Mis Destinos
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {((currentUser as any)?.destinations || []).map(
                          (destination: string) => (
                            <span
                              key={destination}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm border border-blue-200"
                            >
                              {destination}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Available Types */}
                  {(currentUser as any)?.availableTypes?.length > 0 && (
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                      <h2 className="text-xl font-semibold text-neutral-900 mb-4 font-jost">
                        Tipos de Viaje que Ofrezco
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {((currentUser as any)?.availableTypes || []).map(
                          (type: string) => (
                            <span
                              key={type}
                              className="px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-sm border border-green-200"
                            >
                              {type}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Packages Tab */}
              {activeTab === 'packages' && (
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-neutral-900 font-jost">
                      Mis Paquetes
                    </h2>
                    <Button
                      onClick={() => router.push('/dashboard/tripper/packages')}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Gestionar Paquetes
                    </Button>
                  </div>

                  {packages.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-neutral-600 mb-4">
                        Tienes {packages.length} paquete(s) creado(s). Ve al
                        dashboard para crear nuevos o gestionar los existentes.
                      </p>
                      <div className="grid gap-4">
                        {packages.slice(0, 5).map((pkg: any) => (
                          <div
                            key={pkg.id}
                            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-neutral-900">
                                  {pkg.title}
                                </h3>
                                <p className="text-sm text-neutral-600 mt-1">
                                  {pkg.teaser}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
                                  <span>
                                    {pkg.type} • {pkg.level}
                                  </span>
                                  <span>
                                    {pkg.minNights}-{pkg.maxNights} noches
                                  </span>
                                  <span>
                                    {pkg.minPax}-{pkg.maxPax} personas
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-neutral-900">
                                  {pkg.displayPrice}
                                </p>
                                <p className="text-sm text-neutral-500">
                                  {pkg.isActive ? 'Activo' : 'Inactivo'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {packages.length > 5 && (
                        <div className="text-center pt-4">
                          <Button
                            variant="outline"
                            onClick={() =>
                              router.push('/dashboard/tripper/packages')
                            }
                          >
                            Ver todos los paquetes ({packages.length})
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                      <p className="text-neutral-500 mb-4">
                        No tienes paquetes creados aún
                      </p>
                      <Button
                        onClick={() =>
                          router.push('/dashboard/tripper/packages')
                        }
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Ir al Dashboard para Crear Paquetes
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Performance Tab */}
              {activeTab === 'performance' && (
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-neutral-900 font-jost">
                      Rendimiento
                    </h2>
                    <Button
                      variant="outline"
                      onClick={() => router.push('/dashboard/tripper')}
                    >
                      Ver Dashboard Completo
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-neutral-900">
                        {stats.totalBookings}
                      </p>
                      <p className="text-sm text-neutral-600">
                        Reservas Totales
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-neutral-900">
                        {stats.averageRating > 0
                          ? stats.averageRating.toFixed(1)
                          : '—'}
                      </p>
                      <p className="text-sm text-neutral-600">
                        Rating Promedio
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-neutral-900">
                        ${stats.totalEarnings}
                      </p>
                      <p className="text-sm text-neutral-600">
                        Ganancias Totales
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-neutral-900">
                        {stats.totalPackages}
                      </p>
                      <p className="text-sm text-neutral-600">
                        Paquetes Activos
                      </p>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      💡 Para ver estadísticas detalladas, análisis de
                      rendimiento y gestionar tus paquetes, ve al{' '}
                      <button
                        onClick={() => router.push('/dashboard/tripper')}
                        className="font-semibold underline hover:text-blue-900"
                      >
                        Dashboard de Tripper
                      </button>
                      .
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Navigation Tabs */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4 font-jost">
                  Navegación
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeTab === 'overview'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-neutral-600 hover:bg-gray-50'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 inline mr-2" />
                    Resumen
                  </button>
                  <button
                    onClick={() => setActiveTab('packages')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeTab === 'packages'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-neutral-600 hover:bg-gray-50'
                    }`}
                  >
                    <Package className="w-4 h-4 inline mr-2" />
                    Vista de Paquetes
                  </button>
                  <button
                    onClick={() => setActiveTab('performance')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeTab === 'performance'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-neutral-600 hover:bg-gray-50'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 inline mr-2" />
                    Resumen de Rendimiento
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/tripper/dashboard')}
                    className="w-full text-left px-3 py-2 rounded-md text-sm transition-colors bg-blue-600 text-white hover:bg-blue-700 mt-2"
                  >
                    <Settings className="w-4 h-4 inline mr-2" />
                    Ir al Dashboard
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4 font-jost">
                  Estadísticas Rápidas
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Paquetes</span>
                    <span className="font-semibold text-neutral-900">
                      {stats.totalPackages}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Reservas</span>
                    <span className="font-semibold text-neutral-900">
                      {stats.totalBookings}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Rating</span>
                    <span className="font-semibold text-neutral-900">
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

        {/* Edit Profile Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b flex items-center justify-between">
                <div className="flex-1 p-6">
                  <h3 className="text-xl font-semibold text-neutral-900 font-jost">
                    Editar Perfil de Tripper
                  </h3>
                </div>
                <button
                  onClick={closeModal}
                  className="p-6 text-neutral-500 hover:text-neutral-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Biografía
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      placeholder="Cuéntanos sobre ti como tripper..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Imagen Hero
                    </label>
                    <Input
                      type="url"
                      value={formData.heroImage}
                      onChange={(e) =>
                        setFormData({ ...formData, heroImage: e.target.value })
                      }
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Ubicación
                    </label>
                    <Input
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      placeholder="Buenos Aires, Argentina"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Nivel de Tripper
                    </label>
                    <select
                      value={formData.tierLevel}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tierLevel: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="rookie">Rookie</option>
                      <option value="pro">Pro</option>
                      <option value="elite">Elite</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Destinos (separados por coma)
                    </label>
                    <Input
                      type="text"
                      value={formData.destinations.filter((d) => d).join(', ')}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          destinations: e.target.value
                            .split(',')
                            .map((d) => d.trim())
                            .filter((d) => d !== ''),
                        })
                      }
                      placeholder="Argentina, Chile, Uruguay"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Slug de Tripper
                    </label>
                    <Input
                      type="text"
                      value={formData.tripperSlug}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tripperSlug: e.target.value,
                        })
                      }
                      placeholder="dawson"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Comisión (%)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={formData.commission}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          commission: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.15"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Tipos Disponibles (separados por coma)
                    </label>
                    <Input
                      type="text"
                      value={formData.availableTypes
                        .filter((t) => t)
                        .join(', ')}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          availableTypes: e.target.value
                            .split(',')
                            .map((t) => t.trim())
                            .filter((t) => t !== ''),
                        })
                      }
                      placeholder="solo, couple, family"
                    />
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t p-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveTripper} className="flex-1">
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

const TripperProfilePage = dynamic(
  () => Promise.resolve(TripperProfilePageComponent),
  {
    ssr: false,
  },
);

function TripperProfilePageComponent() {
  return (
    <SecureRoute>
      <TripperProfileContent />
    </SecureRoute>
  );
}

export default TripperProfilePage;
