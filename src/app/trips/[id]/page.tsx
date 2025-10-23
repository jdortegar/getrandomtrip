'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import SecureRoute from '@/components/auth/SecureRoute';
import Section from '@/components/layout/Section';
import Hero from '@/components/Hero';
import { Button } from '@/components/ui/button';
import Chip from '@/components/badge';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Moon,
  Plane,
  Star,
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  DollarSign,
  CheckCircle,
  Clock,
  X as XIcon,
} from 'lucide-react';
import { FILTER_OPTIONS } from '@/store/slices/journeyStore';
import { ADDONS } from '@/lib/data/shared/addons-catalog';

interface TripDetails {
  id: string;
  type: string;
  level: string;
  status: string;
  from: string;

  // Logistics
  country: string;
  city: string;
  startDate: string;
  endDate: string;
  nights: number;
  pax: number;

  // Filters
  transport: string;
  climate: string;
  maxTravelTime: string;
  departPref: string;
  arrivePref: string;
  avoidDestinations: string[];

  // Addons
  addons: any;

  // Pricing
  basePriceUsd: number;
  displayPrice: string;
  filtersCostUsd: number;
  addonsCostUsd: number;
  totalPerPaxUsd: number;
  totalTripUsd: number;

  // Completed trip data
  actualDestination?: string | null;
  destinationRevealedAt?: string | null;
  completedAt?: string | null;
  customerRating?: number | null;
  customerFeedback?: string | null;

  // Relations
  payment?: {
    id: string;
    status: string;
    amount: number;
    provider: string;
    providerPaymentId?: string;
    createdAt: string;
    paidAt?: string | null;
  };

  createdAt: string;
  updatedAt: string;
}

function TripDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDestination, setShowDestination] = useState(false);

  const tripId = params.id as string;

  useEffect(() => {
    async function fetchTripDetails() {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/trips/${tripId}`);
        const data = await response.json();

        if (data.error) {
          console.error('Error fetching trip:', data.error);
          return;
        }

        setTrip(data.trip);

        // Auto-show destination if revealed or completed
        if (
          data.trip.status === 'REVEALED' ||
          data.trip.status === 'COMPLETED'
        ) {
          setShowDestination(true);
        }
      } catch (error) {
        console.error('Error fetching trip details:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTripDetails();
  }, [tripId, session?.user?.id]);

  if (loading) {
    return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
  }

  if (!trip) {
    return (
      <>
        <Hero
          content={{
            title: 'Viaje no encontrado',
            subtitle: 'No pudimos encontrar este viaje',
            videoSrc: '/videos/hero-video.mp4',
            fallbackImage: '/images/bg-playa-mexico.jpg',
          }}
          className="!h-[40vh]"
        />
        <Section>
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-neutral-600 mb-6">
                El viaje que buscas no existe o no tienes permiso para verlo.
              </p>
              <Button asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </Section>
      </>
    );
  }

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
    const labels: Record<string, string> = {
      DRAFT: 'Borrador',
      SAVED: 'Guardado',
      PENDING_PAYMENT: 'Pendiente de Pago',
      CONFIRMED: 'Confirmado',
      REVEALED: 'Revelado',
      COMPLETED: 'Completado',
      CANCELLED: 'Cancelado',
    };
    return labels[status] || status;
  };

  const filterChips = [
    { key: 'transport', value: trip.transport },
    { key: 'climate', value: trip.climate },
    { key: 'maxTravelTime', value: trip.maxTravelTime },
    { key: 'departPref', value: trip.departPref },
    { key: 'arrivePref', value: trip.arrivePref },
  ].map((f) => {
    const option = FILTER_OPTIONS[f.key as keyof typeof FILTER_OPTIONS];
    const selected = option.options.find((opt: any) => opt.key === f.value);
    return {
      category: option.label,
      value: selected?.label || f.value,
    };
  });

  const addonsList = Array.isArray(trip.addons) ? trip.addons : [];
  const addonChips = addonsList
    .map((addon: any) => {
      const addonData = ADDONS.find((a) => a.id === addon.id);
      if (!addonData) return null;

      return {
        id: addon.id,
        category: addonData.category,
        value:
          addon.qty > 1 ? `${addonData.title} ×${addon.qty}` : addonData.title,
      };
    })
    .filter(Boolean);

  const canRevealDestination =
    trip.status === 'REVEALED' || trip.status === 'COMPLETED';

  return (
    <>
      <Hero
        content={{
          title:
            showDestination && trip.actualDestination
              ? trip.actualDestination
              : '🔒 Destino Sorpresa',
          subtitle: `Viaje ${trip.type} • ${trip.level}`,
          videoSrc: '/videos/hero-video.mp4',
          fallbackImage: '/images/bg-playa-mexico.jpg',
        }}
        className="!h-[50vh]"
      />

      <Section>
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Dashboard
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Trip Overview */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-2xl font-bold text-neutral-900 font-jost">
                    Detalles del Viaje
                  </h2>
                  <span
                    className={`px-3 py-1.5 text-sm rounded-full border ${getStatusColor(trip.status)}`}
                  >
                    {getStatusLabel(trip.status)}
                  </span>
                </div>

                {/* Destination Reveal */}
                {canRevealDestination && (
                  <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-purple-900 mb-1">
                          {showDestination
                            ? '🎉 Destino Revelado'
                            : '🔒 Destino Oculto'}
                        </h3>
                        <p className="text-sm text-purple-700">
                          {showDestination
                            ? trip.actualDestination
                            : 'Haz clic para revelar tu destino'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDestination(!showDestination)}
                      >
                        {showDestination ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Ocultar
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Revelar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Logistics Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-neutral-500" />
                      <span className="text-xs text-neutral-600">
                        Salida desde
                      </span>
                    </div>
                    <p className="font-medium text-neutral-900">
                      {trip.city}, {trip.country}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-neutral-500" />
                      <span className="text-xs text-neutral-600">
                        Pasajeros
                      </span>
                    </div>
                    <p className="font-medium text-neutral-900">{trip.pax}</p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-neutral-500" />
                      <span className="text-xs text-neutral-600">Fechas</span>
                    </div>
                    <p className="font-medium text-neutral-900 text-sm">
                      {new Date(trip.startDate).toLocaleDateString()} →{' '}
                      {new Date(trip.endDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <Moon className="h-4 w-4 text-neutral-500" />
                      <span className="text-xs text-neutral-600">Noches</span>
                    </div>
                    <p className="font-medium text-neutral-900">
                      {trip.nights}
                    </p>
                  </div>
                </div>
              </div>

              {/* Filters & Preferences */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-xl font-semibold text-neutral-900 mb-4 font-jost">
                  Filtros y Preferencias ({filterChips.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {filterChips.map((chip, index) => (
                    <Chip
                      key={index}
                      item={{
                        key: chip.category,
                        label: chip.category,
                        value: chip.value,
                      }}
                      color="primary"
                      size="md"
                    />
                  ))}
                </div>

                {trip.avoidDestinations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-neutral-700 mb-2">
                      Destinos a evitar
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {trip.avoidDestinations.map((dest, index) => (
                        <Chip
                          key={index}
                          item={{
                            key: dest,
                            label: 'Ciudad',
                            value: dest,
                          }}
                          color="secondary"
                          size="sm"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Add-ons */}
              {addonChips.length > 0 && (
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-semibold text-neutral-900 mb-4 font-jost">
                    Add-ons ({addonChips.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {addonChips.map((addon: any, index: number) => (
                      <Chip
                        key={index}
                        item={{
                          key: addon.id,
                          label: addon.category,
                          value: addon.value,
                        }}
                        color="success"
                        size="md"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Review */}
              {trip.customerRating && (
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-semibold text-neutral-900 mb-4 font-jost">
                    Mi Reseña
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < (trip.customerRating || 0)
                            ? 'text-yellow-500 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="font-semibold text-neutral-900">
                      {trip.customerRating.toFixed(1)}
                    </span>
                  </div>
                  {trip.customerFeedback && (
                    <p className="text-neutral-700">{trip.customerFeedback}</p>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pricing Summary */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4 font-jost">
                  Resumen de Costos
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-sm text-neutral-600">
                      Precio Base
                    </span>
                    <span className="font-semibold text-neutral-900">
                      ${trip.basePriceUsd.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-sm text-neutral-600">Filtros</span>
                    <span className="font-semibold text-neutral-900">
                      ${trip.filtersCostUsd.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-sm text-neutral-600">Add-ons</span>
                    <span className="font-semibold text-neutral-900">
                      ${trip.addonsCostUsd.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-semibold text-neutral-900">
                      Total Viaje
                    </span>
                    <span className="text-xl font-bold text-blue-600">
                      ${trip.totalTripUsd.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-neutral-600">
                    <span>Por persona</span>
                    <span className="font-medium">
                      ${trip.totalPerPaxUsd.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              {trip.payment && (
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4 font-jost">
                    Información de Pago
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {trip.payment.status === 'APPROVED' ||
                      trip.payment.status === 'COMPLETED' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : trip.payment.status === 'PENDING' ? (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <XIcon className="h-5 w-5 text-red-600" />
                      )}
                      <span
                        className={`font-medium ${
                          trip.payment.status === 'APPROVED' ||
                          trip.payment.status === 'COMPLETED'
                            ? 'text-green-600'
                            : trip.payment.status === 'PENDING'
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }`}
                      >
                        {trip.payment.status === 'APPROVED'
                          ? 'Pago Aprobado'
                          : trip.payment.status === 'COMPLETED'
                            ? 'Pago Completado'
                            : trip.payment.status === 'PENDING'
                              ? 'Pago Pendiente'
                              : 'Pago Fallido'}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-gray-200 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Monto</span>
                        <span className="font-semibold text-neutral-900">
                          ${trip.payment.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Proveedor</span>
                        <span className="font-medium text-neutral-900 capitalize">
                          {trip.payment.provider}
                        </span>
                      </div>
                      {trip.payment.providerPaymentId && (
                        <div className="flex justify-between">
                          <span className="text-neutral-600">ID Pago</span>
                          <span className="font-mono text-xs text-neutral-900">
                            {trip.payment.providerPaymentId.slice(0, 12)}...
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Fecha</span>
                        <span className="text-neutral-900">
                          {new Date(
                            trip.payment.createdAt,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Trip Timeline */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4 font-jost">
                  Línea de Tiempo
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">
                        Viaje creado
                      </p>
                      <p className="text-sm text-neutral-600">
                        {new Date(trip.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {trip.payment?.paidAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">
                          Pago confirmado
                        </p>
                        <p className="text-sm text-neutral-600">
                          {new Date(trip.payment.paidAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {trip.destinationRevealedAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Eye className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">
                          Destino revelado
                        </p>
                        <p className="text-sm text-neutral-600">
                          {new Date(
                            trip.destinationRevealedAt,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {trip.completedAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">
                          Viaje completado
                        </p>
                        <p className="text-sm text-neutral-600">
                          {new Date(trip.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - empty for now, can add actions later */}
            <div className="space-y-6">
              {/* Actions */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4 font-jost">
                  Acciones
                </h3>
                <div className="space-y-3">
                  {trip.status === 'COMPLETED' && !trip.customerRating && (
                    <Button className="w-full justify-start">
                      <Star className="w-4 h-4 mr-2" />
                      Dejar Reseña
                    </Button>
                  )}

                  {(trip.status === 'CONFIRMED' ||
                    trip.status === 'REVEALED') && (
                    <Button
                      variant="secondary"
                      className="w-full justify-start"
                      asChild
                    >
                      <Link href={`/trips/${trip.id}/details`}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Ver Itinerario
                      </Link>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/dashboard">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Volver al Dashboard
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Trip Info Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-2">
                  ℹ️ Información del Viaje
                </h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>
                    • Tipo: <strong>{trip.type}</strong>
                  </li>
                  <li>
                    • Nivel: <strong>{trip.level}</strong>
                  </li>
                  {trip.status === 'CONFIRMED' && (
                    <li>• El destino será revelado 48 horas antes del viaje</li>
                  )}
                  {trip.status === 'REVEALED' && (
                    <li>• ¡Tu destino ha sido revelado!</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

const TripDetailsPage = dynamic(
  () => Promise.resolve(TripDetailsPageComponent),
  {
    ssr: false,
  },
);

function TripDetailsPageComponent() {
  return (
    <SecureRoute>
      <TripDetailsContent />
    </SecureRoute>
  );
}

export default TripDetailsPage;
