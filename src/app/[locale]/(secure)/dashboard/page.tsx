'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import SecureRoute from '@/components/auth/SecureRoute';
import Section from '@/components/layout/Section';
import Hero from '@/components/Hero';
import { Button } from '@/components/ui/Button';
import {
  Calendar,
  MapPin,
  Plane,
  Star,
  TrendingUp,
  DollarSign,
  Clock,
  Plus,
  ArrowRight,
  Eye,
  CreditCard,
} from 'lucide-react';
import { useUserStore } from '@/store/slices';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import { useRouter } from 'next/navigation';

interface Trip {
  id: string;
  type: string;
  level: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  status: string;
  actualDestination?: string | null;
  customerRating?: number | null;
  totalTripUsd: number;
  payment?: {
    status: string;
    amount: number;
  };
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  trip: {
    type: string;
    level: string;
    startDate: string;
  };
}

interface DashboardStats {
  totalTrips: number;
  upcomingTrips: number;
  completedTrips: number;
  totalSpent: number;
  averageRating: number;
}

function DashboardContent() {
  const { data: session } = useSession();
  const { user } = useUserStore();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTrips: 0,
    upcomingTrips: 0,
    completedTrips: 0,
    totalSpent: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);

  const currentUser = session?.user || user;

  // Normalize role - handle both uppercase (DB) and lowercase (store) formats
  const normalizeRole = (role: string | undefined): string | null => {
    if (!role) return null;
    return role.toLowerCase();
  };

  // Get role from multiple possible sources (session might have uppercase TRIPPER)
  const rawRole =
    (session?.user as any)?.role || (currentUser as any)?.role || user?.role;

  const userRole = normalizeRole(rawRole);

  // Redirect trippers to their dashboard - check once and redirect immediately
  useEffect(() => {
    if (!hasRedirected && userRole === 'tripper') {
      setHasRedirected(true);
      // Use push with replace: true to avoid adding to history
      router.push('/dashboard/tripper');
    }
  }, [userRole, router, hasRedirected]);

  // Don't render client dashboard content if user is a tripper
  if (userRole === 'tripper') {
    return <LoadingSpinner />;
  }

  // Show loading if session is still loading and we don't have a user yet
  if (!currentUser?.id && !user?.id) {
    return <LoadingSpinner />;
  }

  // Fetch user trips and payments
  useEffect(() => {
    async function fetchDashboardData() {
      if (!currentUser?.id) return;

      try {
        setLoading(true);

        // Fetch trips
        const tripsRes = await fetch(`/api/trips?userId=${currentUser.id}`);
        const tripsData = await tripsRes.json();

        if (tripsData.error) {
          console.error('Error fetching trips:', tripsData.error);
          return;
        }

        setTrips(tripsData.trips || []);

        // Fetch payments
        const paymentsRes = await fetch(
          `/api/payments?userId=${currentUser.id}`,
        );
        const paymentsData = await paymentsRes.json();

        if (paymentsData.error) {
          console.error('Error fetching payments:', paymentsData.error);
          return;
        }

        setPayments(paymentsData.payments || []);

        // Calculate stats
        const allTrips = tripsData.trips || [];
        const allPayments = paymentsData.payments || [];

        const completed = allTrips.filter(
          (t: Trip) => t.status === 'COMPLETED',
        ).length;
        const upcoming = allTrips.filter(
          (t: Trip) => t.status === 'CONFIRMED' || t.status === 'REVEALED',
        ).length;

        const totalSpent = allPayments
          .filter(
            (p: Payment) => p.status === 'APPROVED' || p.status === 'COMPLETED',
          )
          .reduce((sum: number, p: Payment) => sum + p.amount, 0);

        const ratingsTrips = allTrips.filter((t: Trip) => t.customerRating);
        const avgRating =
          ratingsTrips.length > 0
            ? ratingsTrips.reduce(
                (sum: number, t: Trip) => sum + (t.customerRating || 0),
                0,
              ) / ratingsTrips.length
            : 0;

        setStats({
          totalTrips: allTrips.length,
          upcomingTrips: upcoming,
          completedTrips: completed,
          totalSpent,
          averageRating: avgRating,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [currentUser?.id]);

  const upcomingTrips = trips
    .filter((t) => t.status === 'CONFIRMED' || t.status === 'REVEALED')
    .slice(0, 3);

  const recentPayments = payments.slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'REVEALED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Completado';
      case 'CONFIRMED':
        return 'Confirmado';
      case 'REVEALED':
        return 'Revelado';
      case 'CANCELLED':
        return 'Cancelado';
      case 'DRAFT':
        return 'Borrador';
      case 'SAVED':
        return 'Guardado';
      default:
        return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return 'text-green-600';
      case 'PENDING':
        return 'text-yellow-600';
      case 'FAILED':
      case 'REJECTED':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <>
      <Hero
        content={{
          title: `¡Hola, ${currentUser?.name || 'Viajero'}!`,
          subtitle: 'Gestiona tus viajes y descubre nuevas aventuras',
          videoSrc: '/videos/hero-video.mp4',
          fallbackImage: '/images/bg-playa-mexico.jpg',
        }}
        className="!h-[40vh]"
      />

      <Section>
        <div className="rt-container">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600 mb-1">
                        Viajes Totales
                      </p>
                      <p className="text-3xl font-bold text-neutral-900">
                        {stats.totalTrips}
                      </p>
                    </div>
                    <Plane className="h-10 w-10 text-blue-600" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600 mb-1">
                        Próximos Viajes
                      </p>
                      <p className="text-3xl font-bold text-neutral-900">
                        {stats.upcomingTrips}
                      </p>
                    </div>
                    <Calendar className="h-10 w-10 text-green-600" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600 mb-1">
                        Gasto Total
                      </p>
                      <p className="text-3xl font-bold text-neutral-900">
                        ${stats.totalSpent.toFixed(0)}
                      </p>
                    </div>
                    <DollarSign className="h-10 w-10 text-purple-600" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600 mb-1">
                        Rating Promedio
                      </p>
                      <p className="text-3xl font-bold text-neutral-900">
                        {stats.averageRating > 0
                          ? stats.averageRating.toFixed(1)
                          : '—'}
                      </p>
                    </div>
                    <Star className="h-10 w-10 text-yellow-500" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming Trips */}
                <div className="lg:col-span-2">
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-neutral-900 font-jost">
                        Próximos Viajes
                      </h2>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/journey/basic-config">
                          <Plus className="w-4 h-4 mr-2" />
                          Nuevo Viaje
                        </Link>
                      </Button>
                    </div>

                    {upcomingTrips.length === 0 ? (
                      <div className="text-center py-12">
                        <Plane className="h-16 w-16 mx-auto mb-4 text-neutral-300" />
                        <h3 className="text-lg font-medium text-neutral-700 mb-2">
                          No tienes viajes próximos
                        </h3>
                        <p className="text-neutral-500 mb-4">
                          ¡Comienza tu próxima aventura ahora!
                        </p>
                        <Button asChild>
                          <Link href="/journey/basic-config">
                            <Plus className="w-4 h-4 mr-2" />
                            Planificar Viaje
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {upcomingTrips.map((trip) => (
                          <div
                            key={trip.id}
                            className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-neutral-900">
                                    {trip.actualDestination ||
                                      '🔒 Destino Sorpresa'}
                                  </h3>
                                  <span
                                    className={`px-2 py-0.5 text-xs rounded-full border ${getStatusColor(trip.status)}`}
                                  >
                                    {getStatusLabel(trip.status)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-neutral-600">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>
                                      {trip.city}, {trip.country}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                      {new Date(
                                        trip.startDate,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/trips/${trip.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver Detalles
                                </Link>
                              </Button>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                              <span className="text-sm text-neutral-600">
                                {trip.type} • {trip.level}
                              </span>
                              <span className="font-semibold text-neutral-900">
                                ${trip.totalTripUsd.toFixed(0)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4 font-jost">
                      Acciones Rápidas
                    </h3>
                    <div className="space-y-3">
                      <Button asChild className="w-full justify-start">
                        <Link href="/journey/basic-config">
                          <Plus className="w-4 h-4 mr-2" />
                          Planificar Nuevo Viaje
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="secondary"
                        className="w-full justify-start"
                      >
                        <Link href="/profile">
                          <MapPin className="w-4 h-4 mr-2" />
                          Ver Mi Perfil
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="secondary"
                        className="w-full justify-start"
                      >
                        <Link href="#historial">
                          <Clock className="w-4 h-4 mr-2" />
                          Historial de Pagos
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Recent Payments Summary */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4 font-jost">
                      Resumen Financiero
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <span className="text-sm text-neutral-600">
                          Total Gastado
                        </span>
                        <span className="font-bold text-neutral-900">
                          ${stats.totalSpent.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <span className="text-sm text-neutral-600">
                          Pagos Completados
                        </span>
                        <span className="font-bold text-green-600">
                          {
                            payments.filter(
                              (p) =>
                                p.status === 'APPROVED' ||
                                p.status === 'COMPLETED',
                            ).length
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <span className="text-sm text-neutral-600">
                          Pagos Pendientes
                        </span>
                        <span className="font-bold text-yellow-600">
                          {
                            payments.filter((p) => p.status === 'PENDING')
                              .length
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Payments Table */}
              <div className="mt-8">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-neutral-900 font-jost">
                      Historial de Pagos
                    </h2>
                    <span className="text-sm text-neutral-600">
                      {payments.length} transacciones
                    </span>
                  </div>

                  {recentPayments.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">
                      <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No hay pagos registrados</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">
                              Fecha
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">
                              Viaje
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">
                              Monto
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">
                              Estado
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentPayments.map((payment) => (
                            <tr
                              key={payment.id}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="py-4 px-4 text-sm text-neutral-900">
                                {new Date(
                                  payment.createdAt,
                                ).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-sm">
                                  <div className="font-medium text-neutral-900">
                                    {payment.trip.type} • {payment.trip.level}
                                  </div>
                                  <div className="text-xs text-neutral-500">
                                    {new Date(
                                      payment.trip.startDate,
                                    ).toLocaleDateString()}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-sm font-semibold text-neutral-900">
                                ${payment.amount.toFixed(2)}
                              </td>
                              <td className="py-4 px-4">
                                <span
                                  className={`text-sm font-medium ${getPaymentStatusColor(payment.status)}`}
                                >
                                  {payment.status === 'APPROVED'
                                    ? 'Aprobado'
                                    : payment.status === 'PENDING'
                                      ? 'Pendiente'
                                      : payment.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* All Trips Section */}
              {trips.length > 0 && (
                <div className="mt-8">
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-neutral-900 font-jost">
                        Todos Mis Viajes
                      </h2>
                      <span className="text-sm text-neutral-600">
                        {trips.length} viajes
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {trips.map((trip) => (
                        <div
                          key={trip.id}
                          className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-neutral-900 mb-1">
                                {trip.actualDestination ||
                                  '🔒 Destino Sorpresa'}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-neutral-600">
                                <MapPin className="h-3.5 w-3.5" />
                                <span>
                                  Desde {trip.city}, {trip.country}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(trip.status)}`}
                            >
                              {getStatusLabel(trip.status)}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-neutral-500 mb-3">
                            <span>
                              {new Date(trip.startDate).toLocaleDateString()} →{' '}
                              {new Date(trip.endDate).toLocaleDateString()}
                            </span>
                            {trip.customerRating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                <span>{trip.customerRating}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                            <span className="text-sm font-medium text-neutral-900">
                              ${trip.totalTripUsd.toFixed(0)}
                            </span>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/trips/${trip.id}`}>
                                Ver más
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Section>
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
