'use client';

import dynamic from 'next/dynamic';

import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import SecureRoute from '@/components/auth/SecureRoute';
import GlassCard from '@/components/ui/GlassCard';
import BgCarousel from '@/components/media/BgCarousel';
import { Calendar, MapPin, Plane, Star, TrendingUp, Users } from 'lucide-react';
import { useUserStore } from '@/store/slices';

function DashboardContent() {
  const { data: session } = useSession();
  const { user } = useUserStore();

  const currentUser = session?.user || user;
  const userRole = currentUser?.role || 'client';

  // Mock data - in real app, this would come from API
  const stats = {
    totalTrips: 12,
    upcomingTrips: 3,
    completedTrips: 9,
    favoriteDestinations: ['París', 'Tokio', 'Nueva York'],
    totalSpent: 15420,
    averageRating: 4.8,
  };

  const recentTrips = [
    {
      id: 1,
      destination: 'París, Francia',
      date: '2024-03-15',
      status: 'completed',
      rating: 5,
    },
    {
      id: 2,
      destination: 'Tokio, Japón',
      date: '2024-02-20',
      status: 'completed',
      rating: 5,
    },
    {
      id: 3,
      destination: 'Barcelona, España',
      date: '2024-04-10',
      status: 'upcoming',
      rating: null,
    },
  ];

  return (
    <>
      <Navbar />
      <BgCarousel scrim={0.75} />

      <main className="container mx-auto max-w-7xl px-4 pt-24 md:pt-28 pb-16">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            ¡Hola, {currentUser?.name || 'Viajero'}! 👋
          </h1>
          <p className="text-neutral-600">
            Bienvenido a tu panel de viajes personalizado
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <GlassCard>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Viajes Totales</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {stats.totalTrips}
                  </p>
                </div>
                <Plane className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Próximos Viajes</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {stats.upcomingTrips}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Gasto Total</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    ${stats.totalSpent.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Rating Promedio</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {stats.averageRating}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Trips */}
          <div className="lg:col-span-2">
            <GlassCard>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                  Viajes Recientes
                </h2>
                <div className="space-y-4">
                  {recentTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-neutral-400" />
                        <div>
                          <p className="font-medium text-neutral-900">
                            {trip.destination}
                          </p>
                          <p className="text-sm text-neutral-600">
                            {trip.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {trip.status === 'completed' && trip.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-neutral-600">
                              {trip.rating}
                            </span>
                          </div>
                        )}
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            trip.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {trip.status === 'completed'
                            ? 'Completado'
                            : 'Próximo'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Quick Actions & Favorites */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <GlassCard>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Acciones Rápidas
                </h3>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                    <div className="font-medium text-blue-900">
                      Planificar Nuevo Viaje
                    </div>
                    <div className="text-sm text-blue-700">
                      Crear un viaje personalizado
                    </div>
                  </button>
                  <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                    <div className="font-medium text-green-900">
                      Explorar Destinos
                    </div>
                    <div className="text-sm text-green-700">
                      Descubrir nuevos lugares
                    </div>
                  </button>
                  <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                    <div className="font-medium text-purple-900">
                      Ver Mis Reservas
                    </div>
                    <div className="text-sm text-purple-700">
                      Gestionar viajes existentes
                    </div>
                  </button>
                </div>
              </div>
            </GlassCard>

            {/* Favorite Destinations */}
            <GlassCard>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Destinos Favoritos
                </h3>
                <div className="space-y-3">
                  {stats.favoriteDestinations.map((destination, index) => (
                    <div
                      key={destination}
                      className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <span className="font-medium text-neutral-900">
                          {destination}
                        </span>
                      </div>
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Role-specific content */}
        {userRole === 'tripper' && (
          <div className="mt-8">
            <GlassCard>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                  Panel de Tripper
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all">
                    <div className="font-semibold">Mis Paquetes</div>
                    <div className="text-sm opacity-90">Gestionar ofertas</div>
                  </button>
                  <button className="p-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:from-green-600 hover:to-teal-700 transition-all">
                    <div className="font-semibold">Estadísticas</div>
                    <div className="text-sm opacity-90">Ver rendimiento</div>
                  </button>
                  <button className="p-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all">
                    <div className="font-semibold">Reservas</div>
                    <div className="text-sm opacity-90">Gestionar clientes</div>
                  </button>
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </main>
    </>
  );
}

const DashboardPage = dynamic(() => Promise.resolve(DashboardPageComponent), {
  ssr: false,
});

function DashboardPageComponent() {
  return (
    <SecureRoute>
      <DashboardContent />
    </SecureRoute>
  );
}

export default DashboardPage;
