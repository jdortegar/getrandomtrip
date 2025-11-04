'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

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

export default function TripperRoutesPage() {
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
      <div className="p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-neutral-800">Mis Paquetes</h1>
        <Link
          href="/tripper/packages/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
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

      <div className="bg-white p-6 rounded-2xl shadow">
        {filteredRoutes.length === 0 ? (
          <p className="text-center text-neutral-500 py-8">
            {packages.length === 0
              ? 'No tienes paquetes aún. Crea tu primer paquete para comenzar.'
              : 'No hay paquetes que coincidan con los filtros.'}
          </p>
        ) : (
          <table className="min-w-full table-auto">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-neutral-600">Título</th>
                <th className="px-4 py-2 text-left text-neutral-600">Tipo</th>
                <th className="px-4 py-2 text-left text-neutral-600">Nivel</th>
                <th className="px-4 py-2 text-left text-neutral-600">Estado</th>
                <th className="px-4 py-2 text-left text-neutral-600">Precio</th>
                <th className="px-4 py-2 text-left text-neutral-600">
                  Actualizado
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRoutes.map((pkg) => (
                <tr key={pkg.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2 text-neutral-800">
                    <Link
                      href={`/dashboard/tripper/packages/${pkg.id}`}
                      className="text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      {pkg.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-neutral-800">
                    {pkg.type.charAt(0).toUpperCase() + pkg.type.slice(1)}
                  </td>
                  <td className="px-4 py-2 text-neutral-800">
                    {pkg.level.charAt(0).toUpperCase() + pkg.level.slice(1)}
                  </td>
                  <td className="px-4 py-2 text-neutral-800">
                    {getStatusLabel(pkg.status)}
                  </td>
                  <td className="px-4 py-2 text-neutral-800">
                    ${pkg.price.toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-2 text-neutral-800">
                    {new Date(pkg.updatedAt).toLocaleDateString('es-ES')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
