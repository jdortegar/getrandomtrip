'use client';

import dynamic from 'next/dynamic';

import { useSession } from 'next-auth/react';
import { useUserStore } from '@/store/userStore';
import Navbar from '@/components/Navbar';
import SecureRoute from '@/components/auth/SecureRoute';
import GlassCard from '@/components/ui/GlassCard';
import BgCarousel from '@/components/ui/BgCarousel';
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
} from 'lucide-react';

function TripperContent() {
  const { data: session } = useSession();
  const { user } = useUserStore();

  const currentUser = session?.user || user;

  // Mock data for tripper dashboard
  const tripperStats = {
    totalBookings: 47,
    monthlyRevenue: 12500,
    averageRating: 4.9,
    activePackages: 12,
    totalClients: 34,
    conversionRate: 23.5,
  };

  const recentBookings = [
    {
      id: 1,
      clientName: 'María García',
      package: 'París Romántico',
      date: '2024-03-15',
      amount: 2500,
      status: 'confirmed',
    },
    {
      id: 2,
      clientName: 'Carlos López',
      package: 'Tokio Adventure',
      date: '2024-03-12',
      amount: 3200,
      status: 'pending',
    },
    {
      id: 3,
      clientName: 'Ana Martínez',
      package: 'Barcelona Cultural',
      date: '2024-03-10',
      amount: 1800,
      status: 'completed',
    },
  ];

  return (
    <>
      <Navbar />
      <BgCarousel scrim={0.75} />

      <main className="container mx-auto max-w-7xl px-4 pt-24 md:pt-28 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Tripper OS 🧳
          </h1>
          <p className="text-neutral-600">
            Gestiona tus paquetes de viaje y clientes
          </p>
        </div>

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
                    ${tripperStats.monthlyRevenue.toLocaleString()}
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
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Ver todas
                  </button>
                </div>
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {booking.clientName.charAt(0)}
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
                            {booking.date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-neutral-900">
                          ${booking.amount.toLocaleString()}
                        </p>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            booking.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {booking.status === 'confirmed' && 'Confirmado'}
                          {booking.status === 'pending' && 'Pendiente'}
                          {booking.status === 'completed' && 'Completado'}
                        </span>
                      </div>
                    </div>
                  ))}
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
                  <button className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                    <Plus className="h-5 w-5 text-blue-600" />
                    <div className="text-left">
                      <div className="font-medium text-blue-900">
                        Crear Paquete
                      </div>
                      <div className="text-sm text-blue-700">
                        Nueva oferta de viaje
                      </div>
                    </div>
                  </button>

                  <button className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    <div className="text-left">
                      <div className="font-medium text-green-900">
                        Ver Estadísticas
                      </div>
                      <div className="text-sm text-green-700">
                        Análisis detallado
                      </div>
                    </div>
                  </button>

                  <button className="w-full flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                    <Settings className="h-5 w-5 text-purple-600" />
                    <div className="text-left">
                      <div className="font-medium text-purple-900">
                        Configuración
                      </div>
                      <div className="text-sm text-purple-700">
                        Ajustes del perfil
                      </div>
                    </div>
                  </button>
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
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Paquete
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Sample Package Cards */}
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-6 rounded-lg">
                  <h3 className="font-semibold mb-2">París Romántico</h3>
                  <p className="text-sm opacity-90 mb-4">3 días, 2 noches</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">$2,500</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm">4.9</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-teal-600 text-white p-6 rounded-lg">
                  <h3 className="font-semibold mb-2">Tokio Adventure</h3>
                  <p className="text-sm opacity-90 mb-4">5 días, 4 noches</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">$3,200</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm">4.8</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 rounded-lg">
                  <h3 className="font-semibold mb-2">Barcelona Cultural</h3>
                  <p className="text-sm opacity-90 mb-4">4 días, 3 noches</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">$1,800</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm">4.7</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </main>
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
