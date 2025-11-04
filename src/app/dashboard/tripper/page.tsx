'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { useSession } from 'next-auth/react';
import { useUserStore } from '@/store/slices/userStore';
import SecureRoute from '@/components/auth/SecureRoute';
import Section from '@/components/layout/Section';
import Hero from '@/components/Hero';
import GlassCard from '@/components/ui/GlassCard';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import {
  Users,
  DollarSign,
  TrendingUp,
  Star,
  MapPin,
  Calendar,
  Plus,
  Settings,
  BarChart3,
  Book,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalBookings: number;
  monthlyRevenue: number;
  averageRating: number;
  activePackages: number;
  totalClients: number;
  conversionRate: number;
}

interface RecentBooking {
  id: string;
  clientName: string;
  clientEmail: string;
  package: string;
  packageId?: string;
  date: string;
  amount: number;
  status: string;
  paymentStatus: string;
}

function TripperContent() {
  const { data: session } = useSession();
  const { user } = useUserStore();

  const currentUser = session?.user || user;

  const [tripperStats, setTripperStats] = useState<DashboardStats>({
    totalBookings: 0,
    monthlyRevenue: 0,
    averageRating: 0,
    activePackages: 0,
    totalClients: 0,
    conversionRate: 0,
  });

  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!currentUser?.id) return;

      try {
        setLoading(true);
        const response = await fetch('/api/tripper/dashboard');
        const data = await response.json();

        if (response.ok && data.stats && data.recentBookings) {
          setTripperStats(data.stats);
          setRecentBookings(data.recentBookings);
        } else {
          console.error('Error fetching dashboard data:', data.error);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [currentUser?.id]);

  if (loading) {
    return (
      <>
        <Hero
          content={{
            title: 'Tripper OS 🧳',
            subtitle: 'Cargando tu dashboard...',
            videoSrc: '/videos/hero-video.mp4',
            fallbackImage: '/images/bg-playa-mexico.jpg',
          }}
          className="!h-[40vh]"
        />
        <Section>
          <div className="max-w-7xl mx-auto">
            <LoadingSpinner />
          </div>
        </Section>
      </>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      confirmed: 'Confirmado',
      revealed: 'Revelado',
      completed: 'Completado',
      pending: 'Pendiente',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    if (status === 'confirmed' || status === 'completed') {
      return 'bg-green-100 text-green-800';
    }
    if (status === 'revealed') {
      return 'bg-purple-100 text-purple-800';
    }
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    <>
      <Hero
        content={{
          title: 'Tripper OS 🧳',
          subtitle: 'Gestiona tus paquetes de viaje y clientes',
          videoSrc: '/videos/hero-video.mp4',
          fallbackImage: '/images/bg-playa-mexico.jpg',
        }}
        className="!h-[40vh]"
      />

      <Section>
        <div className="max-w-7xl mx-auto">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <GlassCard>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Reservas Totales</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {tripperStats.totalBookings}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Ingresos Mensuales</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    ${tripperStats.monthlyRevenue.toLocaleString('es-AR')}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Rating Promedio</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {tripperStats.averageRating}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Paquetes Activos</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {tripperStats.activePackages}
                  </p>
                </div>
                <MapPin className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Bookings */}
          <div className="lg:col-span-2">
            <GlassCard>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-neutral-900">
                    Reservas Recientes
                  </h2>
                  <Link
                    href="/dashboard/tripper/bookings"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Ver todas
                  </Link>
                </div>
                <div className="space-y-4">
                  {recentBookings.length === 0 ? (
                    <p className="text-center text-neutral-500 py-8">
                      No hay reservas recientes
                    </p>
                  ) : (
                    recentBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {booking.clientName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">
                              {booking.clientName}
                            </p>
                            <p className="text-sm text-neutral-600">
                              {booking.package}
                            </p>
                            <p className="text-xs text-neutral-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(booking.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-neutral-900">
                            ${booking.amount.toLocaleString('es-AR')}
                          </p>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                              booking.status,
                            )}`}
                          >
                            {getStatusLabel(booking.status)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <GlassCard>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Acciones Rápidas
                </h3>
                <div className="space-y-3">
                  <Link
                    href="/dashboard/tripper/packages"
                    className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Plus className="h-5 w-5 text-blue-600" />
                    <div className="text-left">
                      <div className="font-medium text-blue-900">
                        Crear Paquete
                      </div>
                      <div className="text-sm text-blue-700">
                        Nueva oferta de viaje
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/tripper/earnings"
                    className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    <div className="text-left">
                      <div className="font-medium text-green-900">
                        Ver Ganancias
                      </div>
                      <div className="text-sm text-green-700">
                        Análisis detallado
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/tripper/reviews"
                    className="w-full flex items-center gap-3 p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                  >
                    <Star className="h-5 w-5 text-yellow-600" />
                    <div className="text-left">
                      <div className="font-medium text-yellow-900">
                        Reseñas & NPS
                      </div>
                      <div className="text-sm text-yellow-700">
                        Ver feedback
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/tripper/blogs"
                    className="w-full flex items-center gap-3 p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    <Book className="h-5 w-5 text-indigo-600" />
                    <div className="text-left">
                      <div className="font-medium text-indigo-900">
                        Mis Posts
                      </div>
                      <div className="text-sm text-indigo-700">
                        Gestionar blog
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/trippers/profile"
                    className="w-full flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    <Settings className="h-5 w-5 text-purple-600" />
                    <div className="text-left">
                      <div className="font-medium text-purple-900">
                        Configuración
                      </div>
                      <div className="text-sm text-purple-700">
                        Ajustes del perfil
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Métricas Clave
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">
                      Clientes Totales
                    </span>
                    <span className="font-semibold text-neutral-900">
                      {tripperStats.totalClients}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">
                      Tasa de Conversión
                    </span>
                    <span className="font-semibold text-neutral-900">
                      {tripperStats.conversionRate}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">
                      Crecimiento
                    </span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="font-semibold text-green-600">
                        +12.5%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Package Management */}
        <div className="mt-8">
          <GlassCard>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-neutral-900">
                  Mis Paquetes
                </h2>
                <Link
                  href="/dashboard/tripper/packages"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo Paquete
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tripperStats.activePackages === 0 ? (
                  <div className="col-span-full text-center py-8 text-neutral-500">
                    <p className="mb-4">No tienes paquetes activos aún</p>
                    <Link
                      href="/dashboard/tripper/packages"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Plus className="h-4 w-4" />
                      Crear tu primer paquete
                    </Link>
                  </div>
                ) : (
                  <p className="col-span-full text-sm text-neutral-600">
                    {tripperStats.activePackages} paquete(s) activo(s).{' '}
                    <Link
                      href="/dashboard/tripper/packages"
                      className="text-blue-600 hover:underline"
                    >
                      Ver todos →
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </GlassCard>
        </div>
        </div>
      </Section>
    </>
  );
}

const TripperPage = dynamic(() => Promise.resolve(TripperPageComponent), {
  ssr: false,
});

function TripperPageComponent() {
  return (
    <SecureRoute requiredRole="tripper">
      <TripperContent />
    </SecureRoute>
  );
}

export default TripperPage;
