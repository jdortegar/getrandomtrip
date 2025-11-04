'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import SecureRoute from '@/components/auth/SecureRoute';
import Section from '@/components/layout/Section';
import Hero from '@/components/Hero';
import GlassCard from '@/components/ui/GlassCard';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import { Plus } from 'lucide-react';

interface Package {
  id: string;
  title: string;
  slug: string;
  type: string;
  level: string;
  status: string;
  isActive: boolean;
  price: number;
  destination: string;
  createdAt: string;
  updatedAt: string;
}

function TripperPackagesPage() {
  const { data: session } = useSession();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState<string | 'all'>('all');

  useEffect(() => {
    async function fetchPackages() {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        const response = await fetch('/api/tripper/packages');
        const data = await response.json();

        if (response.ok && data.packages) {
          setPackages(data.packages);
        } else {
          console.error('Error fetching packages:', data.error);
        }
      } catch (error) {
        console.error('Error fetching packages:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPackages();
  }, [session?.user?.id]);

  // Get unique statuses and levels from packages
  const routeStatuses = useMemo(() => {
    const statuses = Array.from(new Set(packages.map((pkg) => pkg.status)));
    return statuses.sort();
  }, [packages]);

  const routeLevels = useMemo(() => {
    const levels = Array.from(new Set(packages.map((pkg) => pkg.level)));
    return levels.sort();
  }, [packages]);

  const filteredRoutes = useMemo(() => {
    return packages.filter((pkg) => {
      const statusMatch =
        selectedStatus === 'all' || pkg.status === selectedStatus;
      const levelMatch = selectedLevel === 'all' || pkg.level === selectedLevel;
      return statusMatch && levelMatch;
    });
  }, [packages, selectedStatus, selectedLevel]);

  const getStatusLabel = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <>
        <Hero
          content={{
            title: 'Mis Paquetes',
            subtitle: 'Cargando tus paquetes...',
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

  return (
    <>
      <Hero
        content={{
          title: 'Mis Paquetes',
          subtitle: 'Gestiona tus ofertas de viaje',
          videoSrc: '/videos/hero-video.mp4',
          fallbackImage: '/images/bg-playa-mexico.jpg',
        }}
        className="!h-[40vh]"
      />

      <Section>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-neutral-800">Mis Paquetes</h1>
            <Link
              href="/dashboard/tripper/packages/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Paquete
            </Link>
          </div>

          <div className="flex gap-4 mb-6">
            <select
              className="p-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">Todos los Estados</option>
              {routeStatuses.map((status) => (
                <option key={status} value={status}>
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>

            <select
              className="p-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
            >
              <option value="all">Todos los Niveles</option>
              {routeLevels.map((level) => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <GlassCard>
            <div className="p-6">
              {filteredRoutes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-500 mb-4">
                    {packages.length === 0
                      ? 'No tienes paquetes aún. Crea tu primer paquete para comenzar.'
                      : 'No hay paquetes que coincidan con los filtros.'}
                  </p>
                  {packages.length === 0 && (
                    <Link
                      href="/dashboard/tripper/packages/new"
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Crear Primer Paquete
                    </Link>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                          Título
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                          Nivel
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                          Precio
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                          Actualizado
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRoutes.map((pkg) => (
                        <tr
                          key={pkg.id}
                          className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-neutral-800">
                            <Link
                              href={`/dashboard/tripper/packages/${pkg.id}`}
                              className="text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                            >
                              {pkg.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-neutral-800">
                            {pkg.type.charAt(0).toUpperCase() + pkg.type.slice(1)}
                          </td>
                          <td className="px-4 py-3 text-neutral-800">
                            {pkg.level.charAt(0).toUpperCase() + pkg.level.slice(1)}
                          </td>
                          <td className="px-4 py-3 text-neutral-800">
                            <span className="px-2 py-1 text-xs rounded-full bg-neutral-100 text-neutral-700">
                              {getStatusLabel(pkg.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-neutral-800">
                            ${pkg.price.toLocaleString('es-AR')}
                          </td>
                          <td className="px-4 py-3 text-neutral-800 text-sm">
                            {new Date(pkg.updatedAt).toLocaleDateString('es-ES')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </Section>
    </>
  );
}

function TripperPackagesPageWrapper() {
  return (
    <SecureRoute requiredRole="tripper">
      <TripperPackagesPage />
    </SecureRoute>
  );
}

export default TripperPackagesPageWrapper;
